"use client";

import { useCallback, useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type TrendDir = "UP" | "DOWN" | "STABLE";

interface Threat {
  id: string;
  name: string;
  count: number;
  delta: number;
  severity: Priority;
  lastSeen: string;
}

interface Recommendation {
  id: string;
  priority: Priority;
  title: string;
  body: string;
  effort: "EASY" | "MEDIUM" | "HARD";
}

interface Insight {
  icon: string;
  text: string;
  trend: TrendDir;
}

interface QuickStat {
  label: string;
  value: string;
  color?: string;
}

interface PostureApiResponse {
  overallScore: number;
  fraudPrevention: number;
  authStrength: number;
  modelAccuracy: number;
  responseCoverage: number;
  policyCompliance: number;
  quickStats: QuickStat[];
  riskCards: { label: string; score: number; icon: string; detail: string }[];
  insights: Insight[];
  threats: Threat[];
  recommendations: Recommendation[];
  trend: number[];
  reportPeriod: string;
  business: string;
  lastScan: string;
}

function W95Button({
  children,
  active,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`select-none cursor-pointer px-3 py-1 font-mono text-xs text-black bg-[#c0c0c0] focus:outline-dotted focus:outline-1 focus:outline-black ${className}`}
      style={{
        borderStyle: "solid",
        borderWidth: "2px",
        borderColor: active
          ? "#808080 #808080 white white"
          : "white white #808080 #808080",
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      {children}
    </button>
  );
}

function TitleBar({ title }: { title: string }) {
  return (
    <div
      className="flex items-center justify-between px-2 py-1 select-none shrink-0"
      style={{ background: "linear-gradient(to right, #000080, #1084d0)" }}
    >
      <span className="text-white font-mono text-xs font-bold tracking-wide truncate mr-2">
        {title}
      </span>
      <div className="flex gap-1 shrink-0">
        { ["_", "□", "✕"].map((btn) => (
          <W95Button key={btn} className="!text-[10px] !px-1 !py-0 leading-none">
            {btn}
          </W95Button>
        )) }
      </div>
    </div>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-[#c0c0c0] ${className}`}
      style={{
        borderStyle: "solid",
        borderWidth: "2px",
        borderColor: "white white #808080 #808080",
      }}
    >
      {children}
    </div>
  );
}

function InsetPanel({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`${className}`}
      style={{
        borderStyle: "solid",
        borderWidth: "2px",
        borderColor: "#808080 white white #808080",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      <TitleBar title={title} />
      <Panel className="flex-1 p-3">{children}</Panel>
    </div>
  );
}

const scoreColor = (score: number) => {
  if (score >= 75) return "#00aa00";
  if (score >= 60) return "#cc8800";
  return "#cc0000";
};

const riskColor = (risk: number) => {
  if (risk <= 25) return "#00aa00";
  if (risk <= 50) return "#cc8800";
  return "#cc0000";
};

const PRIORITY_COLOR: Record<Priority, string> = {
  CRITICAL: "#ff2222",
  HIGH: "#ff8800",
  MEDIUM: "#cccc00",
  LOW: "#00aa00",
};

const TREND_COLOR: Record<TrendDir, string> = {
  UP: "#ff4444",
  DOWN: "#00aa44",
  STABLE: "#888888",
};

const TREND_ARROW: Record<TrendDir, string> = {
  UP: "▲",
  DOWN: "▼",
  STABLE: "►",
};

function SecurityScoreHeader({ posture }: { posture: PostureApiResponse }) {
  const color = scoreColor(posture.overallScore);
  return (
    <Section title="Security Posture Report  [BFCAI / IS-Depatment]">
      <div className="flex items-center gap-6 flex-wrap">
        <InsetPanel className="bg-black p-4 flex flex-col items-center justify-center" style={{ minWidth: "140px" }}>
          <div className="text-[10px] font-mono text-[#888] mb-1 tracking-widest">
            SECURITY SCORE
          </div>
          <div
            className="font-mono font-bold leading-none"
            style={{ fontSize: "56px", color, textShadow: `0 0 16px ${color}` }}
          >
            {posture.overallScore}
          </div>
          <div className="text-[10px] font-mono mt-1" style={{ color }}>
            / 100 — GOOD
          </div>
        </InsetPanel>

        <div className="flex-1 min-w-[200px]">
          <div className="font-mono text-xs text-black mb-2 font-bold">
            POSTURE RATING BREAKDOWN
          </div>

          {[
            { label: "Fraud Prevention", pct: posture.fraudPrevention },
            { label: "Auth Strength", pct: posture.authStrength },
            { label: "Model Accuracy", pct: posture.modelAccuracy },
            { label: "Response Coverage", pct: posture.responseCoverage },
            { label: "Policy Compliance", pct: posture.policyCompliance },
          ].map(({ label, pct }) => (
            <div key={label} className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] text-black w-40 shrink-0">{label}</span>
              <InsetPanel className="flex-1 bg-[#c0c0c0]" style={{ height: "14px" }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: scoreColor(pct),
                    boxShadow: `0 0 4px ${scoreColor(pct)}`,
                  }}
                />
              </InsetPanel>
              <span
                className="font-mono text-[10px] w-8 text-right"
                style={{ color: scoreColor(pct) }}
              >
                {pct}%
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1 min-w-[160px]">
          {posture.quickStats.map((stat) => (
            <div key={stat.label} className="flex justify-between gap-4">
              <span className="font-mono text-[10px] text-[#444]">{stat.label}:</span>
              <span
                className="font-mono text-[10px] font-bold"
                style={{ color: stat.color ?? "#000" }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function RiskBreakdown({ cards }: { cards: PostureApiResponse["riskCards"] }) {
  return (
    <Section title="Risk Breakdown — by Category">
      <div className="grid grid-cols-5 gap-2 min-w-0">
        {cards.map((card) => {
          const col = riskColor(card.score);
          return (
            <div key={card.label} className="flex flex-col">
              <InsetPanel className="bg-black p-2 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{card.icon}</span>
                  <span
                    className="font-mono text-lg font-bold leading-none"
                    style={{ color: col, textShadow: `0 0 6px ${col}` }}
                  >
                    {card.score}
                  </span>
                </div>
                <div className="font-mono text-[9px] text-[#00cc00] font-bold leading-tight">
                  {card.label.toUpperCase()}
                </div>
                <div className="w-full bg-[#001100] mt-1" style={{ height: "6px", border: "1px solid #003300" }}>
                  <div
                    style={{
                      width: `${card.score}%`,
                      height: "100%",
                      background: col,
                      boxShadow: `0 0 3px ${col}`,
                    }}
                  />
                </div>
                <div className="font-mono text-[8px] text-[#555] leading-tight mt-1">
                  {card.detail}
                </div>
              </InsetPanel>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function KeyInsights({ insights }: { insights: Insight[] }) {
  return (
    <Section title="Key Insights — Last 7 Days">
      <div className="flex flex-col gap-1">
        {insights.map((ins, index) => (
          <div
            key={index}
            className="flex items-start gap-2 py-1"
            style={{ borderBottom: index < insights.length - 1 ? "1px solid #b0b0b0" : "none" }}
          >
            <span
              className="font-mono text-xs font-bold shrink-0 mt-0.5"
              style={{ color: TREND_COLOR[ins.trend], minWidth: "16px" }}
            >
              {TREND_ARROW[ins.trend]}
            </span>
            <span className="font-mono text-[11px] text-black leading-snug">{ins.text}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function TopThreats({ threats }: { threats: Threat[] }) {
  return (
    <Section title="Top Threats — Active Intelligence Feed">
      <div
        className="grid font-mono text-[10px] font-bold text-black pb-1 mb-1"
        style={{
          gridTemplateColumns: "40px 1fr 70px 70px 80px 100px",
          borderBottom: "2px solid #808080",
        }}
      >
        <span>ID</span>
        <span>THREAT NAME</span>
        <span className="text-right">COUNT</span>
        <span className="text-right">Δ WEEK</span>
        <span className="text-center">SEVERITY</span>
        <span className="text-right">LAST SEEN</span>
      </div>

      {threats.map((t, index) => (
        <div
          key={t.id}
          className="grid font-mono text-[11px] text-black py-0.5 items-center"
          style={{
            gridTemplateColumns: "40px 1fr 70px 70px 80px 100px",
            borderBottom: index < threats.length - 1 ? "1px solid #d0d0d0" : "none",
            background: index % 2 === 0 ? "transparent" : "rgba(0,0,0,0.04)",
          }}
        >
          <span className="text-[#808080]">{t.id}</span>
          <span className="font-bold truncate pr-2">{t.name}</span>
          <span className="text-right">{t.count.toLocaleString()}</span>
          <span
            className="text-right font-bold"
            style={{ color: t.delta > 0 ? "#cc0000" : "#008800" }}
          >
            {t.delta > 0 ? "+" : ""}{t.delta}%
          </span>
          <span className="text-center">
            <span
              className="font-mono text-[9px] font-bold px-1 py-0.5"
              style={{
                background: PRIORITY_COLOR[t.severity],
                color: t.severity === "MEDIUM" ? "#000" : "#fff",
              }}
            >
              {t.severity}
            </span>
          </span>
          <span className="text-right text-[#555]">{t.lastSeen}</span>
        </div>
      ))}
    </Section>
  );
}

function Recommendations({ recommendations }: { recommendations: Recommendation[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Section title="Personalized Recommendations — Prioritized Action Items">
      <div className="flex flex-col gap-2">
        {recommendations.map((rec) => {
          const isOpen = expanded === rec.id;
          const pCol = PRIORITY_COLOR[rec.priority];
          return (
            <div
              key={rec.id}
              className="flex flex-col"
              style={{
                border: "1px solid #b0b0b0",
                background: isOpen ? "#f0f0f0" : "#e8e8e8",
              }}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : rec.id)}
                className="flex items-center gap-2 px-2 py-1.5 text-left w-full font-mono text-[11px] text-black hover:bg-[#d8d8d8] focus:outline-none"
              >
                <span
                  className="font-bold text-[9px] px-1 py-0.5 shrink-0"
                  style={{
                    background: pCol,
                    color: rec.priority === "MEDIUM" || rec.priority === "LOW" ? "#000" : "#fff",
                    minWidth: "52px",
                    textAlign: "center",
                  }}
                >
                  {rec.priority}
                </span>
                <span
                  className="font-mono text-[9px] px-1 py-0.5 shrink-0"
                  style={{
                    background: "#c0c0c0",
                    border: "1px solid #808080",
                    color: "#000",
                  }}
                >
                  {rec.effort}
                </span>
                <span className="font-bold flex-1 truncate">{rec.title}</span>
                <span className="shrink-0 text-[#808080]">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen ? (
                <div className="px-3 pb-2 pt-1 font-mono text-[11px] text-black leading-snug border-t border-[#b0b0b0]">
                  [{rec.id}] {rec.body}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function TrendChart({ trend, overallScore }: { trend: number[]; overallScore: number }) {
  if (trend.length === 0) {
    return (
      <Section title="Security Score Trend — Last 30 Days">
        <div className="font-mono text-[11px] text-black">No trend data available.</div>
      </Section>
    );
  }

  const max = Math.max(...trend);
  const min = Math.min(...trend);

  return (
    <Section title="Security Score Trend — Last 30 Days">
      <div className="flex flex-col gap-2">
        <div className="flex items-end gap-0.5" style={{ height: "120px" }}>
          <div className="flex flex-col justify-between h-full mr-1 shrink-0">
            {[100, 75, 50, 25, 0].map((n) => (
              <span key={n} className="font-mono text-[8px] text-[#808080] leading-none">
                {n}
              </span>
            ))}
          </div>

          {trend.map((val, index) => {
            const isToday = index === trend.length - 1;
            const heightPct = (val / 100) * 100;
            const col = scoreColor(val);
            return (
              <div
                key={index}
                className="flex-1 flex flex-col justify-end relative group"
                style={{ height: "100%" }}
                title={`Day ${index + 1}: ${val}`}
              >
                <div
                  style={{
                    height: `${heightPct}%`,
                    background: isToday ? "#ffffff" : col,
                    boxShadow: isToday ? `0 0 6px #fff` : `0 0 2px ${col}`,
                    border: isToday ? "1px solid #aaa" : "none",
                    transition: "height 0.3s ease",
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-between font-mono text-[8px] text-[#808080]">
          <span>30d ago</span>
          <span>15d ago</span>
          <span>Today ({overallScore})</span>
        </div>

        <div className="flex gap-4 font-mono text-[10px] text-black pt-1 border-t border-[#b0b0b0]">
          <span>
            MIN: <span style={{ color: scoreColor(min) }} className="font-bold">{min}</span>
          </span>
          <span>
            MAX: <span style={{ color: scoreColor(max) }} className="font-bold">{max}</span>
          </span>
          <span>
            ΔPERIOD: <span style={{ color: trend[trend.length - 1] > trend[0] ? "#008800" : "#cc0000" }} className="font-bold">
              {trend[trend.length - 1] > trend[0] ? "+" : ""}{trend[trend.length - 1] - trend[0]} pts
            </span>
          </span>
          <span className="ml-auto text-[#555]">
            ■ <span style={{ color: "#ffffff", textShadow: "0 0 3px #aaa" }}>■</span> = TODAY
          </span>
        </div>
      </div>
    </Section>
  );
}

export default function PosturePage() {
  const [posture, setPosture] = useState<PostureApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

 

// Replace the entire loadPosture function
const loadPosture = useCallback(async () => {
  setLoading(true);
  setErrorMessage(null);
  
  try {
    const token = getToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/posture`, { headers });

    if (res.status === 401) {
      window.location.href = "/auth";
      throw new Error("Session expired — redirecting to login");
    }

    if (!res.ok) throw new Error(`Backend returned ${res.status}`);

    const data: PostureApiResponse = await res.json();
    setPosture(data);
  } catch (error) {
    setErrorMessage(error instanceof Error ? error.message : "Unknown error");
  } finally {
    setLoading(false);
  }
}, []);

  
  useEffect(() => {
    loadPosture();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!posture) return;
    const rows = [
      ["Threat ID", "Threat Name", "Count", "Delta", "Severity", "Last Seen"],
      ...posture.threats.map((t) => [
        t.id,
        t.name,
        t.count.toString(),
        `${t.delta > 0 ? "+" : ""}${t.delta}%`,
        t.severity,
        t.lastSeen,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aegis-posture-threats.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleEmailSummary = () => {
    if (!posture) return;
    const subject = "AEGIS RADAR Security Posture Summary";
    const body = [
      `Overall Score: ${posture.overallScore}/100`,
      `Fraud Prevention: ${posture.fraudPrevention}%`,
      `Auth Strength: ${posture.authStrength}%`,
      `Model Accuracy: ${posture.modelAccuracy}%`,
      `Response Coverage: ${posture.responseCoverage}%`,
      `Policy Compliance: ${posture.policyCompliance}%`,
      "Top threats:",
      ...posture.threats.slice(0, 3).map((t) => `- ${t.name}: ${t.count} cases (${t.severity})`),
      "Recommendations:",
      ...posture.recommendations.slice(0, 2).map((r) => `- ${r.title}`),
    ].join("\n");

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div
      className="flex flex-col overflow-y-auto"
      style={{
        fontFamily: "'Courier New', Courier, monospace",
        background: "#c0c0c0",
      }}
    >
      <div
        className="flex items-center gap-2 px-2 py-1.5 shrink-0"
        style={{ borderBottom: "2px solid #808080", background: "#c0c0c0" }}
      >
        <W95Button className="!text-[10px]" onClick={handlePrint}>
          🖨 Print Report
        </W95Button>
        <W95Button className="!text-[10px]" onClick={handleExportCsv}>
          💾 Export CSV
        </W95Button>
        <W95Button className="!text-[10px]" onClick={handleEmailSummary}>
          📧 Email Summary
        </W95Button>
        <div className="w-px h-4 bg-[#808080] mx-1" />
        <W95Button className="!text-[10px]" onClick={loadPosture}>
          🔄 Refresh
        </W95Button>
        <div className="flex-1" />
        <span className="font-mono text-[10px] text-[#444]">
          {posture?.reportPeriod ?? "Report period: loading..."} ;&nbsp;|&nbsp; {posture?.business ?? "Business: loading..."}
        </span>
      </div>

      <div className="flex flex-col gap-3 p-3">
        {errorMessage ? (
          <div className="text-[#aa0000] font-mono text-[11px] p-3 bg-[#f7eaea] border border-[#ddbbbb]">
            {errorMessage}
          </div>
        ) : null}

        {loading && !posture ? (
          <div className="text-[#004400] font-mono text-[12px] p-6 bg-[#f0f0f0] border border-[#808080]">
            Loading security posture data...
          </div>
        ) : null}

        {posture ? (
          <>
            <SecurityScoreHeader posture={posture} />
            <RiskBreakdown cards={posture.riskCards} />
            <div className="grid grid-cols-2 gap-3">
              <KeyInsights insights={posture.insights} />
              <TrendChart trend={posture.trend} overallScore={posture.overallScore} />
            </div>
            <TopThreats threats={posture.threats} />
            <Recommendations recommendations={posture.recommendations} />
          </>
        ) : !loading ? (
          <div className="text-[#555] font-mono text-[11px] p-4 bg-[#e8e8e8] border border-[#808080]">
            No posture data available. Please refresh or verify that the backend is running.
          </div>
        ) : null}

        <div
          className="font-mono text-[9px] text-[#555] text-center pb-1"
          style={{ borderTop: "1px solid #b0b0b0", paddingTop: "6px" }}
        >
          AEGIS RADAR V3.3.3 — AI-Powered Fraud Detection &nbsp;|&nbsp; Data refreshed every 15 min
          &nbsp;|&nbsp; © 2026 EXE Solutions, Cairo EG &nbsp;|&nbsp; All risk scores are indicative
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; top: 0; left: 0; width: 100%; }
        }
        ::-webkit-scrollbar { width: 16px; height: 16px; }
        ::-webkit-scrollbar-track { background: #c0c0c0; }
        ::-webkit-scrollbar-thumb {
          background: #c0c0c0;
          border-style: solid; border-width: 2px;
          border-color: white white #808080 #808080;
        }
        ::-webkit-scrollbar-corner { background: #c0c0c0; }
      `}</style>
    </div>
  );
}
