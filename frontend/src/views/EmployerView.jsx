import { useEffect, useState } from "react";
import { api } from "../api/client";
import { DataTable } from "../components/DataTable";
import { Field } from "../components/Field";
import { SectionPanel } from "../components/SectionPanel";
import { StatusBadge } from "../components/StatusBadge";
import { shortDate, todayPlus } from "../utils/date";

export function EmployerView({ user, show }) {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [interviewers, setInterviewers] = useState([]);
  const [jobForm, setJobForm] = useState({
    title: "QA Engineer Intern",
    department: "Quality Assurance",
    location: "Ho Chi Minh",
    level: "Intern",
    quantity: 1,
    salaryMin: 300,
    salaryMax: 450,
    salaryType: "Monthly",
    jobDescription: "Execute test cases and report defects.",
    jobRequirements: "Basic testing knowledge",
    deadline: todayPlus(5),
  });
  const [interviewForm, setInterviewForm] = useState({
    interviewTime: `${todayPlus(4)}T09:00`,
    interviewMode: "Online",
    locationOrLink: "https://meet.example.com/rms",
    interviewerUserIds: [],
  });

  async function loadEmployerData() {
    try {
      const [jobData, appData, userData] = await Promise.all([
        api("/api/employer/jobs"),
        api("/api/applications?includeArchived=false"),
        api("/api/admin/users"),
      ]);
      setJobs(jobData);
      setApplications(appData);
      setInterviewers(userData.filter((item) => item.role === "Interviewer"));
      show("Employer data loaded");
    } catch (error) {
      show(error.message, true);
    }
  }

  async function saveJob(action) {
    try {
      const data = await api("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...jobForm,
          employerId: user?.id || 0,
          quantity: Number(jobForm.quantity),
          salaryMin: Number(jobForm.salaryMin),
          salaryMax: Number(jobForm.salaryMax),
          action,
        }),
      });
      show(data.message);
      loadEmployerData();
    } catch (error) {
      show(error.message, true);
    }
  }

  function clearJobForm() {
    setJobForm({
      title: "",
      department: "",
      location: "",
      level: "",
      quantity: 0,
      salaryMin: 0,
      salaryMax: 0,
      salaryType: "Monthly",
      jobDescription: "",
      jobRequirements: "",
      deadline: todayPlus(2),
    });
    show("Form cleared");
  }

  async function updateStatus(id, newStatus) {
    try {
      const data = await api(`/api/applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: user?.id || 0, newStatus, note: "Updated from demo UI" }),
      });
      show(data.message);
      loadEmployerData();
    } catch (error) {
      show(error.message, true);
    }
  }

  async function scheduleInterview() {
    try {
      const data = await api("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: Number(selectedApplicationId),
          scheduledByUserId: user?.id || 0,
          interviewTime: interviewForm.interviewTime,
          interviewMode: interviewForm.interviewMode,
          locationOrLink: interviewForm.locationOrLink,
          interviewerUserIds: interviewForm.interviewerUserIds.map(Number),
        }),
      });
      show(data.message);
    } catch (error) {
      show(error.message, true);
    }
  }

  useEffect(() => {
    loadEmployerData();
  }, []);

  return (
    <div className="view-stack">
      <SectionPanel
        title="Khởi tạo tin tuyển dụng"
        description="Create a job post, save it as draft, or submit it for approval. The form keeps the exact validation rules from the test cases."
        actions={
          <button className="secondary" onClick={clearJobForm} type="button">
            Clear form
          </button>
        }
      >
        <div className="form-grid">
          {[
            ["title", "Title"],
            ["department", "Department"],
            ["location", "Location"],
            ["level", "Level"],
            ["quantity", "Quantity"],
            ["salaryMin", "Salary min"],
            ["salaryMax", "Salary max"],
            ["deadline", "Deadline"],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                type={key === "deadline" ? "date" : ["quantity", "salaryMin", "salaryMax"].includes(key) ? "number" : "text"}
                value={jobForm[key]}
                onChange={(event) => setJobForm({ ...jobForm, [key]: event.target.value })}
              />
            </Field>
          ))}
        </div>
        <Field label="Job description">
          <textarea value={jobForm.jobDescription} onChange={(event) => setJobForm({ ...jobForm, jobDescription: event.target.value })} />
        </Field>
        <Field label="Job requirements">
          <textarea value={jobForm.jobRequirements} onChange={(event) => setJobForm({ ...jobForm, jobRequirements: event.target.value })} />
        </Field>
        <div className="actions">
          <button onClick={() => saveJob("Submit")} type="button">
            Submit job post
          </button>
          <button className="secondary" onClick={() => saveJob("Save Draft")} type="button">
            Save draft
          </button>
        </div>
      </SectionPanel>

      <SectionPanel title="Job posts" description="Draft, pending, rejected, and active posts for employer review.">
        <DataTable
          rows={jobs}
          emptyText="No job posts yet."
          columns={[
            { key: "id", header: "ID" },
            { key: "title", header: "Title" },
            { key: "postStatus", header: "Status", render: (job) => <StatusBadge value={job.postStatus} /> },
            { key: "deadline", header: "Deadline", render: (job) => shortDate(job.deadline) },
          ]}
        />
      </SectionPanel>

      <SectionPanel
        title="Applications"
        description="Filter result is handled by backend. Rejected candidates are archived automatically."
        actions={
          <button className="secondary" onClick={loadEmployerData} type="button">
            Refresh
          </button>
        }
      >
        <DataTable
          rows={applications}
          emptyText="No active applications in the processing queue."
          columns={[
            { key: "id", header: "ID" },
            { key: "applicantName", header: "Candidate" },
            { key: "candidateEmail", header: "Email" },
            { key: "job", header: "Job", render: (item) => item.job?.title || "" },
            { key: "applicationStatus", header: "Status", render: (item) => <StatusBadge value={item.applicationStatus} /> },
            {
              key: "action",
              header: "Action",
              render: (item) => (
                <div className="row-actions">
                  <button onClick={() => updateStatus(item.id, "CV Passed")}>Pass CV</button>
                  <button className="danger" onClick={() => updateStatus(item.id, "Rejected")}>
                    Reject
                  </button>
                  <button className="secondary" onClick={() => setSelectedApplicationId(item.id)}>
                    Select
                  </button>
                </div>
              ),
            },
          ]}
        />
      </SectionPanel>

      <SectionPanel title="Schedule interview" description="Only CV Passed candidates can be scheduled. Online mode requires a meeting link.">
        <div className="form-grid">
          <Field label="Application ID">
            <input value={selectedApplicationId} onChange={(event) => setSelectedApplicationId(event.target.value)} />
          </Field>
          <Field label="Interview time">
            <input
              type="datetime-local"
              value={interviewForm.interviewTime}
              onChange={(event) => setInterviewForm({ ...interviewForm, interviewTime: event.target.value })}
            />
          </Field>
          <Field label="Mode">
            <select value={interviewForm.interviewMode} onChange={(event) => setInterviewForm({ ...interviewForm, interviewMode: event.target.value })}>
              <option>Online</option>
              <option>Offline</option>
            </select>
          </Field>
          <Field label="Link / Room">
            <input value={interviewForm.locationOrLink} onChange={(event) => setInterviewForm({ ...interviewForm, locationOrLink: event.target.value })} />
          </Field>
          <Field label="Interviewers">
            <select
              multiple
              value={interviewForm.interviewerUserIds}
              onChange={(event) =>
                setInterviewForm({
                  ...interviewForm,
                  interviewerUserIds: Array.from(event.target.selectedOptions).map((option) => option.value),
                })
              }
            >
              {interviewers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="actions">
          <button onClick={scheduleInterview}>Create interview schedule</button>
        </div>
      </SectionPanel>
    </div>
  );
}
