export function Field({ label, help, required = true, children }) {
  return (
    <label className="field">
      <span className={required ? "" : "optional"}>{label}</span>
      {children}
      {help && <small>{help}</small>}
    </label>
  );
}
