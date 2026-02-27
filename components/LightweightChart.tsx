"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, AreaSeries, type IChartApi } from "lightweight-charts";

interface LightweightChartProps {
  data: { date: string; value: number }[];
  height?: number;
}

export default function LightweightChart({ data, height = 120 }: LightweightChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length < 2) return;

    const root = document.documentElement;
    const getVar = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();

    const bgColor = getVar("--card") || "#141418";
    const borderColor = getVar("--border-subtle") || "#1f1f23";
    const textColor = getVar("--muted") || "#71717a";

    const last = data[data.length - 1].value;
    const first = data[0].value;
    const lineColor = last >= first ? (getVar("--green") || "#34d399") : (getVar("--red") || "#f87171");

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: bgColor },
        textColor,
        fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: borderColor },
        horzLines: { color: borderColor },
      },
      rightPriceScale: { borderColor, visible: true },
      timeScale: { borderColor, visible: true },
      crosshair: {
        horzLine: { color: borderColor },
        vertLine: { color: borderColor },
      },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor,
      topColor: lineColor + "30",
      bottomColor: lineColor + "05",
      lineWidth: 2,
    });

    series.setData(data.map(d => ({ time: d.date as any, value: d.value })));
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data, height]);

  if (!data || data.length < 2) return null;

  return <div ref={containerRef} style={{ width: "100%", borderRadius: "var(--radius-md)", overflow: "hidden" }} />;
}
