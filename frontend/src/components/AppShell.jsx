const tabs = [
  { id: "Candidate", label: "Candidate", description: "Search and apply" },
  { id: "Employer", label: "Employer", description: "Jobs and interviews" },
  { id: "Admin", label: "Admin", description: "Accounts and audit" },
];

export function AppShell({ activeTab, onTabChange, user, children }) {
  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <div className="eyebrow">SWT301 prototype</div>
          <h1>Recruitment Management System</h1>
          <p>Focused build for testing job posts, applications, interviews, accounts, and audit logs.</p>
        </div>
        <div className="user-card">
          <span className="user-card__label">Current role</span>
          <strong>{user ? user.role : "Not logged in"}</strong>
          <span>{user ? user.email : "Backend not connected"}</span>
        </div>
      </header>

      <nav className="tabs" aria-label="Role views">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "tab active" : "tab"}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            <strong>{tab.label}</strong>
            <span>{tab.description}</span>
          </button>
        ))}
      </nav>

      <main>{children}</main>
    </div>
  );
}
