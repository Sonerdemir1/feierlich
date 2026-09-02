"use client";

import { useState } from "react";

const WIDTH = 320;
const HEIGHT = 92;
const PAD_X = 6;
const PAD_TOP = 10;
const PAD_BOTTOM = 18;

export function ViewsTrendChart({ data }: { data: { date: string; count: number }[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const max = Math.max(1, ...data.map((d) => d.count));
  const innerWidth = WIDTH - PAD_X * 2;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const step = data.length > 1 ? innerWidth / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: PAD_X + step * i,
    y: PAD_TOP + innerHeight - (d.count / max) * innerHeight,
    count: d.count,
    date: d.date,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(PAD_TOP + innerHeight).toFixed(1)} L ${points[0].x.toFixed(1)} ${(PAD_TOP + innerHeight).toFixed(1)} Z`;

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = step > 0 ? Math.round((relX - PAD_X) / step) : 0;
    setHoverIndex(Math.min(data.length - 1, Math.max(0, idx)));
  }

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ width: "100%", height: HEIGHT, display: "block", overflow: "visible" }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <line
          x1={PAD_X}
          y1={PAD_TOP + innerHeight}
          x2={WIDTH - PAD_X}
          y2={PAD_TOP + innerHeight}
          stroke="var(--line)"
          strokeWidth={1}
        />
        <path d={areaPath} fill="var(--terracotta)" opacity={0.1} />
        <path d={linePath} fill="none" stroke="var(--terracotta)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {hovered && (
          <line x1={hovered.x} y1={PAD_TOP} x2={hovered.x} y2={PAD_TOP + innerHeight} stroke="var(--line)" strokeWidth={1} />
        )}
        {points.map(
          (p, i) =>
            (i === points.length - 1 || i === hoverIndex) && (
              <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--terracotta)" stroke="var(--ivory)" strokeWidth={2} />
            )
        )}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--ink-faint)", marginTop: 2 }}>
        <span>{formatDate(data[0].date)}</span>
        <span>{formatDate(data[data.length - 1].date)}</span>
      </div>
      {hovered && (
        <div
          style={{
            position: "absolute",
            left: `${(hovered.x / WIDTH) * 100}%`,
            top: 0,
            transform: `translateX(${hoverIndex === 0 ? "0%" : hoverIndex === data.length - 1 ? "-100%" : "-50%"})`,
            background: "var(--ink)",
            color: "var(--ivory)",
            fontSize: 11,
            padding: "4px 8px",
            borderRadius: 6,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {formatDate(hovered.date)} · {hovered.count} {hovered.count === 1 ? "Aufruf" : "Aufrufe"}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(new Date(iso));
}
