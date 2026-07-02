import { useEffect, useState } from "react";
import { api } from "./api/client";
import { AppShell } from "./components/AppShell";
import { MessageBanner } from "./components/MessageBanner";
import { AdminView } from "./views/AdminView";
import { CandidateView } from "./views/CandidateView";
import { EmployerView } from "./views/EmployerView";

const demoUsers = {
  Candidate: { email: "candidate@example.com", role: "Candidate" },
  Employer: { email: "employer@company.com", role: "Employer" },
  Admin: { email: "admin@company.com", role: "Admin" },
};

export default function App() {
  const [tab, setTab] = useState("Candidate");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function show(text, error = false) {
    setMessage(text);
    setIsError(error);
  }

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
      setUser(null);
      show(error.message, true);
    }
  }

  useEffect(() => {
    login(tab);
  }, [tab]);

  return (
    <AppShell activeTab={tab} onTabChange={setTab} user={user}>
      <MessageBanner message={message} isError={isError} />
      {tab === "Candidate" && <CandidateView show={show} />}
      {tab === "Employer" && <EmployerView user={user} show={show} />}
      {tab === "Admin" && <AdminView user={user} show={show} />}
    </AppShell>
  );
}
