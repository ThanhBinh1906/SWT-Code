export function EmptyState({ title, text, action }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
