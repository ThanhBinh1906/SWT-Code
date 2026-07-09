import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { DataTable } from "../components/DataTable";
import { Field } from "../components/Field";
import { SectionPanel } from "../components/SectionPanel";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { Toolbar } from "../components/Toolbar";
import { shortDate, shortDateTime, todayPlus } from "../utils/date";

export function EmployerView({ activeSection, user, show, onSectionChange }) {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const jobStats = useMemo(
    () => ({
      active: jobs.filter((job) => job.postStatus === "Active").length,
      pending: jobs.filter((job) => job.postStatus === "Pending Approval").length,
      draft: jobs.filter((job) => job.postStatus === "Draft").length,
    }),
    [jobs]
  );

  const cvPassedCount = useMemo(
    () => applications.filter((item) => item.applicationStatus === "CV Passed").length,
    [applications]
  );

  const readyForInterview = useMemo(
    () => applications.filter((item) => item.applicationStatus === "CV Passed"),
    [applications]
  );

  const rejectableStatuses = ["New Applied", "CV Passed", "Interview Scheduled", "Interview Passed", "Offered"];

  async function loadEmployerData() {
    try {
      setLoading(true);
      const [jobData, appData, userData, interviewData] = await Promise.all([
        api(`/api/employer/jobs?employerId=${user?.id || 0}`),
        api(`/api/applications?employerId=${user?.id || 0}&includeArchived=false`),
        api(`/api/interviewers?employerId=${user?.id || 0}`),
        api(`/api/interviews?employerId=${user?.id || 0}`),
      ]);
      setJobs(jobData);
      setApplications(appData);
      setInterviewers(userData);
      setInterviews(interviewData);
      show("Employer data loaded");
    } catch (error) {
      show(error.message, true);
    } finally {
      setLoading(false);
    }
  }

  async function saveJob(action) {
    const deadline = new Date(`${jobForm.deadline}T00:00:00`);
    const minDeadline = new Date();
    minDeadline.setHours(0, 0, 0, 0);
    minDeadline.setDate(minDeadline.getDate() + 3);
    if (!jobForm.title.trim() || !jobForm.jobDescription.trim()) {
      show("Title and job description are required", true);
      return;
    }
    if (Number(jobForm.quantity) <= 0) {
      show("Quantity must be greater than 0", true);
      return;
    }
    if (Number.isNaN(deadline.getTime()) || deadline < minDeadline) {
      show("Deadline must be at least 3 days from today", true);
      return;
    }

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
        body: JSON.stringify({ actorId: user?.id || 0, newStatus, note: "Updated from dashboard" }),
      });
      show(data.message);
      loadEmployerData();
    } catch (error) {
      show(error.message, true);
    }
  }

  async function scheduleInterview() {
    if (!selectedApplicationId) {
      show("Select a CV Passed application first", true);
      return;
    }
    if (!interviewForm.interviewerUserIds.length) {
      show("Select at least one interviewer", true);
      return;
    }
    const interviewTime = new Date(interviewForm.interviewTime);
    if (Number.isNaN(interviewTime.getTime())) {
      show("Interview time is required", true);
      return;
    }
    if ([0, 6].includes(interviewTime.getDay())) {
      show("Interview must be Monday-Friday", true);
      return;
    }
    if (interviewForm.interviewMode === "Online" && !interviewForm.locationOrLink.trim()) {
      show("Online meeting link is required", true);
      return;
    }

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
      setSelectedApplicationId("");
      loadEmployerData();
      onSectionChange("interviews");
    } catch (error) {
      show(error.message, true);
    }
  }

  async function updateInterviewResult(id, result) {
    try {
      const data = await api(`/api/interviews/${id}/result`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: user?.id || 0, actorRole: user?.role || "", result }),
      });
      show(data.message);
      loadEmployerData();
    } catch (error) {
      show(error.message, true);
    }
  }

  useEffect(() => {
    loadEmployerData();
  }, []);

  return (
    <div className="view-stack">
      <div className="stats-grid">
        <StatCard label="Active jobs" value={jobStats.active} note="Visible to candidates" tone="success" />
        <StatCard label="Pending approval" value={jobStats.pending} note="Waiting for admin" tone="warning" />
        <StatCard label="Applications" value={applications.length} note={`${cvPassedCount} CV passed`} />
        <StatCard label="Draft posts" value={jobStats.draft} note="Not submitted yet" />
      </div>

      {activeSection === "job-posts" && (
        <>
          <SectionPanel
            title="Khởi tạo tin tuyển dụng"
            description="Create a draft or submit it for admin approval."
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
            <Toolbar title="Job post actions">
              <button onClick={() => saveJob("Submit")} type="button">
                Submit for approval
              </button>
              <button className="secondary" onClick={() => saveJob("Save Draft")} type="button">
                Save draft
              </button>
            </Toolbar>
          </SectionPanel>

          <SectionPanel title="Job posts" description="Review your created job posts.">
            <DataTable
              loading={loading}
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
        </>
      )}

      {activeSection === "applications" && (
        <SectionPanel
          title="Applications"
          description="Screen CVs and move qualified candidates to interview."
          actions={
            <button className="secondary" onClick={loadEmployerData} type="button">
              Refresh
            </button>
          }
        >
          <DataTable
            loading={loading}
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
                    {item.applicationStatus === "New Applied" && <button onClick={() => updateStatus(item.id, "CV Passed")}>Pass CV</button>}
                    {item.applicationStatus === "CV Passed" && (
                      <button
                        className="secondary"
                        onClick={() => {
                          setSelectedApplicationId(String(item.id));
                          onSectionChange("schedule");
                        }}
                      >
                        Schedule
                      </button>
                    )}
                    {item.applicationStatus === "Interview Passed" && <button onClick={() => updateStatus(item.id, "Offered")}>Offer</button>}
                    {item.applicationStatus === "Offered" && <button onClick={() => updateStatus(item.id, "Hired")}>Mark hired</button>}
                    {rejectableStatuses.includes(item.applicationStatus) && (
                      <button className="danger" onClick={() => updateStatus(item.id, "Rejected")}>
                        Reject
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </SectionPanel>
      )}

      {activeSection === "schedule" && (
        <SectionPanel title="Schedule interview" description="Choose a CV-passed candidate and assign interviewers.">
          <div className="form-grid">
            <Field label="Candidate">
              <select value={selectedApplicationId} onChange={(event) => setSelectedApplicationId(event.target.value)}>
                <option value="">Select CV Passed application</option>
                {readyForInterview.map((item) => (
                  <option key={item.id} value={item.id}>
                    #{item.id} - {item.applicantName} - {item.job?.title || "Job"}
                  </option>
                ))}
              </select>
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
          {readyForInterview.length === 0 && (
            <div className="selected-job-note">
              <strong>No candidates ready for interview</strong>
              <span>Pass a CV in Applications first.</span>
            </div>
          )}
          <Toolbar title="Interview action">
            <button onClick={scheduleInterview}>Create interview schedule</button>
          </Toolbar>
        </SectionPanel>
      )}

      {activeSection === "interviews" && (
        <SectionPanel
          title="Interviews"
          description="Review scheduled interviews and record results."
          actions={
            <button className="secondary" onClick={loadEmployerData} type="button">
              Refresh
            </button>
          }
        >
          <DataTable
            loading={loading}
            rows={interviews}
            emptyText="No interviews scheduled."
            columns={[
              { key: "id", header: "ID" },
              { key: "applicantName", header: "Candidate" },
              { key: "jobTitle", header: "Job" },
              { key: "interviewTime", header: "Time", render: (item) => shortDateTime(item.interviewTime) },
              { key: "interviewMode", header: "Mode" },
              { key: "interviewerNames", header: "Interviewers", render: (item) => item.interviewerNames?.join(", ") || "" },
              { key: "interviewStatus", header: "Interview", render: (item) => <StatusBadge value={item.interviewStatus} /> },
              { key: "applicationStatus", header: "Application", render: (item) => <StatusBadge value={item.applicationStatus} /> },
              {
                key: "action",
                header: "Action",
                render: (item) => (
                  <div className="row-actions">
                    {item.applicationStatus === "Interview Scheduled" && (
                      <>
                        <button onClick={() => updateInterviewResult(item.id, "Passed")}>Pass interview</button>
                        <button className="danger" onClick={() => updateInterviewResult(item.id, "Failed")}>
                          Fail interview
                        </button>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </SectionPanel>
      )}
    </div>
  );
}
