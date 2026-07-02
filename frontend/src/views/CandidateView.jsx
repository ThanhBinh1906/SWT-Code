import { useEffect, useState } from "react";
import { api } from "../api/client";
import { DataTable } from "../components/DataTable";
import { Field } from "../components/Field";
import { SectionPanel } from "../components/SectionPanel";
import { StatusBadge } from "../components/StatusBadge";
import { shortDate } from "../utils/date";

export function CandidateView({ show }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ keyword: "", location: "", level: "" });
  const [form, setForm] = useState({
    fullName: "Nguyen Van A",
    email: "candidate@example.com",
    phone: "0912345678",
    coverLetter: "I want to apply for this job.",
  });
  const [cvFile, setCvFile] = useState(null);

  async function loadJobs() {
    try {
      setLoading(true);
      const query = new URLSearchParams(filters).toString();
      const data = await api(`/api/jobs?${query}`);
      setJobs(data);
      show(data.length ? `Found ${data.length} active job(s)` : "No matching jobs");
    } catch (error) {
      show(error.message, true);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const data = await api(`/api/candidate/applications?email=${encodeURIComponent(form.email)}`);
      setHistory(data);
      show(`Loaded ${data.length} application history row(s)`);
    } catch (error) {
      show(error.message, true);
    }
  }

  async function submitApplication(event) {
    event.preventDefault();
    if (!selectedJob) {
      show("Select a job first", true);
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
      loadHistory();
    } catch (error) {
      show(error.message, true);
    }
  }

  useEffect(() => {
    loadJobs();
    loadHistory();
  }, []);

  return (
    <div className="view-stack">
      <SectionPanel
        title="Search active jobs"
        description="Find open positions by keyword, location, and level. Results only include active jobs that are still within deadline."
        actions={<button onClick={loadJobs}>{loading ? "Searching..." : "Search"}</button>}
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
              render: (job) => <button onClick={() => setSelectedJob(job)}>View / Apply</button>,
            },
          ]}
        />
      </SectionPanel>

      <SectionPanel
        title="Submit application"
        description={selectedJob ? `Selected job: ${selectedJob.title} #${selectedJob.id}` : "Select a job from the list before submitting."}
      >
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
              <input type="file" onChange={(event) => setCvFile(event.target.files?.[0] || null)} />
            </Field>
          </div>
          <Field label="Cover letter">
            <textarea value={form.coverLetter} onChange={(event) => setForm({ ...form, coverLetter: event.target.value })} />
          </Field>
          <div className="actions">
            <button type="submit">Submit application</button>
            <button className="secondary" type="button" onClick={loadHistory}>
              Refresh history
            </button>
          </div>
        </form>
      </SectionPanel>

      <SectionPanel title="Application history" description="Candidate-facing statuses stay generalized for privacy.">
        <DataTable
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
    </div>
  );
}
