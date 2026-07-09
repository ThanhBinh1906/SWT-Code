const toneMap = {
  Active: "success",
  "CV Passed": "success",
  "CV passed": "success",
  "Interview Scheduled": "success",
  "Interview scheduled": "success",
  "Interview Passed": "success",
  "Interview passed": "success",
  "Interview Failed": "danger",
  "Not selected after interview": "danger",
  "Offer sent": "success",
  Offered: "success",
  Hired: "success",
  Completed: "success",
  Scheduled: "success",
  Draft: "muted",
  "Pending Approval": "warning",
  "New Applied": "info",
  "Under review": "info",
  "Waiting for CV screening": "info",
  Rejected: "danger",
  Locked: "danger",
};

export function StatusBadge({ value }) {
  const tone = toneMap[value] || "muted";
  return <span className={`badge ${tone}`}>{value || "N/A"}</span>;
}
