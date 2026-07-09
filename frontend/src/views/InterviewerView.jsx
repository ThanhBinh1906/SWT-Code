import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { DataTable } from "../components/DataTable";
import { SectionPanel } from "../components/SectionPanel";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { shortDateTime } from "../utils/date";

export function InterviewerView({ activeSection, user, show }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const stats = useMemo(
    () => ({
      assigned: interviews.length,
      upcoming: interviews.filter((item) => new Date(item.interviewTime) >= new Date() && item.interviewStatus === "Scheduled").length,
      completed: interviews.filter((item) => item.interviewStatus === "Completed").length,
    }),
    [interviews]
  );

  async function loadInterviews() {
    try {
      setLoading(true);
      const data = await api(`/api/interviewer/interviews?interviewerId=${user?.id || 0}`);
      setInterviews(data);
      show(`Loaded ${data.length} interview(s)`);
    } catch (error) {
      show(error.message, true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInterviews();
  }, []);

  return (
    <div className="view-stack">
      <div className="stats-grid">
        <StatCard label="Assigned" value={stats.assigned} note="Total interviews" />
        <StatCard label="Upcoming" value={stats.upcoming} note="Still scheduled" tone="info" />
        <StatCard label="Completed" value={stats.completed} note="Finished interviews" tone="success" />
      </div>

      {activeSection === "schedule" && (
        <SectionPanel
          title="Assigned interviews"
          description="Review your assigned interview schedule."
          actions={
            <button className="secondary" onClick={loadInterviews} type="button">
              Refresh
            </button>
          }
        >
          <DataTable
            loading={loading}
            rows={interviews}
            emptyText="No assigned interviews."
            columns={[
              { key: "id", header: "ID" },
              { key: "applicantName", header: "Candidate" },
              { key: "jobTitle", header: "Job" },
              { key: "interviewTime", header: "Time", render: (item) => shortDateTime(item.interviewTime) },
              { key: "interviewMode", header: "Mode" },
              { key: "locationOrLink", header: "Link / Room" },
              { key: "interviewStatus", header: "Status", render: (item) => <StatusBadge value={item.interviewStatus} /> },
            ]}
          />
        </SectionPanel>
      )}
    </div>
  );
}
