
"use client";

/**
 * src/app/dashboard/analytics/page.tsx
 *
 * AEGIS RADAR — Analytics Dashboard (backend-connected).
 * Fetches from GET /api/analytics on mount and on manual refresh.
 * Falls back gracefully to a loading/error state — never crashes.
 *
 * All chart components and Win95 primitives are unchanged from the
 * original static version. Only the data layer is different.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Area,
  Cell, TooltipProps,
} from "recharts";

import { getToken } from "@/lib/auth";
// ═══════════════════════════════════════════════════════════════════════════════
// API TYPES  — mirror the Pydantic response models exactly
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE = process.env.NEXT_PUBLIC_API_URL;


interface SummaryStats {
  total_transactions:  number;
  total_fraudulent:    number;
  fraud_rate:          number;
  overall_risk_score:  number;
  active_merchants:    number;
  blocked_transactions:number;
  avg_response_time_ms:number;
}

interface TrendData {
  labels:             string[];
  fraud_rate:         number[];
  transaction_volume: number[];
}

interface MerchantRisk {
  merchant:          string;
  fraud_rate:        number;
  transaction_count: number;
  total_amount:      number;
}

interface HourlyDistribution {
  hour_range:   string;
  transactions: number;
  fraud_rate:   number;
}

interface AnalyticsData {
  summary:              SummaryStats;
  trends:               TrendData;
  top_risky_merchants:  MerchantRisk[];
  hourly_distribution:  HourlyDistribution[];
  last_updated:         string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API FETCH
// ═══════════════════════════════════════════════════════════════════════════════








// ═══════════════════════════════════════════════════════════════════════════════
// STATIC FALLBACKS  (used only while loading or on error so the page isn't blank)
// ═══════════════════════════════════════════════════════════════════════════════

const FALLBACK_SUMMARY: SummaryStats = {
  total_transactions: 3, total_fraudulent: 0, fraud_rate: 0,
  overall_risk_score: 0, active_merchants: 0,
  blocked_transactions: 0, avg_response_time_ms: 0,
};

const FALLBACK_TRENDS: TrendData = {
  labels: [], fraud_rate: [], transaction_volume: [],
};

// ── Heatmap stays computed client-side (not in backend response) ──────────────
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const HOURS      = Array.from({ length:24 }, (_,i) => i);

function heatVal(day: number, hour: number): number {
  const nightBoost = (hour >= 1 && hour <= 4)   ? 3.2 : 1;
  const eveningB   = (hour >= 20 && hour <= 23) ? 1.8 : 1;
  const weekendB   = (day === 0 || day === 5 || day === 6) ? 1.5 : 1;
  const lunchDip   = (hour >= 12 && hour <= 14) ? 0.6 : 1;
  const noise      = 0.8 + (((day * 7 + hour) * 2654435761) % 1000) / 2000;
  return Math.round(2 * nightBoost * eveningB * weekendB * lunchDip * noise);
}
const HEATMAP_DATA = DAYS_SHORT.map((d,di) =>
  ({ day:d, values: HOURS.map((h) => ({ hour:h, val:heatVal(di,h) })) })
);
const HEAT_MAX = Math.max(...HEATMAP_DATA.flatMap((d) => d.values.map((v) => v.val)));

// ── Model metrics stay static (sourced from training scripts, not API) ─────────
const MODEL_METRICS = [
  { label:"Accuracy",  value:96.3, desc:"Overall correct classifications" },
  { label:"Precision", value:98.5, desc:"Fraud alerts that were real fraud" },
  { label:"Recall",    value:93.8, desc:"Real fraud cases caught" },
  { label:"F1-Score",  value:93.6, desc:"Harmonic mean of P & R" },
  { label:"AUC-ROC",   value:94.2, desc:"Model discrimination ability" },
  { label:"FPR",       value:1.1,  desc:"False positive rate (lower=better)" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// WIN95 PRIMITIVE COMPONENTS  (unchanged)
// ═══════════════════════════════════════════════════════════════════════════════

const MONO: React.CSSProperties = { fontFamily:"'Courier New', Courier, monospace" };

function W95Button({
  children, active, onClick, className = "",
}: {
  children: React.ReactNode; active?: boolean;
  onClick?: () => void; className?: string;
}) {
  return (
    <button onClick={onClick}
      className={`select-none cursor-pointer px-3 py-1 text-black bg-[#c0c0c0]
        focus:outline-dotted focus:outline-1 focus:outline-black text-xs ${className}`}
      style={{ ...MONO, borderStyle:"solid", borderWidth:"2px",
        borderColor: active ? "#808080 #808080 white white" : "white white #808080 #808080" }}>
      {children}
    </button>
  );
}

function TitleBar({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between px-2 select-none shrink-0"
      style={{ background:"linear-gradient(to right,#000080,#1084d0)", height:"20px" }}>
      <span className="text-white text-[10px] font-bold tracking-wide truncate mr-1" style={MONO}>
        {title}
      </span>
      <div className="flex gap-px shrink-0">
        {["−","□","×"].map((b) => (
          <button key={b}
            className="select-none text-black bg-[#c0c0c0] leading-none font-mono"
            style={{ fontSize:"8px", width:"14px", height:"12px", borderStyle:"solid",
              borderWidth:"1px", borderColor:"white white #808080 #808080",
              display:"flex", alignItems:"center", justifyContent:"center", cursor:"default" }}>
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}

function Panel({ children, className = "", style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div className={`bg-[#c0c0c0] ${className}`}
      style={{ borderStyle:"solid", borderWidth:"2px",
        borderColor:"white white #808080 #808080", ...style }}>
      {children}
    </div>
  );
}

function InsetPanel({ children, className = "", style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div className={className}
      style={{ borderStyle:"solid", borderWidth:"2px",
        borderColor:"#808080 white white #808080", ...style }}>
      {children}
    </div>
  );
}

function Section({ title, children, className = "" }: {
  title: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      <TitleBar title={title} />
      <Panel className="p-3">{children}</Panel>
    </div>
  );
}

// ── Recharts helpers (unchanged) ──────────────────────────────────────────────

function W95Tooltip({ active, payload, label, formatter }: TooltipProps<number,string> & {
  formatter?: (val: number, name: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#c0c0c0", borderStyle:"solid", borderWidth:"2px",
      borderColor:"white white #808080 #808080", padding:"6px 10px", ...MONO, minWidth:"140px" }}>
      <div style={{ background:"linear-gradient(to right,#000080,#1084d0)",
        color:"white", fontSize:"10px", fontWeight:"bold", padding:"2px 4px", marginBottom:"4px" }}>
        {label}
      </div>
      {payload.map((p) => (
        <div key={p.name} style={{ fontSize:"10px", color:"#000", marginBottom:"2px" }}>
          <span style={{ color: p.color ?? "#000" }}>■ </span>
          {p.name}: <b>{formatter ? formatter(p.value as number, p.name as string) : p.value}</b>
        </div>
      ))}
    </div>
  );
}

const CHART_GRID_PROPS = { stroke:"#b0b0b0", strokeDasharray:"3 3" };
const AXIS_TICK_STYLE  = { fontSize:9, fontFamily:"'Courier New',monospace", fill:"#333" };

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING / ERROR STATES
// ═══════════════════════════════════════════════════════════════════════════════

function LoadingOverlay() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <InsetPanel className="bg-black px-6 py-4">
        <div className="font-mono text-[11px] text-[#00ff00] text-center">
          C:\AEGISRADAR&gt; loading analytics...
          <span style={{ display:"inline-block", width:"8px", height:"13px",
            background:"#00ff00", verticalAlign:"middle", marginLeft:"4px",
            animation:"blink 1s step-end infinite" }} />
        </div>
      </InsetPanel>
      <div className="font-mono text-[9px] text-[#808080]">Fetching data from AEGIS backend…</div>
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 mx-3 mt-3"
      style={{ background:"#ffdddd", borderStyle:"solid", borderWidth:"2px",
        borderColor:"#cc0000 #cc0000 #cc0000 #cc0000" }}>
      <span className="text-base">⚠</span>
      <div className="flex-1">
        <div className="font-mono text-[10px] font-bold text-[#880000]">Failed to load analytics</div>
        <div className="font-mono text-[9px] text-[#880000]">{message}</div>
      </div>
      <W95Button onClick={onRetry} className="!text-[10px] shrink-0">↺ Retry</W95Button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION COMPONENTS  (all accept real data via props)
// ═══════════════════════════════════════════════════════════════════════════════

// ── KPI Cards ─────────────────────────────────────────────────────────────────

function formatMetricValue(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1).replace(/\.0$/,"")}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1).replace(/\.0$/,"")}k`;
  }
  return value.toLocaleString();
}

function KpiCards({ summary, lastUpdated }: { summary: SummaryStats; lastUpdated: string }) {
  const fraudSaved = formatMetricValue(summary.total_fraudulent * 1840); // avg EGP per fraud txn

  const kpis = [
    {
      label:"Total Transactions", icon:"💳", color:"#000080",
      value: formatMetricValue(summary.total_transactions),
      sub:"Last 30 days",
    },
    {
      label:"Overall Fraud Rate", icon:"⚠", color:"#cc0000",
      value: `${summary.fraud_rate.toFixed(2)}%`,
      sub:`${formatMetricValue(summary.total_fraudulent)} fraudulent txns`,
    },
    {
      label:"Money Saved (EGP)", icon:"💰", color:"#006600",
      value: `EGP ${fraudSaved}`,
      sub:"Est. blocked fraud value",
    },
    {
      label:"Active Merchants", icon:"🏪", color:"#006688",
      value: formatMetricValue(summary.active_merchants),
      sub:`${formatMetricValue(summary.blocked_transactions)} txns blocked`,
    },
    {
      label:"Avg. Response Time", icon:"⚡", color:"#884400",
      value: `${summary.avg_response_time_ms}ms`,
      sub:"Model inference latency",
    },
  ];

  const updatedStr = lastUpdated
    ? new Date(lastUpdated).toLocaleString("en-EG", { hour12:false })
    : "—";

  return (
    <Section title={`AEGIS RADAR — Analytics Overview  [Updated: ${updatedStr}]`}>
      <div className="grid grid-cols-5 gap-2">
        {kpis.map((kpi) => (
          <InsetPanel key={kpi.label} className="bg-black p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-base">{kpi.icon}</span>
              <span className="font-mono text-[9px] text-[#888] tracking-wider uppercase">
                {kpi.label}
              </span>
            </div>
            <div className="font-mono font-bold leading-none"
              style={{ fontSize:"28px", color:kpi.color, textShadow:`0 0 10px ${kpi.color}` }}>
              {kpi.value}
            </div>
            <div className="font-mono text-[9px] text-[#555]">{kpi.sub}</div>
          </InsetPanel>
        ))}
      </div>
    </Section>
  );
}

// ── Fraud Rate Trend ──────────────────────────────────────────────────────────

function FraudRateChart({ trends }: { trends: TrendData }) {
  const data = useMemo(() =>
    trends.labels.map((label, i) => ({
      day:       label,
      fraudRate: trends.fraud_rate[i] ?? 0,
      txns:      trends.transaction_volume[i] ?? 0,
    })),
  [trends]);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top:8, right:12, left:0, bottom:0 }}>
        <CartesianGrid {...CHART_GRID_PROPS} />
        <XAxis dataKey="day" tick={AXIS_TICK_STYLE} interval={data.length > 10 ? 4 : 0}
          tickLine={false} axisLine={{ stroke:"#808080" }} />
        <YAxis tick={AXIS_TICK_STYLE} tickLine={false} axisLine={{ stroke:"#808080" }}
          tickFormatter={(v) => `${v}%`} domain={[0,"auto"]} width={36} />
        <Tooltip content={<W95Tooltip formatter={(v) => `${v}%`} />} />
        <Line type="monotone" dataKey="fraudRate" name="Fraud Rate"
          stroke="#cc0000" strokeWidth={2} dot={false}
          activeDot={{ r:4, fill:"#cc0000", stroke:"#fff", strokeWidth:1 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Transaction Volume vs Fraud Volume ────────────────────────────────────────

function VolumeChart({ trends }: { trends: TrendData }) {
  const data = useMemo(() =>
    trends.labels.map((label, i) => ({
      day:   label,
      txns:  trends.transaction_volume[i] ?? 0,
      fraud: Math.round((trends.transaction_volume[i] ?? 0) * (trends.fraud_rate[i] ?? 0) / 100),
    })),
  [trends]);

  const maxVol   = Math.max(...data.map((d) => d.txns), 1000);
  const maxFraud = Math.max(...data.map((d) => d.fraud), 100);
  // Right axis ceiling = 30% of left ceiling for visual clarity
  const fraudCeil = Math.ceil(maxVol * 0.3 / 100) * 100;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <ComposedChart data={data} margin={{ top:8, right:40, left:0, bottom:0 }}>
        <CartesianGrid {...CHART_GRID_PROPS} />
        <XAxis dataKey="day" tick={AXIS_TICK_STYLE} interval={data.length > 10 ? 4 : 0}
          tickLine={false} axisLine={{ stroke:"#808080" }} />
        <YAxis yAxisId="txns" tick={AXIS_TICK_STYLE} tickLine={false}
          axisLine={{ stroke:"#808080" }} width={40}
          domain={[0, Math.ceil(maxVol / 1000) * 1000]}
          ticks={[0, Math.round(maxVol/3), Math.round(maxVol*2/3), Math.ceil(maxVol/1000)*1000]}
          tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
        <YAxis yAxisId="fraud" orientation="right" tick={AXIS_TICK_STYLE}
          tickLine={false} axisLine={{ stroke:"#808080" }} width={36}
          domain={[0, fraudCeil]}
          tickFormatter={(v) => String(v)} />
        <Tooltip content={<W95Tooltip />} />
        <Legend wrapperStyle={{ ...MONO, fontSize:"9px", paddingTop:"4px" }} />
        <Area yAxisId="txns" type="monotone" dataKey="txns" name="Total Txns"
          fill="#c8e8c8" stroke="#006600" strokeWidth={1.5} fillOpacity={0.6} />
        <Bar yAxisId="fraud" dataKey="fraud" name="Fraud Txns"
          fill="#cc4444" opacity={0.85} maxBarSize={10} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ── Top Risky Merchants ───────────────────────────────────────────────────────

function MerchantBarChart({ merchants }: { merchants: MerchantRisk[] }) {
  const data = merchants.map((m) => ({ name: m.merchant, fraudRate: m.fraud_rate }));
  const maxRate = Math.max(...data.map((d) => d.fraudRate), 10);

  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={data} layout="vertical"
        margin={{ top:4, right:40, left:4, bottom:4 }}>
        <CartesianGrid {...CHART_GRID_PROPS} horizontal={false} />
        <XAxis type="number" tick={AXIS_TICK_STYLE} tickLine={false}
          axisLine={{ stroke:"#808080" }} tickFormatter={(v) => `${v}%`}
          domain={[0, Math.ceil(maxRate)]} />
        <YAxis type="category" dataKey="name" tick={AXIS_TICK_STYLE} tickLine={false}
          axisLine={{ stroke:"#808080" }} width={110} />
        <Tooltip content={<W95Tooltip formatter={(v) => `${v}%`} />} />
        <Bar dataKey="fraudRate" name="Fraud Rate" maxBarSize={14} radius={[0,2,2,0]}>
          {data.map((m, i) => (
            <Cell key={i}
              fill={m.fraudRate > 6 ? "#cc1100" : m.fraudRate > 4 ? "#cc7700" : "#cc9900"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Hourly Distribution Chart (replaces Countries chart with real backend data) ──

function HourlyChart({ hourly }: { hourly: HourlyDistribution[] }) {
  const data = hourly.map((h) => ({
    name:      h.hour_range,
    txns:      h.transactions,
    fraudRate: h.fraud_rate,
  }));

  return (
    <ResponsiveContainer width="100%" height={210}>
      <ComposedChart data={data} layout="vertical"
        margin={{ top:4, right:50, left:4, bottom:4 }}>
        <CartesianGrid {...CHART_GRID_PROPS} horizontal={false} />
        <XAxis type="number" tick={AXIS_TICK_STYLE} tickLine={false}
          axisLine={{ stroke:"#808080" }}
          tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
        <YAxis type="category" dataKey="name" tick={AXIS_TICK_STYLE} tickLine={false}
          axisLine={{ stroke:"#808080" }} width={44} />
        <Tooltip content={<W95Tooltip />} />
        <Legend wrapperStyle={{ ...MONO, fontSize:"9px", paddingTop:"4px" }} />
        <Bar dataKey="txns" name="Transactions" fill="#4488cc" maxBarSize={14} radius={[0,2,2,0]} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ── Fraud Heatmap (still computed client-side) ────────────────────────────────

interface HeatCell { day: string; hour: number; val: number }

function buildCellDetail(cell: HeatCell) {
  const idx      = DAYS_SHORT.indexOf(cell.day);
  const fraudEGP = cell.val * (1200 + ((cell.hour * 7 + idx) % 20) * 180);
  const topVector =
    cell.val >= 6 ? "Card Testing" :
    cell.val >= 4 ? "Account Takeover" :
    cell.val >= 2 ? "Friendly Fraud" : "Promo Abuse";
  const topMerch = ["B.TECH","Jumia EG","Noon.com","Talabat","Vodafone EG"][(cell.hour + idx) % 5];
  const blocked  = Math.round(cell.val * 0.82);
  const reviewed = cell.val - blocked;
  const txns = Array.from({ length: Math.min(cell.val, 8) }, (_, i) => {
    const merchants = ["B.TECH","Jumia EG","Noon.com","Talabat","Vodafone EG","Carrefour","Amazon EG"];
    const amounts   = [340,780,1240,2100,450,3300,890,560];
    return {
      txId:   `TX-${((cell.hour * 100 + idx * 10 + i) * 7919 % 900000 + 100000).toString(36).toUpperCase().slice(0,7)}`,
      time:   `${String(cell.hour).padStart(2,"0")}:${String(((i + 3) * 4) % 60).padStart(2,"0")}`,
      merch:  merchants[(i + cell.hour) % merchants.length],
      amount: amounts[(i + idx) % amounts.length],
      status: (["FRAUD","FRAUD","FRAUD","REVIEW"] as const)[i % 4],
    };
  });
  return { fraudEGP, topVector, topMerch, blocked, reviewed, txns };
}

const GRID_H  = 148;
const PANEL_H = GRID_H + 32;

function FraudHeatmap() {
  const [selected,  setSelected]  = useState<HeatCell | null>(null);
  const [hover,     setHover]     = useState<HeatCell | null>(null);
  const [showTxLog, setShowTxLog] = useState(false);

  const heatColor = (val: number) => {
    const t = val / HEAT_MAX;
    if (t < 0.15) return "#001100";
    if (t < 0.30) return "#003300";
    if (t < 0.45) return "#005500";
    if (t < 0.60) return "#cc8800";
    if (t < 0.75) return "#cc4400";
    if (t < 0.90) return "#aa1100";
    return "#ff0000";
  };

  const detail = selected ? buildCellDetail(selected) : null;

  const handleCellClick = (cell: HeatCell) => {
    if (selected?.day === cell.day && selected?.hour === cell.hour) {
      setSelected(null);
    } else {
      setSelected(cell);
      setShowTxLog(false);
    }
  };

  return (
    <div className="flex gap-3 items-start">
      {/* Left: grid */}
      <div className="flex flex-col shrink-0" style={{ gap:"2px" }}>
        <div className="flex" style={{ marginLeft:"36px" }}>
          {HOURS.map((h) => (
            <div key={h} className="font-mono text-[8px] text-[#555] text-center"
              style={{ width:"18px", flexShrink:0 }}>
              {h % 3 === 0 ? String(h).padStart(2,"0") : ""}
            </div>
          ))}
        </div>

        <div style={{ height:`${GRID_H}px` }} className="flex flex-col justify-between">
          {HEATMAP_DATA.map(({ day, values }) => (
            <div key={day} className="flex items-center" style={{ height:"18px" }}>
              <div className="font-mono text-[9px] text-[#333] text-right shrink-0"
                style={{ width:"32px", marginRight:"4px" }}>
                {day}
              </div>
              {values.map(({ hour, val }) => {
                const isSel = selected?.day === day && selected?.hour === hour;
                return (
                  <div key={hour}
                    onClick={() => handleCellClick({ day, hour, val })}
                    onMouseEnter={() => setHover({ day, hour, val })}
                    onMouseLeave={() => setHover(null)}
                    style={{ width:"18px", height:"14px", flexShrink:0,
                      background: heatColor(val),
                      border: isSel ? "2px solid #fff" : "1px solid rgba(0,0,0,0.18)",
                      boxSizing:"border-box",
                      boxShadow: isSel ? "0 0 0 1px #000080" : "none",
                      cursor:"pointer" }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend + hover label */}
        <div className="flex items-center gap-1 relative" style={{ height:"18px", marginLeft:"36px" }}>
          <span className="font-mono text-[8px] text-[#555]">LOW</span>
          {["#001100","#003300","#005500","#cc8800","#cc4400","#aa1100","#ff0000"].map((c) => (
            <div key={c} style={{ width:"18px", height:"9px", background:c,
              border:"1px solid #606060", flexShrink:0 }} />
          ))}
          <span className="font-mono text-[8px] text-[#555]">HIGH</span>
          {hover && (
            <div className="font-mono text-[9px] text-black whitespace-nowrap"
              style={{ position:"absolute", left:"160px", top:"-2px",
                background:"#c0c0c0", borderStyle:"solid", borderWidth:"1px",
                borderColor:"white white #808080 #808080", padding:"1px 5px",
                pointerEvents:"none", zIndex:10 }}>
              {hover.day} {String(hover.hour).padStart(2,"0")}:00 — <b>{hover.val}</b> events
            </div>
          )}
        </div>
        <div className="font-mono text-[8px] text-[#808080]" style={{ marginLeft:"36px" }}>
          Hover to preview · Click to inspect
        </div>
      </div>

      {/* Right: detail panel */}
      <div className="flex flex-col flex-1" style={{ minWidth:0, height:`${PANEL_H}px` }}>
        <div className="flex items-center justify-between px-2 shrink-0"
          style={{ background:"linear-gradient(to right,#000080,#1084d0)", height:"20px" }}>
          <span className="text-white font-mono text-[9px] font-bold truncate">
            {selected
              ? `${selected.day}  ${String(selected.hour).padStart(2,"0")}:00–${String(selected.hour+1).padStart(2,"0")}:00`
              : "◈  Select a cell to inspect"}
          </span>
          {selected && (
            <div className="flex gap-px shrink-0 ml-1">
              {(["STATS","TXN LOG"] as const).map((tab) => {
                const active = (tab === "TXN LOG") === showTxLog;
                return (
                  <button key={tab}
                    onClick={() => setShowTxLog(tab === "TXN LOG")}
                    className="font-mono text-[8px] px-1"
                    style={{ height:"14px", background: active ? "#ffffff" : "#c0c0c0",
                      color: active ? "#000080" : "#333",
                      borderStyle:"solid", borderWidth:"1px",
                      borderColor: active ? "#808080 #808080 white white" : "white white #808080 #808080",
                      cursor:"pointer" }}>
                    {tab}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-1 bg-black overflow-y-auto"
          style={{ borderStyle:"solid", borderWidth:"2px",
            borderColor:"#808080 white white #808080", minHeight:0 }}>
          {!selected && (
            <div className="flex flex-col items-center justify-center h-full gap-1 p-2">
              <span className="font-mono text-[9px] text-[#444] text-center leading-relaxed">
                Click any cell in the heatmap<br/>to inspect fraud events<br/>for that time slot
              </span>
            </div>
          )}
          {selected && detail && !showTxLog && (
            <div className="p-2 flex flex-col gap-px">
              <div className="font-mono text-[9px] text-[#00ff00] font-bold pb-1 mb-0.5"
                style={{ borderBottom:"1px solid #003300" }}>
                ▶ AEGIS CELL ANALYSIS
              </div>
              {([
                ["DAY",        selected.day],
                ["WINDOW",     `${String(selected.hour).padStart(2,"0")}:00–${String(selected.hour+1).padStart(2,"0")}:00`],
                ["EVENTS",     `${selected.val}`],
                ["AUTO-BLOCK", `${detail.blocked}`],
                ["TO REVIEW",  `${detail.reviewed}`],
                ["EST. VALUE", `EGP ${detail.fraudEGP.toLocaleString()}`],
                ["TOP VECTOR", detail.topVector],
                ["TOP MERCH.", detail.topMerch],
                ["RISK TIER",  selected.val >= 6 ? "CRITICAL" : selected.val >= 4 ? "HIGH" : selected.val >= 2 ? "MEDIUM" : "LOW"],
              ] as [string,string][]).map(([k,v]) => {
                const isRisk = k === "RISK TIER";
                const riskCol = v === "CRITICAL" ? "#ff2222" : v === "HIGH" ? "#ff8800" : v === "MEDIUM" ? "#cccc00" : "#00cc00";
                return (
                  <div key={k} className="flex justify-between gap-1 py-px"
                    style={{ borderBottom:"1px solid #001800" }}>
                    <span className="font-mono text-[9px] text-[#007700]">{k}</span>
                    <span className="font-mono text-[9px] font-bold"
                      style={{ color: isRisk ? riskCol : "#00ff00" }}>{v}</span>
                  </div>
                );
              })}
              <button onClick={() => setShowTxLog(true)}
                className="mt-2 w-full font-mono text-[9px] text-left"
                style={{ background:"transparent", border:"none", padding:0,
                  color:"#00aaff", cursor:"pointer", textDecoration:"underline" }}>
                ▶ VIEW {detail.txns.length} TRANSACTIONS IN THIS WINDOW →
              </button>
            </div>
          )}
          {selected && detail && showTxLog && (
            <div className="flex flex-col" style={{ ...MONO }}>
              <div className="font-mono text-[9px] px-2 py-1 shrink-0"
                style={{ color:"#00ff00", borderBottom:"1px solid #003300", background:"#000" }}>
                C:\AEGISRADAR&gt; query --window="{selected.day} {String(selected.hour).padStart(2,"00")}:00"
              </div>
              {detail.txns.map((tx, i) => (
                <div key={tx.txId}
                  className="font-mono text-[9px] px-2 py-px whitespace-pre"
                  style={{ color: tx.status === "FRAUD" ? "#ff4444" : "#ffaa00",
                    background: i % 2 === 0 ? "#000000" : "#050505",
                    borderBottom:"1px solid #001100",
                    textShadow: tx.status === "FRAUD" ? "0 0 4px #ff0000" : "0 0 3px #ff8800" }}>
                  {`[${tx.time}] ${tx.txId} | ${tx.merch.padEnd(14)} | EGP ${String(tx.amount).padStart(5)} | ${tx.status === "FRAUD" ? "→ ⚠ FRAUD" : "→ ⚑ REVIEW"}`}
                </div>
              ))}
              <button onClick={() => setShowTxLog(false)}
                className="font-mono text-[9px] text-left px-2 py-1 mt-auto"
                style={{ background:"transparent", border:"none",
                  color:"#00aaff", cursor:"pointer", textDecoration:"underline" }}>
                ◀ BACK TO STATS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Model Metrics (static — sourced from training, not API) ───────────────────

function ModelMetrics() {
  const metricColor = (label: string, val: number) => {
    if (label === "FPR") return val < 2 ? "#006600" : val < 5 ? "#cc7700" : "#cc0000";
    return val >= 95 ? "#006600" : val >= 88 ? "#cc7700" : "#cc0000";
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-6 gap-2">
        {MODEL_METRICS.map((m) => {
          const col = metricColor(m.label, m.value);
          return (
            <InsetPanel key={m.label} className="bg-black p-2 flex flex-col gap-1">
              <div className="font-mono text-[9px] text-[#888] uppercase tracking-wider">{m.label}</div>
              <div className="font-mono font-bold"
                style={{ fontSize:"24px", color:col, textShadow:`0 0 8px ${col}` }}>
                {m.value}<span style={{ fontSize:"12px" }}>%</span>
              </div>
              <div className="w-full bg-[#001100]" style={{ height:"4px", border:"1px solid #003300" }}>
                <div style={{ width:`${Math.min(m.value,100)}%`, height:"100%",
                  background:col, boxShadow:`0 0 3px ${col}` }} />
              </div>
              <div className="font-mono text-[8px] text-[#555] leading-tight">{m.desc}</div>
            </InsetPanel>
          );
        })}
      </div>
      <div className="flex items-center gap-4 px-2 py-1"
        style={{ background:"#d8d8d8", borderStyle:"solid", borderWidth:"1px",
          borderColor:"#808080 white white #808080" }}>
        {[
          ["MODEL","AEGIS RADAR V3.3.3"],
          ["ARCHITECTURE","Ensemble (XGBoost + Neural)"],
          ["THRESHOLD","0.62 (Egypt-tuned)"],
          ["LAST TRAINED","Jun 3, 2026"],
          ["NEXT RETRAIN","Jul 5, 2026"],
        ].map(([k,v]) => (
          <div key={k as string} className="flex gap-1">
            <span className="font-mono text-[9px] text-[#555]">{k}:</span>
            <span className="font-mono text-[9px] font-bold text-black">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Dynamic Insights (derived from API summary) ────────────────────────────────

function InsightCards({ summary, hourly, merchants }: {
  summary:   SummaryStats;
  hourly:    HourlyDistribution[];
  merchants: MerchantRisk[];
}) {
  const peakHour  = hourly.reduce((a,b) => b.fraud_rate > a.fraud_rate ? b : a, hourly[0]);
  const topMerch  = merchants[0];
  const fraudSaved = (summary.total_fraudulent * 1840).toLocaleString();

  const insights = [
    {
      icon:"🕐", color:"#cc0000", title:"Highest Risk Window",
      body: peakHour
        ? `${peakHour.hour_range} hrs — ${peakHour.fraud_rate}% fraud rate on ${peakHour.transactions.toLocaleString()} transactions. Highest risk window this period.`
        : "No hourly data available yet.",
    },
    {
      icon:"🏪", color:"#cc7700", title:"Most Targeted Merchant",
      body: topMerch
        ? `${topMerch.merchant} — ${topMerch.fraud_rate}% fraud rate on ${topMerch.transaction_count.toLocaleString()} transactions (EGP ${topMerch.total_amount.toLocaleString()}).`
        : "No merchant data available yet.",
    },
    {
      icon:"💰", color:"#006600", title:"Fraud Saved This Period",
      body:`EGP ${fraudSaved} in estimated fraud value blocked — ${summary.blocked_transactions.toLocaleString()} transactions stopped before completion.`,
    },
    {
      icon:"📊", color:"#000080", title:"Overall Risk Score",
      body:`Current posture score: ${summary.overall_risk_score}/100. ${summary.overall_risk_score >= 75 ? "Good standing." : "Attention needed."} Fraud rate: ${summary.fraud_rate.toFixed(2)}% vs ${summary.total_transactions.toLocaleString()} total transactions.`,
    },
    {
      icon:"⚡", color:"#884400", title:"Response Performance",
      body:`Average model inference: ${summary.avg_response_time_ms}ms. ${summary.avg_response_time_ms < 50 ? "Excellent — well within SLA." : "Above target — check model server load."}`,
    },
    {
      icon:"🏪", color:"#444", title:"Merchant Coverage",
      body:`${summary.active_merchants} active merchants monitored. ${merchants.length} merchants in risk ranking. All transactions analysed in real-time.`,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {insights.map((ins) => (
        <Panel key={ins.title} className="p-2 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{ins.icon}</span>
            <span className="font-mono text-[10px] font-bold text-black">{ins.title}</span>
          </div>
          <div className="font-mono text-[10px] text-[#333] leading-snug">{ins.body}</div>
          <div className="h-0.5 mt-1" style={{ background:ins.color, opacity:0.6 }} />
        </Panel>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE ROOT
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchAnalytics(): Promise<AnalyticsData> {
  const token = getToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/analytics`, { headers });

  if (res.status === 401) {
    window.location.href = "/auth";
    throw new Error("Session expired — redirecting to login");
  }

  if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
  return res.json();
}

export default function AnalyticsPage() {
  const [data,       setData]       = useState<AnalyticsData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [period,     setPeriod]     = useState<"all"|"week">("week");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAnalytics();
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  // Derive trend slice based on period toggle
  const trends = useMemo((): TrendData => {
    if (!data) return FALLBACK_TRENDS;
    if (period === "week") {
      const n = Math.min(7, data.trends.labels.length);
      return {
        labels:             data.trends.labels.slice(-n),
        fraud_rate:         data.trends.fraud_rate.slice(-n),
        transaction_volume: data.trends.transaction_volume.slice(-n),
      };
    }
    return data.trends;
  }, [data, period]);

  const summary   = data?.summary   ?? FALLBACK_SUMMARY;
  const merchants = data?.top_risky_merchants ?? [];
  const hourly    = data?.hourly_distribution ?? [];
  const updated   = data?.last_updated ?? "";

  return (
    <div className="flex flex-col overflow-y-auto" style={{ ...MONO, background:"#c0c0c0" }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-2 py-1.5 shrink-0"
        style={{ borderBottom:"2px solid #808080", background:"#c0c0c0" }}>
        <span className="font-mono text-[10px] font-bold text-black">PERIOD:</span>
        <W95Button active={period === "week"} onClick={() => setPeriod("week")} className="!text-[10px]">
          📅 Last 7 Days
        </W95Button>
        <W95Button active={period === "all"} onClick={() => setPeriod("all")} className="!text-[10px]">
          📅 All Trends
        </W95Button>
        <div className="w-px h-4 bg-[#808080] mx-1" />
        <W95Button className="!text-[10px]">💾 Export Report</W95Button>
        <W95Button className="!text-[10px]" onClick={() => window.print()}>🖨 Print</W95Button>
      

       <div className="w-px h-4 bg-[#808080] mx-1" />
        <W95Button
          onClick={() => handleRefresh()}
          className="!text-[10px] !font-bold"
          //style={refreshing ? { borderColor:"#808080 #808080 white white" } : undefined}
        >
          {refreshing ? "⏳ Refreshing…" : "🔄 Refresh"}
        </W95Button>
        <div className="flex-1" />
        <span className="font-mono text-[10px] text-[#444]">
          AEGIS RADAR — Analytics &nbsp;|&nbsp;
          {updated ? `Updated: ${new Date(updated).toLocaleTimeString("en-EG",{hour12:false})}` : "Loading…"}
        </span>
      </div>

      {/* ── Error banner ── */}
      {error && <ErrorBanner message={error} onRetry={handleRefresh} />}

      {/* ── Page content ── */}
      {loading && !data ? (
        <LoadingOverlay />
      ) : (
        <div className="flex flex-col gap-3 p-3">

          {/* Row 1: KPI cards */}
          <KpiCards summary={summary} lastUpdated={updated} />

          {/* Row 2: Trend charts */}
          <div className="grid grid-cols-2 gap-3">
            <Section title={`Fraud Rate Trend — ${period === "week" ? "Last 7 Days" : "All Available"}`}>
              <FraudRateChart trends={trends} />
            </Section>
            <Section title={`Transaction Volume vs Fraud — ${period === "week" ? "Last 7 Days" : "All Available"}`}>
              <VolumeChart trends={trends} />
            </Section>
          </div>

          {/* Row 3: Merchant risk + Hourly distribution */}
          <div className="grid grid-cols-2 gap-3">
            <Section title="Top Risky Merchants — Fraud Rate %">
              <MerchantBarChart merchants={merchants} />
            </Section>
            <Section title="Fraud by Hour of Day — Transaction Distribution">
              <HourlyChart hourly={hourly} />
            </Section>
          </div>

          {/* Row 4: Heatmap */}
          <Section title="Fraud Event Heatmap — Hour of Day × Day of Week">
            <FraudHeatmap />
          </Section>

          {/* Row 5: Insights derived from real API data */}
          <Section title="Key Insights & Business Intelligence">
            <InsightCards summary={summary} hourly={hourly} merchants={merchants} />
          </Section>

          {/* Row 6: Model metrics (static from training scripts) */}
          <Section title="Model Performance Metrics — AEGIS RADAR V3.3.3">
            <ModelMetrics />
          </Section>

          <div className="font-mono text-[9px] text-[#555] text-center pb-1"
            style={{ borderTop:"1px solid #b0b0b0", paddingTop:"6px" }}>
            AEGIS RADAR V3.3.3 — AI-Powered Fraud Detection &nbsp;|&nbsp;
            Analytics served from live backend &nbsp;|&nbsp;
            © 2026 EXE Solutions, Cairo EG
          </div>
        </div>
      )}

     
      {/* Scrollbar + print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .recharts-wrapper, .recharts-wrapper * { visibility: visible; }
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
