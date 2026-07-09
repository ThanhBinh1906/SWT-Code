import { useMemo, useState } from "react";
import { api } from "./api/client";
import { DashboardShell } from "./components/DashboardShell";
import { LoginPage } from "./components/LoginPage";
import { MessageBanner } from "./components/MessageBanner";
import { AdminView } from "./views/AdminView";
import { CandidateView } from "./views/CandidateView";
import { EmployerView } from "./views/EmployerView";

const demoUsers = [
  { role: "Candidate", email: "candidate@example.com", label: "Candidate Demo", summary: "Search jobs and submit CVs" },
  { role: "Employer", email: "employer@company.com", label: "Employer Demo", summary: "Manage job posts and applicants" },
  { role: "Admin", email: "admin@company.com", label: "Admin Demo", summary: "Manage accounts, approvals, and audit" },
];

const defaultSections = {
  Candidate: "find-jobs",
  Employer: "job-posts",
  Admin: "accounts",
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState(defaultSections.Candidate);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const currentDemoUser = useMemo(
    () => demoUsers.find((item) => item.role === user?.role),
    [user]
  );

  function show(text, error = false) {
    setMessage(text);
    setIsError(error);
  }

  async function login(account) {
    try {
      setLoggingIn(true);
      const data = await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account.email, role: account.role }),
      });
      setUser(data);
      setActiveSection(defaultSections[data.role] || "");
      show(`Signed in as ${data.role}: ${data.email}`);
    } catch (error) {
      setUser(null);
      show(error.message, true);
    } finally {
      setLoggingIn(false);
    }
  }

  function logout() {
    setUser(null);
    setActiveSection(defaultSections.Candidate);
    show("");
  }

  if (!user) {
    return (
      <>
        <LoginPage accounts={demoUsers} onLogin={login} loading={loggingIn} />
        <div className="login-message">
          <MessageBanner message={message} isError={isError} />
        </div>
      </>
    );
  }

  return (
    <DashboardShell
      user={user}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onLogout={logout}
      subtitle={currentDemoUser?.summary}
    >
      <MessageBanner message={message} isError={isError} />
      {user.role === "Candidate" && <CandidateView activeSection={activeSection} user={user} show={show} onSectionChange={setActiveSection} />}
      {user.role === "Employer" && <EmployerView activeSection={activeSection} user={user} show={show} />}
      {user.role === "Admin" && <AdminView activeSection={activeSection} user={user} show={show} onUserRefresh={setUser} />}
    </DashboardShell>
  );
}
