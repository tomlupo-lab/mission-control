"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LightweightChart from "@/components/LightweightChart";

function formatPct(v: number | undefined | null): string {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}
function formatUsd(v: number | undefined | null): string {
  if (v == null) return "—";
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function pctColor(v: number | undefined | null): string {
  if (v == null) return "var(--muted)";
  return v >= 0 ? "var(--green)" : "var(--red)";
}

function MiniSparkline({ data, width = 48, height = 16 }: { data: { date: string; value: number }[]; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const last7 = data.slice(-7);
  const vals = last7.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const points = vals.map((v, i) => `${(i / (vals.length - 1)) * width},${height - ((v - min) / range) * height}`).join(" ");
  const color = vals[vals.length - 1] >= vals[0] ? "var(--green)" : "var(--red)";
  return (
    <svg width={width} height={height} style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 6 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DriftBar({ actualWt, drift, sideColor }: { actualWt: number; drift: number; sideColor: string }) {
  const absDrift = Math.abs(drift ?? 0);
  let barColor = sideColor;
  let barOpacity = 0.7;
  if (absDrift > 12) { barColor = "var(--red)"; barOpacity = 0.9; }
  else if (absDrift > 7) { barColor = "var(--orange)"; barOpacity = 0.85; }
  else if (absDrift > 3) { barColor = "var(--orange)"; barOpacity = 0.6; }

  return (
    <div>
      <div className="progress-bar">
        <div className="fill" style={{
          width: `${Math.min(Math.abs(actualWt), 50) * 2}%`,
          background: barColor, opacity: barOpacity,
        }} />
      </div>
      <div className="flex-between" style={{ marginTop: 2 }}>
        <span className="mono" style={{ fontSize: "var(--text-xs)", color: sideColor }}>{(actualWt ?? 0).toFixed(1)}%</span>
        {absDrift > 3 && (
          <span style={{ fontSize: "var(--text-xs)", color: absDrift > 7 ? "var(--red)" : "var(--orange)" }}>
            drift {(drift ?? 0).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function StrategyCard({ s }: { s: any }) {
  const [positionsOpen, setPositionsOpen] = useState(false);
  const positions = s.positionBreakdown?.filter((p: any) => p.notional > 0 || Math.abs(p.actualWt) > 0.1) ?? [];

  return (
    <Card style={{ marginBottom: "var(--space-md)" }}>
      <CardHeader>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", minWidth: 0, flex: 1 }}>
          <CardTitle>{s.name}</CardTitle>
          <Badge variant={s.mode === "live" ? "live" : "paper"}>
            {s.mode === "live" ? "LIVE" : "PAPER"}
          </Badge>
        </div>
        <span className="meta">{s.exchange}</span>
      </CardHeader>

      <CardContent>
        {/* Equity + 1D */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-md)", marginBottom: "var(--space-md)" }}>
          <span className="metric-value" style={{ fontSize: "var(--text-3xl)" }}>{formatUsd(s.equity)}</span>
          {s.return1d != null && (
            <span className="metric-value" style={{ fontSize: "var(--text-lg)", color: pctColor(s.return1d) }}>{formatPct(s.return1d)}</span>
          )}
        </div>

        {/* Equity curve */}
        {s.equityCurve && s.equityCurve.length > 1 && (
          <div style={{ marginBottom: "var(--space-md)", marginLeft: -16, marginRight: -16 }}>
            <LightweightChart data={s.equityCurve} height={180} />
          </div>
        )}

        {/* Collapsible Positions */}
        {positions.length > 0 && (
          <div style={{ marginBottom: "var(--space-md)" }}>
            <button onClick={() => setPositionsOpen(!positionsOpen)} style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              display: "flex", alignItems: "center", gap: "var(--space-xs)",
            }}>
              <span className="section-title" style={{ margin: 0 }}>
                <span style={{ display: "inline-block", transform: positionsOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▶</span>
                {" "}Positions ({positions.length})
              </span>
              {!positionsOpen && (
                <span className="meta" style={{ textTransform: "none", letterSpacing: 0 }}>
                  — {positions.map((p: any) => p.symbol).join(", ")}
                </span>
              )}
            </button>

            {positionsOpen && (
              <div className="flex-col gap-xs" style={{ marginTop: "var(--space-sm)" }}>
                {positions.map((p: any) => {
                  const sideColor = p.side === "short" ? "var(--red)" : p.side === "long" ? "var(--green)" : "var(--muted)";
                  const pnlColor = (p.unrealizedPnl ?? 0) >= 0 ? "var(--green)" : "var(--red)";
                  const pillCls = p.side === "short" ? "pill pill-red" : p.side === "long" ? "pill pill-green" : "pill pill-muted";
                  return (
                    <div key={p.symbol} style={{
                      display: "flex", alignItems: "center", gap: "var(--space-sm)",
                      padding: "var(--space-xs) var(--space-sm)", background: "var(--card2)", borderRadius: "var(--radius-sm)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", width: 80, flexShrink: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>{p.symbol}</span>
                        <span className={pillCls} style={{ fontSize: "0.55rem", padding: "1px 4px" }}>{p.side?.toUpperCase() ?? "—"}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <DriftBar actualWt={p.actualWt ?? 0} drift={p.drift ?? 0} sideColor={sideColor} />
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div className="mono" style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>${(p.notional ?? 0).toFixed(0)}</div>
                        <div className="mono" style={{ fontSize: "var(--text-xs)", color: pnlColor }}>
                          {(p.unrealizedPnl ?? 0) >= 0 ? "+" : ""}{formatUsd(p.unrealizedPnl)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Performance row */}
        <div className="grid-4" style={{ marginBottom: "var(--space-md)" }}>
          {[
            { label: "1D", val: s.return1d },
            { label: "7D", val: s.return7d },
            { label: "30D", val: s.return30d },
            { label: "ITD", val: s.returnItd },
          ].map((p) => (
            <div key={p.label} style={{ textAlign: "center" }}>
              <div className="label">{p.label}</div>
              <div className="metric-value" style={{ fontSize: "var(--text-base)", color: pctColor(p.val) }}>{formatPct(p.val)}</div>
            </div>
          ))}
        </div>

        {/* Risk row */}
        <div className="grid-3" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "var(--space-md)" }}>
          {[
            { label: "Sharpe", val: s.sharpe != null ? s.sharpe.toFixed(2) : "—" },
            { label: "Max DD", val: s.maxDrawdown != null ? `-${s.maxDrawdown.toFixed(1)}%` : "—" },
            { label: "Win Rate", val: s.winRate != null ? `${s.winRate.toFixed(0)}%` : "—" },
          ].map((m) => (
            <div key={m.label} style={{ textAlign: "center" }}>
              <div className="label">{m.label}</div>
              <div className="mono" style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>{m.val}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TradeLogTimeline() {
  const trades = useQuery(api.trading.getRecentTrades, { limit: 30 });
  if (!trades || trades.length === 0) {
    return <div className="card meta" style={{ textAlign: "center", padding: "var(--space-xl)", marginTop: "var(--space-lg)" }}>No trades recorded yet</div>;
  }

  const grouped: Record<string, typeof trades> = {};
  for (const t of trades) {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(t);
  }

  return (
    <div style={{ marginTop: "var(--space-lg)" }}>
      <div className="section-title">📜 Recent Trades</div>
      {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, dateTrades]) => (
        <div key={date} style={{ marginBottom: "var(--space-md)" }}>
          <div className="label" style={{ marginBottom: "var(--space-xs)", fontWeight: 600 }}>{date}</div>
          <div className="flex-col gap-xs">
            {dateTrades.map((t, i) => {
              const isBuy = t.side === "buy";
              const sideColor = isBuy ? "var(--green)" : "var(--red)";
              const notional = t.notional ?? t.quantity * t.price;
              return (
                <div key={`${t.symbol}-${t.side}-${i}`} style={{
                  display: "flex", alignItems: "center", gap: "var(--space-sm)",
                  padding: "var(--space-sm) var(--space-md)", background: "var(--card2)", borderRadius: "var(--radius-sm)",
                  borderLeft: `3px solid ${sideColor}`,
                }}>
                  <span className={isBuy ? "pill pill-green" : "pill pill-red"} style={{ width: 36, textAlign: "center", padding: "1px 0" }}>
                    {t.side.toUpperCase()}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: "var(--text-base)", width: 48 }}>{t.symbol}</span>
                  <div className="mono meta" style={{ flex: 1 }}>
                    {t.quantity.toFixed(t.quantity < 1 ? 5 : 2)} @ ${t.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <span className="mono" style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>${notional.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TradingPage() {
  const strategies = useQuery(api.trading.getStrategies);
  const live = strategies?.filter((s) => s.mode === "live") ?? [];
  const paper = strategies?.filter((s) => s.mode === "paper") ?? [];
  const totalEquity = live.reduce((sum, s) => sum + (s.equity ?? 0), 0);
  const totalPnl1d = live.reduce((sum, s) => {
    if (s.return1d != null && s.equity != null) return sum + (s.equity * s.return1d) / (100 + s.return1d);
    return sum;
  }, 0);
  const totalPositions = live.reduce((sum, s) => sum + (s.positions ?? 0), 0);
  const liveSparkData = live.length > 0 && live[0].equityCurve ? live[0].equityCurve : null;
  const paperSparkData = paper.length > 0 && paper[0].equityCurve ? paper[0].equityCurve : null;

  return (
    <div>
      <div className="page-header-compact"><h1>📈 Trading</h1></div>

      {/* Summary */}
      {strategies && (
        <div className="grid-3" style={{ marginBottom: "var(--space-lg)" }}>
          <div className="stat-card">
            <div className="value" style={{ color: "var(--green)" }}>{formatUsd(totalEquity)}</div>
            <div className="label">Live Equity</div>
            <div className="sub">{live.length} strategies</div>
          </div>
          <div className="stat-card">
            <div className="value" style={{ color: pctColor(totalPnl1d) }}>
              {totalPnl1d >= 0 ? "+" : ""}{formatUsd(totalPnl1d)}
            </div>
            <div className="label">1D P&L</div>
            <div className="sub">combined</div>
          </div>
          <div className="stat-card">
            <div className="value" style={{ color: "var(--accent)" }}>{totalPositions}</div>
            <div className="label">Positions</div>
            <div className="sub">live</div>
          </div>
        </div>
      )}

      {/* Strategy cards */}
      <div>
        {!strategies && <div className="shimmer" style={{ height: 200 }} />}
        {strategies && strategies.length === 0 && (
          <div className="card meta" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>No strategies synced yet</div>
        )}
        {strategies && strategies.length > 0 && (
          <Tabs defaultValue="live">
            <TabsList>
              <TabsTrigger value="live">
                🟢 Live ({live.length})
                {liveSparkData && <MiniSparkline data={liveSparkData} />}
              </TabsTrigger>
              <TabsTrigger value="paper">
                🟡 Paper ({paper.length})
                {paperSparkData && <MiniSparkline data={paperSparkData} />}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="live">
              {live.length === 0 ? (
                <div className="card meta" style={{ textAlign: "center", padding: "var(--space-xl)" }}>No live strategies</div>
              ) : live.map((s) => <StrategyCard key={s.strategyId} s={s} />)}
            </TabsContent>
            <TabsContent value="paper">
              {paper.length === 0 ? (
                <div className="card meta" style={{ textAlign: "center", padding: "var(--space-xl)" }}>No paper strategies</div>
              ) : paper.map((s) => <StrategyCard key={s.strategyId} s={s} />)}
            </TabsContent>
          </Tabs>
        )}
        <TradeLogTimeline />
      </div>
    </div>
  );
}
