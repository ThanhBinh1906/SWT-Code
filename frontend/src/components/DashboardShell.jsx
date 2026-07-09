const navItems = {
  Candidate: [
    { id: "find-jobs", label: "Find jobs", hint: "Search active posts" },
    { id: "apply", label: "Apply", hint: "Submit CV" },
    { id: "history", label: "History", hint: "Track status" },
  ],
  Employer: [
    { id: "job-posts", label: "Job posts", hint: "Create and review" },
    { id: "applications", label: "Applications", hint: "Process CVs" },
    { id: "schedule", label: "Schedule", hint: "Book interviews" },
  ],
  Admin: [
    { id: "accounts", label: "Accounts", hint: "Users and roles" },
    { id: "approvals", label: "Job approvals", hint: "Pending posts" },
    { id: "audit", label: "Audit logs", hint: "Read-only records" },
  ],
};

const roleTitles = {
  Candidate: "Candidate dashboard",
  Employer: "Employer dashboard",
  Admin: "Admin dashboard",
};

function initials(name) {
  return (name || "?").trim().slice(0, 1).toUpperCase();
}

export function DashboardShell({ user, subtitle, activeSection, onSectionChange, onLogout, children }) {
  const items = navItems[user.role] || [];
  const activeItem = items.find((item) => item.id === activeSection) || items[0];

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">RMS</span>
          <div>
            <strong>SWT demo</strong>
            <small>Recruitment system</small>
          </div>
        </div>

        <nav className="side-nav" aria-label={`${user.role} modules`}>
          {items.map((item) => (
            <button
              className={activeSection === item.id ? "side-link active" : "side-link"}
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              type="button"
            >
              <span>{item.label}</span>
              <small>{item.hint}</small>
            </button>
          ))}
        </nav>
      </aside>

      <div className="dashboard-main">
        <header className="topbar">
          <div>
            <span className="eyebrow">{roleTitles[user.role] || "Dashboard"}</span>
            <h1>{activeItem?.label || "Overview"}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="topbar-user">
            <span className={`avatar role-${user.role}`}>{initials(user.fullName)}</span>
            <div>
              <strong>{user.fullName}</strong>
              <span>{user.email}</span>
              <em>{user.role}</em>
            </div>
            <button className="logout-button" onClick={onLogout} type="button">
              Logout
            </button>
          </div>
        </header>

        <main id="main-content" className="content">
          {children}
        </main>
      </div>
    </div>
  );
}
