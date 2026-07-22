import { useMemo, useState } from "react";
import { api } from "./api/client";
import { DashboardShell } from "./components/DashboardShell";
import { LoginPage } from "./components/LoginPage";
import { MessageBanner } from "./components/MessageBanner";
import { AdminView } from "./views/AdminView";
import { CandidateView } from "./views/CandidateView";
import { EmployerView } from "./views/EmployerView";
import { InterviewerView } from "./views/InterviewerView";

const demoUsers = [
  { role: "Candidate", email: "candidate@example.com", password: "12345", label: "Candidate Demo", summary: "Search jobs and submit CVs" },
  { role: "Employer", email: "employer@company.com", password: "12345", label: "Employer Demo", summary: "Manage job posts and applicants" },
  { role: "Interviewer", email: "interviewer@company.com", password: "12345", label: "Interviewer Demo", summary: "Review assigned interviews" },
  { role: "Admin", email: "admin@company.com", password: "12345", label: "Admin Demo", summary: "Manage accounts, approvals, and audit" },
];

const defaultSections = {
  Candidate: "find-jobs",
  Employer: "job-posts",
  Interviewer: "schedule",
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
    if (error) {
      window.setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 0);
    }
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

  function logoutWithMessage(text, error = false) {
    setUser(null);
    setActiveSection(defaultSections.Candidate);
    show(text, error);
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
      {user.role === "Employer" && <EmployerView activeSection={activeSection} user={user} show={show} onSectionChange={setActiveSection} />}
      {user.role === "Interviewer" && <InterviewerView activeSection={activeSection} user={user} show={show} />}
      {user.role === "Admin" && <AdminView activeSection={activeSection} user={user} show={show} onResetComplete={logoutWithMessage} />}
    </DashboardShell>
  );
}
