import { useState } from "react";

export function LoginPage({ accounts, onLogin, loading }) {
  const [selectedRole, setSelectedRole] = useState(accounts[0]?.role || "");
  const selectedAccount = accounts.find((account) => account.role === selectedRole) || accounts[0];

  return (
    <main className="login-page">
      <section className="login-panel login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="login-logo" aria-hidden="true">
            R
          </span>
          <strong>RMS</strong>
        </div>

        <hr className="login-rule" />

        <div className="login-form-heading">
          <h1 id="login-title">Sign in to RMS</h1>
        </div>

        <div className="role-selector">
          <span>Select your role</span>
          <div className="role-tabs" role="tablist" aria-label="Demo roles">
            {accounts.map((account) => (
              <button
                aria-selected={selectedRole === account.role}
                className={selectedRole === account.role ? "role-tab active" : "role-tab"}
                key={account.role}
                onClick={() => setSelectedRole(account.role)}
                role="tab"
                type="button"
              >
                {account.role}
              </button>
            ))}
          </div>
          <small>{selectedAccount?.email}</small>
        </div>

        <button
          className="login-submit"
          disabled={loading || !selectedAccount}
          onClick={() => selectedAccount && onLogin(selectedAccount)}
          type="button"
        >
          Sign in
        </button>

        <button className="forgot-link" type="button">
          Forgot password?
        </button>
      </section>
    </main>
  );
}
