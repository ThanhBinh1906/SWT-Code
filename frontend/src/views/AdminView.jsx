import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { DataTable } from "../components/DataTable";
import { Field } from "../components/Field";
import { SectionPanel } from "../components/SectionPanel";
import { StatusBadge } from "../components/StatusBadge";
import { shortDateTime } from "../utils/date";

export function AdminView({ user, show }) {
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
      const [userData, logData] = await Promise.all([api("/api/admin/users"), api("/api/admin/audit-logs")]);
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
    <div className="view-stack">
      <SectionPanel
        title="Manage user accounts"
        description="Create staff accounts, assign roles, and lock or unlock users. Company email is required."
        actions={<span className="metric-pill">{activeUsers.length} active users</span>}
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
        <div className="actions">
          <button onClick={createAccount}>Create account</button>
          <button className="secondary" onClick={loadAdminData}>
            Refresh
          </button>
          <button className="danger" onClick={testReadOnlyLog}>
            Try delete audit log
          </button>
        </div>
      </SectionPanel>

      <SectionPanel title="Accounts" description="Account deletion is represented as lock/unlock for testability.">
        <DataTable
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

      <SectionPanel title="Audit logs" description="Logs are read-only and record sensitive workflow actions.">
        <DataTable
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
    </div>
  );
}
