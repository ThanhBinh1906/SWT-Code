export function MessageBanner({ message, isError }) {
  if (!message) return null;

  return (
    <div className={isError ? "message error" : "message"} role="status">
      <span>{isError ? "Error" : "Status"}</span>
      <strong>{message}</strong>
    </div>
  );
}
