import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5082";

const demoUsers = {
  Candidate: { email: "candidate@example.com", role: "Candidate" },
  Employer: { email: "employer@company.com", role: "Employer" },
  Admin: { email: "admin@company.com", role: "Admin" },
  Interviewer: { email: "interviewer@company.com", role: "Interviewer" },
};

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

function todayPlus(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function App() {
  const [tab, setTab] = useState("Candidate");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function login(role = tab) {
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demoUsers[role]),
      });
      setUser(data);
      show(`Logged in as ${data.role}: ${data.email}`);
    } catch (error) {
      show(error.message, true);
    }
  }

  function show(text, error = false) {
    setMessage(text);
    setIsError(error);
  }

  useEffect(() => {
    login(tab);
  }, [tab]);

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>Recruitment Management System</h1>
          <div className="muted">SWT demo build: React + ASP.NET Core + SQLite</div>
        </div>
        <div>
          <strong>User:</strong> {user ? `${user.fullName} (${user.role})` : "Not logged in"}
        </div>
      </div>

      <div className="tabs">
        {["Candidate", "Employer", "Admin"].map((name) => (
          <button key={name} className={tab === name ? "active" : ""} onClick={() => setTab(name)}>
            {name}
          </button>
        ))}
      </div>

      {message && <div className={`message ${isError ? "error" : ""}`}>{message}</div>}

      {tab === "Candidate" && <CandidateView show={show} />}
      {tab === "Employer" && <EmployerView user={user} show={show} />}
      {tab === "Admin" && <AdminView user={user} show={show} />}
    </div>
  );
}

