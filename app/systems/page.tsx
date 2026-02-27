"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDuration(ms?: number) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function timeAgo(ts?: number) {
  if (!ts) return "never";
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function OpsPage() {
  const cronJobs = useQuery(api.cron.getCronJobs);
  const health = useQuery(api.health.getLatestHealth);

  const jobs = cronJobs ?? [];
  const sorted = [...jobs].sort((a: any, b: any) => {
    if (a.lastStatus === "error" && b.lastStatus !== "error") return -1;
    if (b.lastStatus === "error" && a.lastStatus !== "error") return 1;
    return (a.nextRunAt ?? Infinity) - (b.nextRunAt ?? Infinity);
  });

  const totalJobs = jobs.length;
  const okJobs = jobs.filter((j: any) => j.lastStatus === "ok").length;
  const errorJobs = jobs.filter((j: any) => j.lastStatus === "error").length;
  const neverRan = jobs.filter((j: any) => !j.lastStatus).length;

  return (
    <div>
      <div className="page-header-compact"><h1><Settings size={20} style={{ color: "var(--accent-hex)" }} /> Ops</h1></div>

      {/* Quick Stats */}
      <div className="grid-2" style={{ marginBottom: "var(--space-md)" }}>
        <Card>
          <CardContent style={{ padding: "var(--space-md)", textAlign: "center" }}>
            <div className="metric-value" style={{ fontSize: "1.6rem", color: "var(--green)" }}>{okJobs}/{totalJobs}</div>
            <div className="label">Jobs Healthy</div>
            <div className="meta" style={{ fontSize: "var(--text-xs)" }}>{errorJobs > 0 ? `${errorJobs} failing` : "all clear"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: "var(--space-md)", textAlign: "center" }}>
            <div className="metric-value" style={{ fontSize: "1.6rem", color: "var(--accent-hex)" }}>{totalJobs}</div>
            <div className="label">Total Crons</div>
            <div className="meta" style={{ fontSize: "var(--text-xs)" }}>{neverRan > 0 ? `${neverRan} pending first run` : "all active"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Last Sync */}
      <div className="card-compact meta" style={{ marginBottom: "var(--space-md)" }}>
        📡 Last data sync: {health?.updatedAt ? timeAgo(health.updatedAt) : "unknown"}
      </div>

      {/* Cron Jobs List */}
      <Card style={{ marginBottom: "var(--space-md)" }}>
        <CardHeader><CardTitle>⏰ Cron Jobs</CardTitle></CardHeader>
        <CardContent>
          {sorted.length === 0 && <div className="meta" style={{ textAlign: "center", padding: "var(--space-xl)" }}>Loading cron data...</div>}
          {sorted.map((job: any) => {
            const statusCls = job.lastStatus === "ok" ? "status-dot status-ok" : job.lastStatus === "error" ? "status-dot status-error" : "status-dot status-pending";
            return (
              <div key={job.jobId} className="row-item">
                <span className={statusCls} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "var(--text-base)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {job.name}
                  </div>
                  <div className="meta" style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
                    <span>📅 {job.schedule}</span>
                    <span className="mono">⏱ {formatDuration(job.lastDurationMs)}</span>
                    <span>🕐 {timeAgo(job.lastRunAt)}</span>
                  </div>
                  {job.lastError && (
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--red)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      ⚠ {job.lastError}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="meta" style={{ textAlign: "center", padding: "var(--space-md) 0", borderTop: "1px solid var(--border-subtle)" }}>
        Mission Control · Ops · {totalJobs} jobs tracked
      </div>
    </div>
  );
}
