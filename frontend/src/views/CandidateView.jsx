import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { DataTable } from "../components/DataTable";
import { Field } from "../components/Field";
import { SectionPanel } from "../components/SectionPanel";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { Toolbar } from "../components/Toolbar";
import { shortDate } from "../utils/date";

const candidateEmail = "candidate@example.com";

export function CandidateView({ activeSection, user, show, onSectionChange }) {
  const currentEmail = user?.email || candidateEmail;
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingJobDetail, setLoadingJobDetail] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filters, setFilters] = useState({ keyword: "", location: "", level: "" });
  const [form, setForm] = useState({
    fullName: "Nguyen Van A",
    email: currentEmail,
    phone: "0912345678",
    coverLetter: "I want to apply for this job.",
  });
  const [cvFile, setCvFile] = useState(null);
  const [cvInputKey, setCvInputKey] = useState(0);

  const pendingCount = useMemo(
    () => history.filter((item) => item.status !== "Rejected").length,
    [history]
  );

  async function loadJobs() {
    try {
      setLoadingJobs(true);
      const query = new URLSearchParams(filters).toString();
      const data = await api(`/api/jobs?${query}`);
      setJobs(data);
      show(data.length ? `Found ${data.length} active job(s)` : "No matching jobs");
    } catch (error) {
      show(error.message, true);
    } finally {
      setLoadingJobs(false);
    }
  }

  async function loadHistory(email = form.email) {
    try {
      setLoadingHistory(true);
      const data = await api(`/api/candidate/applications?email=${encodeURIComponent(email)}`);
      setHistory(data);
      show(`Loaded ${data.length} application history row(s)`);
    } catch (error) {
      show(error.message, true);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function viewJobDetail(id) {
    try {
      setLoadingJobDetail(true);
      const data = await api(`/api/jobs/${id}`);
      setSelectedJob(data);
      show(`Viewing job detail: ${data.title} #${data.id}`);
    } catch (error) {
      show(error.message, true);
    } finally {
      setLoadingJobDetail(false);
    }
  }

  async function submitApplication(event) {
    event.preventDefault();
    if (!selectedJob) {
      show("Select a job first", true);
      return;
    }
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      show("Full name, email, and phone are required", true);
      return;
    }
    if (!form.email.includes("@")) {
      show("Email is invalid", true);
      return;
    }
    if (!cvFile) {
      show("CV file is required", true);
      return;
    }
    const allowedExtensions = [".pdf", ".doc", ".docx"];
    const lowerName = cvFile.name.toLowerCase();
    if (!allowedExtensions.some((extension) => lowerName.endsWith(extension))) {
      show("CV format must be .pdf, .doc, or .docx", true);
      return;
    }

    const body = new FormData();
    body.append("jobId", selectedJob.id);
    body.append("fullName", form.fullName);
    body.append("email", form.email);
    body.append("phone", form.phone);
    body.append("coverLetter", form.coverLetter);
    if (cvFile) body.append("cvFile", cvFile);

    try {
      const data = await api("/api/applications", { method: "POST", body });
      show(data.message);
      loadHistory(form.email);
      setCvFile(null);
      setCvInputKey((value) => value + 1);
      onSectionChange("history");
    } catch (error) {
      show(error.message, true);
    }
  }

  useEffect(() => {
    loadJobs();
    loadHistory(currentEmail);
  }, []);

  return (
    <div className="view-stack">
      <div className="stats-grid">
        <StatCard label="Active jobs" value={jobs.length} note="Open for applications" />
        <StatCard label="Applications" value={history.length} note="Submitted by current email" />
        <StatCard label="In process" value={pendingCount} note="Not rejected" tone="info" />
      </div>

      {activeSection === "find-jobs" && (
        <SectionPanel
          title="Find active jobs"
          description="Search by keyword, location, or level. Only active jobs within deadline are listed."
          actions={<button onClick={loadJobs}>{loadingJobs ? "Searching..." : "Search"}</button>}
        >
          <div className="form-grid">
            <Field label="Keyword">
              <input value={filters.keyword} onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} />
            </Field>
            <Field label="Location">
              <input value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })} />
            </Field>
            <Field label="Level">
              <input value={filters.level} onChange={(event) => setFilters({ ...filters, level: event.target.value })} />
            </Field>
          </div>

          <DataTable
            loading={loadingJobs}
            emptyText="No active jobs matched your filters."
            rows={jobs}
            columns={[
              { key: "title", header: "Title" },
              { key: "location", header: "Location" },
              { key: "level", header: "Level" },
              { key: "salary", header: "Salary", render: (job) => `${job.salaryMin} - ${job.salaryMax}` },
              { key: "deadline", header: "Deadline", render: (job) => shortDate(job.deadline) },
              {
                key: "action",
                header: "Action",
                render: (job) => (
                  <div className="row-actions">
                    <button className="secondary" onClick={() => viewJobDetail(job.id)}>
                      View detail
                    </button>
                    <button
                      className={selectedJob?.id === job.id ? "secondary" : ""}
                      onClick={() => {
                        setSelectedJob(job);
                        show(`Selected job: ${job.title} #${job.id}`);
                        onSectionChange("apply");
                      }}
                    >
                      {selectedJob?.id === job.id ? "Selected" : "Apply"}
                    </button>
                  </div>
                ),
              },
            ]}
          />

          {selectedJob && (
            <div className="job-detail-panel">
              <div>
                <strong>{selectedJob.title}</strong>
                <span>
                  {selectedJob.department || "General"} - {selectedJob.location} - {selectedJob.level}
                </span>
              </div>
              <dl>
                <div>
                  <dt>Salary</dt>
                  <dd>
                    {selectedJob.salaryMin} - {selectedJob.salaryMax} {selectedJob.salaryType}
                  </dd>
                </div>
                <div>
                  <dt>Quantity</dt>
                  <dd>{selectedJob.quantity}</dd>
                </div>
                <div>
                  <dt>Deadline</dt>
                  <dd>{shortDate(selectedJob.deadline)}</dd>
                </div>
              </dl>
              <p>{selectedJob.jobDescription}</p>
              <p>{selectedJob.jobRequirements}</p>
              <Toolbar title={loadingJobDetail ? "Loading detail" : "Job detail"}>
                <button onClick={() => onSectionChange("apply")}>Apply to this job</button>
              </Toolbar>
            </div>
          )}
        </SectionPanel>
      )}

      {activeSection === "apply" && (
        <SectionPanel
          title="Submit application"
          description={selectedJob ? `Selected job: ${selectedJob.title} #${selectedJob.id}` : "Select a job from Find jobs before submitting."}
        >
          {selectedJob && (
            <div className="selected-job-note">
              <strong>{selectedJob.title}</strong>
              <span>
                Job #{selectedJob.id} - {selectedJob.location} - deadline {shortDate(selectedJob.deadline)}
              </span>
            </div>
          )}
          <form onSubmit={submitApplication}>
            <div className="form-grid">
              <Field label="Full name">
                <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
              </Field>
              <Field label="Email">
                <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </Field>
              <Field label="Phone">
                <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </Field>
              <Field label="CV file" help=".pdf, .doc, .docx. Maximum 5MB.">
                <input key={cvInputKey} type="file" onChange={(event) => setCvFile(event.target.files?.[0] || null)} />
              </Field>
            </div>
            <Field label="Cover letter">
              <textarea value={form.coverLetter} onChange={(event) => setForm({ ...form, coverLetter: event.target.value })} />
            </Field>
            <Toolbar title={selectedJob ? "Ready to submit" : "Choose a job first"}>
              <button type="submit">Submit application</button>
              <button className="secondary" type="button" onClick={() => loadHistory(form.email)}>
                Refresh history
              </button>
            </Toolbar>
          </form>
        </SectionPanel>
      )}

      {activeSection === "history" && (
        <SectionPanel title="Application history" description="Candidate-facing statuses stay generalized for privacy.">
          <DataTable
            loading={loadingHistory}
            emptyText="This email has no submitted applications yet."
            rows={history}
            columns={[
              { key: "id", header: "ID" },
              { key: "jobTitle", header: "Job" },
              { key: "submittedAt", header: "Submitted", render: (row) => shortDate(row.submittedAt) },
              { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> },
            ]}
          />
        </SectionPanel>
      )}
    </div>
  );
}
