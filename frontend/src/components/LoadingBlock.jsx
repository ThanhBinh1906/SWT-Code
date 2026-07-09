export function LoadingBlock({ label = "Loading data" }) {
  return (
    <div className="loading-block" role="status">
      <span />
      <span />
      <span />
      <strong>{label}</strong>
    </div>
  );
}
