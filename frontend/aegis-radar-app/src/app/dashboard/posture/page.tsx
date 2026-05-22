"use client";

/**
 * src/app/dashboard/posture/page.tsx
 *
 * AEGIS RADAR — Security Posture page.
 * Displays overall security score, risk breakdown, threat intelligence,
 * recommendations, and a 30-day trend chart.
 *
 * Sits inside layout.tsx which provides the Win95 shell + sidebar.
 * This file is fully self-contained: no external UI libraries required.
 */

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type TrendDir = "UP" | "DOWN" | "STABLE";

interface RiskCard {
  label: string;
  score: number;      // 0–100 (higher = riskier)
  icon: string;
  detail: string;
}

interface Threat {
  id: string;
  name: string;
  count: number;
  delta: number;      // % change vs last period
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

// ─── Static data (realistic for Egypt e-commerce) ────────────────────────────

const OVERALL_SCORE = 78;

const RISK_CARDS: RiskCard[] = [
  {
    label: "Transaction Risk",
    score: 22,
    icon: "💳",
    detail: "2.3% of txns flagged this week — down from 3.1%",
  },
  {
    label: "Behavioral Risk",
    score: 34,
    icon: "👤",
    detail: "Unusual login bursts from Alexandria / Port Said nodes",
  },
  {
    label: "Device Fingerprint",
    score: 18,
    icon: "🖥",
    detail: "94 new unknown device hashes in last 24 h",
  },
  {
    label: "Merchant Category",
    score: 41,
    icon: "🏪",
    detail: "Electronics & mobile-top-up MCC elevated — common card-testing vector",
  },
  {
    label: "Velocity Risk",
    score: 29,
    icon: "⚡",
    detail: "3 accounts hit 15+ txn/hour threshold — auto-challenged",
  },
];

const THREATS: Threat[] = [
  {
    id: "T01",
    name: "Card Testing Attacks",
    count: 312,
    delta: +18,
    severity: "CRITICAL",
    lastSeen: "14 min ago",
  },
  {
    id: "T02",
    name: "Account Takeover (ATO)",
    count: 87,
    delta: -4,
    severity: "HIGH",
    lastSeen: "1 hr ago",
  },
  {
    id: "T03",
    name: "Friendly Fraud / Chargebacks",
    count: 54,
    delta: +2,
    severity: "HIGH",
    lastSeen: "3 hrs ago",
  },
  {
    id: "T04",
    name: "Promo / Coupon Abuse",
    count: 140,
    delta: +31,
    severity: "MEDIUM",
    lastSeen: "22 min ago",
  },
  {
    id: "T05",
    name: "SIM-Swap OTP Bypass",
    count: 9,
    delta: +9,
    severity: "CRITICAL",
    lastSeen: "6 hrs ago",
  },
  {
    id: "T06",
    name: "Reseller Bot Activity",
    count: 228,
    delta: -11,
    severity: "MEDIUM",
    lastSeen: "45 min ago",
  },
];

const INSIGHTS: Insight[] = [
  {
    icon: "▲",
    text: "Card-testing volume spiked +18% — correlates with recent Ramadan sale campaign on Jumia EG",
    trend: "UP",
  },
  {
    icon: "▼",
    text: "ATO attempts declined after enforcing 2-FA on high-risk logins from new governorates",
    trend: "DOWN",
  },
  {
    icon: "►",
    text: "72% of flagged transactions originate from mobile (Android); iOS share stable",
    trend: "STABLE",
  },
  {
    icon: "▲",
    text: "Promo abuse surging — 31% increase tied to referral link farming via WhatsApp groups",
    trend: "UP",
  },
  {
    icon: "▼",
    text: "False-positive rate improved from 1.8% → 1.1% after model recalibration last Tuesday",
    trend: "DOWN",
  },
];

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: "R01",
    priority: "CRITICAL",
    title: "Enable CAPTCHA on guest checkout",
    body: "Card-testing scripts exploit your frictionless guest flow. Adding invisible CAPTCHA on payment submission cuts bot throughput by ~80% with no UX impact.",
    effort: "EASY",
  },
  {
    id: "R02",
    priority: "CRITICAL",
    title: "Block SIM-swap window (30 min post-swap)",
    body: "9 SIM-swap OTP bypasses detected. Partner with Vodafone EG / Orange EG API to flag recently ported numbers and enforce a cooling-off period before OTP delivery.",
    effort: "HARD",
  },
  {
    id: "R03",
    priority: "HIGH",
    title: "Velocity cap on referral code redemptions",
    body: "WhatsApp farming rings are redeeming referral codes at 40–60×/hr per IP cluster. Limit redemptions to 3/device/day and 1 per verified phone number.",
    effort: "EASY",
  },
  {
    id: "R04",
    priority: "HIGH",
    title: "Flag electronics MCC transactions >EGP 2,500 for step-up auth",
    body: "B.TECH & Noon Electronics are top chargeback MCC sources. Requiring OTP confirmation for high-value electronics orders reduces friendly-fraud exposure.",
    effort: "MEDIUM",
  },
  {
    id: "R05",
    priority: "MEDIUM",
    title: "Enrich device fingerprints with canvas + audio signals",
    body: "Current fingerprinting misses 6% of known fraud devices that clear cookies. Adding canvas rendering and AudioContext hashes closes that gap.",
    effort: "MEDIUM",
  },
  {
    id: "R06",
    priority: "LOW",
    title: "Schedule weekly model re-training",
    body: "AEGIS RADAR model was last retrained 18 days ago. Weekly retraining on fresh transaction data keeps precision above 97% as fraud patterns shift.",
    effort: "EASY",
  },
];

