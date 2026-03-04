"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Settings, CheckCircle, AlertTriangle, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

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

const AGENT_EMOJI: Record<string, string> = {
  quark: "🚀", coach: "🏋️", chef: "👨‍🍳", marco: "🇮🇹", qq: "📊",
};

type CronFilter = "all" | "errors" | "ok";

export default function OpsPage() {
  const cronJobs = useQuery(api.cron.getCronJobs);
  const health = useQuery(api.health.getLatestHealth);
  const reports = useQuery(api.reports.listReports, { limit: 10 });
  const [cronFilter, setCronFilter] = useState<CronFilter>("all");

  const jobs = cronJobs ?? [];
  const totalJobs = jobs.length;
  const okJobs = jobs.filter((j: any) => j.lastStatus === "ok").length;
  const errorJobs = jobs.filter((j: any) => j.lastStatus === "error").length;

  const filtered = cronFilter === "all" ? jobs
    : cronFilter === "errors" ? jobs.filter((j: any) => j.lastStatus === "error")
    : jobs.filter((j: any) => j.lastStatus === "ok");

  const sorted = [...filtered].sort((a: any, b: any) => {
    if (a.lastStatus === "error" && b.lastStatus !== "error") return -1;
    if (b.lastStatus === "error" && a.lastStatus !== "error") return 1;
    return (b.lastRunAt ?? 0) - (a.lastRunAt ?? 0);
  });

  return (
    <div>
      <div className="page-header-compact"><h1><Settings size={20} style={{ color: "var(--accent-hex)", filter: "drop-shadow(0 0 6px rgba(16,185,129,0.4))" }} /> Ops</h1></div>

      {/* Quick Stats */}
      <div className="grid-3" style={{ marginBottom: "var(--space-lg)" }}>
        <Card className="animate-in" style={{ animationDelay: "0.05s" }}>
          <CardContent style={{ padding: "var(--space-lg)", textAlign: "center" }}>
            <CheckCircle size={18} style={{ color: "var(--green)", marginBottom: 4 }} />
            <div className="metric-value" style={{ fontSize: "1.6rem", color: "var(--green)", textShadow: "0 0 12px rgba(16,185,129,0.3)" }}>{okJobs}/{totalJobs}</div>
            <div className="label" style={{ marginTop: "var(--space-sm)" }}>Healthy</div>
          </CardContent>
        </Card>
        <Card className="animate-in" style={{ animationDelay: "0.1s" }}>
          <CardContent style={{ padding: "var(--space-lg)", textAlign: "center" }}>
            <AlertTriangle size={18} style={{ color: errorJobs > 0 ? "var(--red)" : "var(--muted-hex)", marginBottom: 4 }} />
            <div className="metric-value" style={{ fontSize: "1.6rem", color: errorJobs > 0 ? "var(--red)" : "var(--muted-hex)" }}>{errorJobs}</div>
            <div className="label" style={{ marginTop: "var(--space-sm)" }}>Failing</div>
          </CardContent>
        </Card>
        <Card className="animate-in" style={{ animationDelay: "0.15s" }}>
          <CardContent style={{ padding: "var(--space-lg)", textAlign: "center" }}>
            <Clock size={18} style={{ color: "var(--cyan)", marginBottom: 4 }} />
            <div className="metric-value" style={{ fontSize: "1.4rem", color: "var(--cyan)" }}>{health?.updatedAt ? timeAgo(health.updatedAt) : "—"}</div>
            <div className="label" style={{ marginTop: "var(--space-sm)" }}>Last Sync</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      {reports && reports.length > 0 && (
        <Card className="animate-in" style={{ marginBottom: "var(--space-lg)", animationDelay: "0.2s" }}>
          <CardHeader><CardTitle><FileText size={16} style={{ marginRight: 6 }} />Recent Reports</CardTitle></CardHeader>
          <CardContent>
            {reports.map((r: any) => (
              <div key={r.reportId} className="row-item">
                <span style={{ fontSize: "1.1rem" }}>{AGENT_EMOJI[r.agent] || "📄"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.title}
                  </div>
                  <div className="meta" style={{ fontSize: "var(--text-xs)" }}>
                    {r.agent} · {r.reportType} · {r.date}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cron Jobs */}
      <Card className="animate-in" style={{ marginBottom: "var(--space-lg)", animationDelay: "0.25s" }}>
        <CardHeader>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <CardTitle>Cron Jobs</CardTitle>
            <div style={{ display: "flex", gap: 4 }}>
              {(["all", "errors", "ok"] as CronFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setCronFilter(f)}
                  style={{
                    padding: "4px 10px",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                    background: cronFilter === f ? "rgba(16,185,129,0.15)" : "transparent",
                    color: cronFilter === f ? "var(--accent-hex)" : "var(--muted-hex)",
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {f === "errors" ? `errors (${errorJobs})` : f}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 && totalJobs === 0 && (
            <div className="meta" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>Loading cron data...</div>
          )}
          {sorted.length === 0 && totalJobs > 0 && (
            <div className="meta" style={{ textAlign: "center", padding: "var(--space-xl)" }}>No jobs match filter</div>
          )}
          {sorted.map((job: any) => {
            const statusCls = job.lastStatus === "ok" ? "status-dot status-ok" : job.lastStatus === "error" ? "status-dot status-error" : "status-dot status-pending";
            return (
              <div key={job.jobId} className="row-item">
                <span className={statusCls} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {job.name}
                  </div>
                  <div className="meta" style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap", fontSize: "var(--text-xs)" }}>
                    <span>{job.schedule}</span>
                    <span className="mono">{formatDuration(job.lastDurationMs)}</span>
                    <span>{timeAgo(job.lastRunAt)}</span>
                  </div>
                  {job.lastError && (
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--red)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {job.lastError}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="meta" style={{ textAlign: "center", padding: "var(--space-lg) 0", borderTop: "1px solid var(--border-subtle)" }}>
        Mission Control · Ops · {totalJobs} jobs tracked
      </div>
    </div>
  );
}
