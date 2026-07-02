const toneMap = {
  Active: "success",
  "CV Passed": "success",
  Scheduled: "success",
  Draft: "muted",
  "Pending Approval": "warning",
  "New Applied": "info",
  "Under review": "info",
  Rejected: "danger",
  Locked: "danger",
};

export function StatusBadge({ value }) {
  const tone = toneMap[value] || "muted";
  return <span className={`badge ${tone}`}>{value || "N/A"}</span>;
}