// 30-day trend: score per day (index 0 = 30 days ago, index 29 = today)
const TREND_DATA = [
  61, 63, 62, 65, 64, 67, 66, 68, 67, 70,
  69, 71, 70, 72, 71, 73, 72, 74, 73, 75,
  74, 76, 75, 77, 76, 77, 78, 77, 79, 78,
];

// ─── Primitive Win95 components ───────────────────────────────────────────────

/** Classic beveled W95 button */
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

/** Blue Win95 title bar */
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
        {["_", "□", "✕"].map((btn) => (
          <W95Button key={btn} className="!text-[10px] !px-1 !py-0 leading-none">
            {btn}
          </W95Button>
        ))}
      </div>
    </div>
  );
}

/** Gray raised panel (outset) */
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

/** Sunken inset panel */
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

/** Section wrapper: TitleBar + Panel body */
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

// ─── Helper: score → colour ───────────────────────────────────────────────────

/** Map a 0–100 security score to a display colour */
const scoreColor = (score: number) => {
  if (score >= 75) return "#00aa00";
  if (score >= 60) return "#cc8800";
  return "#cc0000";
};

/** Map a 0–100 risk level (higher = riskier) to a colour */
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

// ─── Sub-sections ─────────────────────────────────────────────────────────────

/** Big security score dial */
function SecurityScoreHeader() {
  const color = scoreColor(OVERALL_SCORE);
  return (
    <Section title="Security Posture Report  [CIB Egypt / E-Commerce Division]">
      <div className="flex items-center gap-6 flex-wrap">
        {/* Score dial */}
        <InsetPanel className="bg-black p-4 flex flex-col items-center justify-center" style={{ minWidth: "140px" }}>
          <div className="text-[10px] font-mono text-[#888] mb-1 tracking-widest">
            SECURITY SCORE
          </div>
          <div
            className="font-mono font-bold leading-none"
            style={{ fontSize: "56px", color, textShadow: `0 0 16px ${color}` }}
          >
            {OVERALL_SCORE}
          </div>
          <div className="text-[10px] font-mono mt-1" style={{ color }}>
            / 100 — GOOD
          </div>
        </InsetPanel>

        {/* Score breakdown bar */}
        <div className="flex-1 min-w-[200px]">
          <div className="font-mono text-xs text-black mb-2 font-bold">
            POSTURE RATING BREAKDOWN
          </div>

          {[
            { label: "Fraud Prevention",    pct: 82 },
            { label: "Auth Strength",       pct: 74 },
            { label: "Model Accuracy",      pct: 91 },
            { label: "Response Coverage",   pct: 68 },
            { label: "Policy Compliance",   pct: 77 },
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

        {/* Quick stats column */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          {[
            { label: "LAST SCAN",     value: "Today 09:14" },
            { label: "OPEN ALERTS",   value: "7",          color: "#ff4444" },
            { label: "RULES ACTIVE",  value: "143" },
            { label: "MODEL VERSION", value: "v4.2.1-EG" },
            { label: "DATA WINDOW",   value: "30 DAYS" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between gap-4">
              <span className="font-mono text-[10px] text-[#444]">{label}:</span>
              <span
                className="font-mono text-[10px] font-bold"
                style={{ color: color ?? "#000" }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/** 5 risk-category cards */
function RiskBreakdown() {
  return (
    <Section title="Risk Breakdown — by Category">
      <div className="grid grid-cols-5 gap-2 min-w-0">
        {RISK_CARDS.map((card) => {
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

                {/* Mini gauge */}
                <div
                  className="w-full bg-[#001100] mt-1"
                  style={{ height: "6px", border: "1px solid #003300" }}
                >
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

/** Key insights list */
function KeyInsights() {
  return (
    <Section title="Key Insights — Last 7 Days">
      <div className="flex flex-col gap-1">
        {INSIGHTS.map((ins, i) => (
          <div
            key={i}
            className="flex items-start gap-2 py-1"
            style={{ borderBottom: i < INSIGHTS.length - 1 ? "1px solid #b0b0b0" : "none" }}
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

/** Top threats table */
function TopThreats() {
  return (
    <Section title="Top Threats — Active Intelligence Feed">
      {/* Table header */}
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

      {THREATS.map((t, i) => (
        <div
          key={t.id}
          className="grid font-mono text-[11px] text-black py-0.5 items-center"
          style={{
            gridTemplateColumns: "40px 1fr 70px 70px 80px 100px",
            borderBottom: i < THREATS.length - 1 ? "1px solid #d0d0d0" : "none",
            background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.04)",
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

/** Personalised recommendations */
function Recommendations() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Section title="Personalized Recommendations — Prioritized Action Items">
      <div className="flex flex-col gap-2">
        {RECOMMENDATIONS.map((rec) => {
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
              {/* Collapsed header — always visible */}
              <button
                onClick={() => setExpanded(isOpen ? null : rec.id)}
                className="flex items-center gap-2 px-2 py-1.5 text-left w-full font-mono text-[11px] text-black hover:bg-[#d8d8d8] focus:outline-none"
              >
                {/* Priority badge */}
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
                {/* Effort badge */}
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

              {/* Expanded body */}
              {isOpen && (
                <div className="px-3 pb-2 pt-1 font-mono text-[11px] text-black leading-snug border-t border-[#b0b0b0]">
                  [{rec.id}] {rec.body}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/** 30-day score trend bar chart */
function TrendChart() {
  const max = Math.max(...TREND_DATA);
  const min = Math.min(...TREND_DATA);

  return (
    <Section title="Security Score Trend — Last 30 Days">
      <div className="flex flex-col gap-2">
        {/* Y-axis labels + bars */}
        <div className="flex items-end gap-0.5" style={{ height: "120px" }}>
          {/* Y-axis */}
          <div className="flex flex-col justify-between h-full mr-1 shrink-0">
            {[100, 75, 50, 25, 0].map((n) => (
              <span key={n} className="font-mono text-[8px] text-[#808080] leading-none">
                {n}
              </span>
            ))}
          </div>

          {/* Bars */}
          {TREND_DATA.map((val, i) => {
            const isToday = i === TREND_DATA.length - 1;
            const heightPct = (val / 100) * 100;
            const col = scoreColor(val);
            return (
              <div
                key={i}
                className="flex-1 flex flex-col justify-end relative group"
                style={{ height: "100%" }}
                title={`Day ${i + 1}: ${val}`}
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

        {/* X-axis labels */}
        <div className="flex justify-between font-mono text-[8px] text-[#808080]">
          <span>30d ago</span>
          <span>15d ago</span>
          <span>Today ({OVERALL_SCORE})</span>
        </div>

        {/* Legend */}
        <div className="flex gap-4 font-mono text-[10px] text-black pt-1 border-t border-[#b0b0b0]">
          <span>
            MIN:{" "}
            <span style={{ color: scoreColor(min) }} className="font-bold">
              {min}
            </span>
          </span>
          <span>
            MAX:{" "}
            <span style={{ color: scoreColor(max) }} className="font-bold">
              {max}
            </span>
          </span>
          <span>
            ΔPERIOD:{" "}
            <span style={{ color: TREND_DATA[29] > TREND_DATA[0] ? "#008800" : "#cc0000" }} className="font-bold">
              {TREND_DATA[29] > TREND_DATA[0] ? "+" : ""}
              {TREND_DATA[29] - TREND_DATA[0]} pts
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

// ─── Page root ────────────────────────────────────────────────────────────────

export default function PosturePage() {
  return (
    <div
      className="flex flex-col overflow-y-auto"
      style={{
        fontFamily: "'Courier New', Courier, monospace",
        background: "#c0c0c0",
        // Custom scrollbar to match Win95 aesthetic
      }}
    >
      {/* Toolbar row */}
      <div
        className="flex items-center gap-2 px-2 py-1.5 shrink-0"
        style={{ borderBottom: "2px solid #808080", background: "#c0c0c0" }}
      >
        <W95Button className="!text-[10px]">🖨 Print Report</W95Button>
        <W95Button className="!text-[10px]">💾 Export CSV</W95Button>
        <W95Button className="!text-[10px]">📧 Email Summary</W95Button>
        <div className="w-px h-4 bg-[#808080] mx-1" />
        <W95Button className="!text-[10px]">🔄 Refresh</W95Button>
        <div className="flex-1" />
        <span className="font-mono text-[10px] text-[#444]">
          Report period: 17 Apr 2025 – 17 May 2025 &nbsp;|&nbsp; Business: CIB Egypt E-Commerce
        </span>
      </div>

      {/* Page body — stacked sections with padding */}
      <div className="flex flex-col gap-3 p-3">
        {/* Row 1: Score header (full width) */}
        <SecurityScoreHeader />

        {/* Row 2: Risk breakdown (full width, 5-col grid inside) */}
        <RiskBreakdown />

        {/* Row 3: Insights + Trend side by side */}
        <div className="grid grid-cols-2 gap-3">
          <KeyInsights />
          <TrendChart />
        </div>

        {/* Row 4: Threats (full width) */}
        <TopThreats />

        {/* Row 5: Recommendations (full width, expandable) */}
        <Recommendations />

        {/* Footer note */}
        <div
          className="font-mono text-[9px] text-[#555] text-center pb-1"
          style={{ borderTop: "1px solid #b0b0b0", paddingTop: "6px" }}
        >
          AEGIS RADAR v2.1 — AI-Powered Fraud Detection &nbsp;|&nbsp; Data refreshed every 15 min
          &nbsp;|&nbsp; © 2025 AEGIS Systems, Cairo EG &nbsp;|&nbsp; All risk scores are indicative
        </div>
      </div>

      {/* Scrollbar styling */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          table, table * { visibility: visible; }
          table { position: absolute; top: 0; left: 0; width: 100%; }
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