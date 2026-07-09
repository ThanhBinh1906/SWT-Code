export function Toolbar({ title, children }) {
  return (
    <div className="toolbar">
      <strong>{title}</strong>
      <div>{children}</div>
    </div>
  );
}
