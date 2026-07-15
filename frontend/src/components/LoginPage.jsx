import { useState } from "react";

export function LoginPage({ accounts, onLogin, loading }) {
  const defaultAccount = accounts[0] || {};
  const [email, setEmail] = useState(defaultAccount.email || "");
  const [password, setPassword] = useState(defaultAccount.password || "");
  const [error, setError] = useState("");

  function selectAccount(account) {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  }

  function submit(event) {
    event.preventDefault();
    const account = accounts.find(
      (item) =>
        item.email.toLowerCase() === email.trim().toLowerCase() &&
        item.password === password
    );

    if (!account) {
      setError("Invalid email or password");
      return;
    }

    setError("");
    onLogin(account);
  }

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

        <div className="login-content">
          <form className="login-form" onSubmit={submit}>
            <label>
              <span>Email</span>
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </label>

            <label>
              <span>Password</span>
              <input
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>

            {error && <p className="login-inline-error">{error}</p>}

            <button className="login-submit" disabled={loading} type="submit">
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <button className="forgot-link" type="button">
              Forgot password?
            </button>
          </form>

          <aside className="demo-account-list" aria-label="Demo accounts">
            <span>Demo accounts</span>
            {accounts.map((account) => (
              <button
                className={email === account.email ? "demo-account active" : "demo-account"}
                key={account.role}
                onClick={() => selectAccount(account)}
                type="button"
              >
                <strong>{account.role}</strong>
                <small>{account.email}</small>
                <code>{account.password}</code>
              </button>
            ))}
          </aside>
        </div>
      </section>
    </main>
  );
}