function CandidateView({ show }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [history, setHistory] = useState([]);
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
      const query = new URLSearchParams(filters).toString();
      const data = await api(`/api/jobs?${query}`);
      setJobs(data);
      show(data.length ? `Found ${data.length} active job(s)` : "No matching jobs");
    } catch (error) {
      show(error.message, true);
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
    if (cvFile) {
      body.append("cvFile", cvFile);
    }

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
    <>
      <section className="panel">
        <h2>Candidate - Search Jobs</h2>
        <div className="grid">
          <label>
            Keyword
            <input value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} />
          </label>
          <label>
            Location
            <input value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} />
          </label>
          <label>
            Level
            <input value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })} />
          </label>
        </div>
        <div className="actions">
          <button onClick={loadJobs}>Search</button>
          <button className="secondary" onClick={loadHistory}>Track Application Status</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Location</th>
              <th>Level</th>
              <th>Salary</th>
              <th>Deadline</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.title}</td>
                <td>{job.location}</td>
                <td>{job.level}</td>
                <td>
                  {job.salaryMin} - {job.salaryMax}
                </td>
                <td>{job.deadline?.slice(0, 10)}</td>
                <td>
                  <button onClick={() => setSelectedJob(job)}>View / Apply</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Submit Application</h2>
        <div className="muted">
          Selected job: {selectedJob ? `${selectedJob.title} #${selectedJob.id}` : "None"}
        </div>
        <form onSubmit={submitApplication}>
          <div className="grid">
            <label>
              Full name
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </label>
            <label>
              Email
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label>
              CV file (.pdf/.doc/.docx, max 5MB)
              <input type="file" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          <label>
            Cover letter
            <textarea value={form.coverLetter} onChange={(e) => setForm({ ...form, coverLetter: e.target.value })} />
          </label>
          <div className="actions">
            <button type="submit">Submit Application</button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Application History</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Job</th>
              <th>Submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.jobTitle}</td>
                <td>{row.submittedAt?.slice(0, 10)}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function EmployerView({ user, show }) {
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
    <>
      <section className="panel">
        <h2>Employer - Khởi tạo Tin tuyển dụng</h2>
        <div className="grid">
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
            <label key={key}>
              {label}
              <input
                type={key === "deadline" ? "date" : ["quantity", "salaryMin", "salaryMax"].includes(key) ? "number" : "text"}
                value={jobForm[key]}
                onChange={(e) => setJobForm({ ...jobForm, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <label>
          Job description
          <textarea value={jobForm.jobDescription} onChange={(e) => setJobForm({ ...jobForm, jobDescription: e.target.value })} />
        </label>
        <label>
          Job requirements
          <textarea value={jobForm.jobRequirements} onChange={(e) => setJobForm({ ...jobForm, jobRequirements: e.target.value })} />
        </label>
        <div className="actions">
          <button onClick={() => saveJob("Submit")}>Submit Job Post</button>
          <button className="secondary" onClick={() => saveJob("Save Draft")}>Save Draft</button>
          <button className="secondary" onClick={clearJobForm}>Clear</button>
        </div>
      </section>

      <section className="panel">
        <h2>Job Posts</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Deadline</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.id}</td>
                <td>{job.title}</td>
                <td>{job.postStatus}</td>
                <td>{job.deadline?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Applications</h2>
        <button className="secondary" onClick={loadEmployerData}>Refresh</button>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Candidate</th>
              <th>Email</th>
              <th>Job</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.applicantName}</td>
                <td>{item.candidateEmail}</td>
                <td>{item.job?.title}</td>
                <td>{item.applicationStatus}</td>
                <td>
                  <div className="actions">
                    <button onClick={() => updateStatus(item.id, "CV Passed")}>Pass CV</button>
                    <button className="danger" onClick={() => updateStatus(item.id, "Rejected")}>Reject</button>
                    <button className="secondary" onClick={() => setSelectedApplicationId(item.id)}>Select</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Schedule Interview</h2>
        <div className="grid">
          <label>
            Application ID
            <input value={selectedApplicationId} onChange={(e) => setSelectedApplicationId(e.target.value)} />
          </label>
          <label>
            Interview time
            <input
              type="datetime-local"
              value={interviewForm.interviewTime}
              onChange={(e) => setInterviewForm({ ...interviewForm, interviewTime: e.target.value })}
            />
          </label>
          <label>
            Mode
            <select
              value={interviewForm.interviewMode}
              onChange={(e) => setInterviewForm({ ...interviewForm, interviewMode: e.target.value })}
            >
              <option>Online</option>
              <option>Offline</option>
            </select>
          </label>
          <label>
            Link / Room
            <input
              value={interviewForm.locationOrLink}
              onChange={(e) => setInterviewForm({ ...interviewForm, locationOrLink: e.target.value })}
            />
          </label>
          <label>
            Interviewers
            <select
              multiple
              value={interviewForm.interviewerUserIds}
              onChange={(e) =>
                setInterviewForm({
                  ...interviewForm,
                  interviewerUserIds: Array.from(e.target.selectedOptions).map((option) => option.value),
                })
              }
            >
              {interviewers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="actions">
          <button onClick={scheduleInterview}>Create Interview Schedule</button>
        </div>
      </section>
    </>
  );
}

function AdminView({ user, show }) {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({
    fullName: "HR Staff Demo",
    email: "hrstaff@company.com",
    phone: "0900000000",
    role: "Employer",
  });

  const activeUsers = useMemo(() => users.filter((item) => item.accountStatus === "Active"), [users]);

  async function loadAdminData() {
    try {
      const [userData, logData] = await Promise.all([
        api("/api/admin/users"),
        api("/api/admin/audit-logs"),
      ]);
      setUsers(userData);
      setLogs(logData);
      show("Admin data loaded");
    } catch (error) {
      show(error.message, true);
    }
  }

  async function createAccount() {
    try {
      const data = await api("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, actorId: user?.id || 0, actorRole: user?.role || "" }),
      });
      show(data.message);
      loadAdminData();
    } catch (error) {
      show(error.message, true);
    }
  }

  async function updateUser(id, patch) {
    try {
      const data = await api(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: user?.id || 0, actorRole: user?.role || "", ...patch }),
      });
      show(data.message);
      loadAdminData();
    } catch (error) {
      show(error.message, true);
    }
  }

  async function testReadOnlyLog() {
    try {
      await api("/api/admin/audit-logs/1", { method: "DELETE" });
    } catch (error) {
      show(error.message, true);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  return (
    <>
      <section className="panel">
        <h2>Admin - Manage User Accounts</h2>
        <div className="grid">
          <label>
            Full name
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </label>
          <label>
            Company email
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option>Admin</option>
              <option>Employer</option>
              <option>Interviewer</option>
            </select>
          </label>
        </div>
        <div className="actions">
          <button onClick={createAccount}>Create Account</button>
          <button className="secondary" onClick={loadAdminData}>Refresh</button>
          <button className="danger" onClick={testReadOnlyLog}>Try Delete Audit Log</button>
        </div>
        <div className="muted">Active users: {activeUsers.length}</div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.fullName}</td>
                <td>{item.email}</td>
                <td>{item.role}</td>
                <td>{item.accountStatus}</td>
                <td>
                  <div className="actions">
                    <button className="secondary" onClick={() => updateUser(item.id, { accountStatus: "Locked" })}>Lock</button>
                    <button className="secondary" onClick={() => updateUser(item.id, { accountStatus: "Active" })}>Unlock</button>
                    <button className="secondary" onClick={() => updateUser(item.id, { role: "Admin" })}>Make Admin</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Audit Logs</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Old</th>
              <th>New</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{log.createdAt?.slice(0, 19).replace("T", " ")}</td>
                <td>{log.userId}</td>
                <td>{log.actionType}</td>
                <td>{log.entityType}</td>
                <td>{log.oldValue}</td>
                <td>{log.newValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
