import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { DataTable } from "../components/DataTable";
import { Field } from "../components/Field";
import { SectionPanel } from "../components/SectionPanel";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { Toolbar } from "../components/Toolbar";
import { shortDate, shortDateTime } from "../utils/date";

export function AdminView({ activeSection, user, show, onResetComplete }) {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "HR Staff Demo",
    email: "hrstaff@company.com",
    phone: "0900000000",
    role: "Employer",
  });

  const stats = useMemo(
    () => ({
      activeUsers: users.filter((item) => item.accountStatus === "Active").length,
      lockedUsers: users.filter((item) => item.accountStatus === "Locked").length,
      pendingJobs: jobs.filter((item) => item.postStatus === "Pending Approval").length,
      logs: logs.length,
    }),
    [users, jobs, logs]
  );

  const pendingJobs = useMemo(
    () => jobs.filter((item) => item.postStatus === "Pending Approval"),
    [jobs]
  );

  async function loadAdminData(actor = user) {
    try {
      setLoading(true);
      const adminQuery = `actorId=${actor?.id || 0}&actorRole=${encodeURIComponent(actor?.role || "")}`;
      const [userData, logData, jobData] = await Promise.all([
        api(`/api/admin/users?${adminQuery}`),
        api(`/api/admin/audit-logs?${adminQuery}`),
        api(`/api/admin/jobs?${adminQuery}`),
      ]);
      setUsers(userData);
      setLogs(logData);
      setJobs(jobData);
      show("Admin data loaded");
    } catch (error) {
      show(error.message, true);
    } finally {
      setLoading(false);
    }
  }

  async function createAccount() {
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      show("Full name, email, and phone are required", true);
      return;
    }
    if (!form.email.toLowerCase().endsWith("@company.com")) {
      show("Company email must end with @company.com", true);
      return;
    }

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

  async function approveJob(id, approved) {
    try {
      const data = await api(`/api/admin/jobs/${id}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: user?.id || 0, actorRole: user?.role || "", approved }),
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

  async function resetDemoData() {
    const confirmed = window.confirm("Reset all demo data? Applications, interviews, CV files, jobs, users, and logs will be recreated from seed data.");
    if (!confirmed) return;

    try {
      const data = await api("/api/admin/reset-demo-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: user?.id || 0, actorRole: user?.role || "", actorEmail: user?.email || "" }),
      });
      onResetComplete(`${data.message}. Please sign in again.`);
    } catch (error) {
      show(error.message, true);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  return (
    <div className="view-stack">
      <div className="stats-grid">
        <StatCard label="Active users" value={stats.activeUsers} note="Can sign in" tone="success" />
        <StatCard label="Locked users" value={stats.lockedUsers} note="Blocked accounts" tone="danger" />
        <StatCard label="Pending jobs" value={stats.pendingJobs} note="Need approval" tone="warning" />
        <StatCard label="Audit records" value={stats.logs} note="Read-only" />
      </div>

      {activeSection === "accounts" && (
        <>
          <SectionPanel
            title="Manage user accounts"
            description="Create staff accounts and manage access."
            actions={
              <>
                <button className="secondary" onClick={loadAdminData}>
                  Refresh
                </button>
                <button className="danger" onClick={resetDemoData}>
                  Reset demo data
                </button>
              </>
            }
          >
            <div className="form-grid">
              <Field label="Full name">
                <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
              </Field>
              <Field label="Company email">
                <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </Field>
              <Field label="Phone">
                <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </Field>
              <Field label="Role">
                <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                  <option>Admin</option>
                  <option>Employer</option>
                  <option>Interviewer</option>
                </select>
              </Field>
            </div>
            <Toolbar title="Account actions">
              <button onClick={createAccount}>Create account</button>
            </Toolbar>
          </SectionPanel>

          <SectionPanel title="Accounts" description="Lock accounts instead of deleting them.">
            <DataTable
              loading={loading}
              rows={users}
              emptyText="No user accounts available."
              columns={[
                { key: "id", header: "ID" },
                { key: "fullName", header: "Name" },
                { key: "email", header: "Email" },
                { key: "role", header: "Role" },
                { key: "accountStatus", header: "Status", render: (item) => <StatusBadge value={item.accountStatus} /> },
                {
                  key: "action",
                  header: "Action",
                  render: (item) => (
                    <div className="row-actions">
                      <button className="secondary" onClick={() => updateUser(item.id, { accountStatus: "Locked" })}>
                        Lock
                      </button>
                      <button className="secondary" onClick={() => updateUser(item.id, { accountStatus: "Active" })}>
                        Unlock
                      </button>
                      <button className="secondary" onClick={() => updateUser(item.id, { role: "Admin" })}>
                        Make Admin
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </SectionPanel>
        </>
      )}

      {activeSection === "approvals" && (
        <SectionPanel title="Job approvals" description="Review pending employer submissions.">
          <DataTable
            loading={loading}
            rows={pendingJobs}
            emptyText="No job posts are waiting for approval."
            columns={[
              { key: "id", header: "ID" },
              { key: "title", header: "Title" },
              { key: "location", header: "Location" },
              { key: "deadline", header: "Deadline", render: (job) => shortDate(job.deadline) },
              { key: "postStatus", header: "Status", render: (job) => <StatusBadge value={job.postStatus} /> },
              {
                key: "action",
                header: "Action",
                render: (job) => (
                  <div className="row-actions">
                    <button onClick={() => approveJob(job.id, true)}>Approve</button>
                    <button className="danger" onClick={() => approveJob(job.id, false)}>
                      Reject
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </SectionPanel>
      )}

      {activeSection === "audit" && (
        <SectionPanel
          title="Audit logs"
          description="Read-only records for sensitive actions."
          actions={
            <button className="danger" onClick={testReadOnlyLog}>
              Try delete audit log
            </button>
          }
        >
          <DataTable
            loading={loading}
            rows={logs}
            emptyText="No audit records yet."
            columns={[
              { key: "id", header: "ID" },
              { key: "createdAt", header: "Time", render: (log) => shortDateTime(log.createdAt) },
              { key: "userId", header: "User" },
              { key: "actionType", header: "Action" },
              { key: "entityType", header: "Entity" },
              { key: "oldValue", header: "Old" },
              { key: "newValue", header: "New" },
            ]}
          />
        </SectionPanel>
      )}
    </div>
  );
}
