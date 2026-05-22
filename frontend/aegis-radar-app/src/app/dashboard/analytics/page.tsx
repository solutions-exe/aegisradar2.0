"use client";

/**
 * src/app/dashboard/analytics/page.tsx
 *
 * AEGIS RADAR — Analytics Dashboard.
 * High-level BI and fraud trend visualisations for decision makers.
 * Charts powered by Recharts. Consistent Win95 aesthetic with History/Posture pages.
 *
 * Sits inside layout.tsx (Win95 shell + sidebar). Fully self-contained.
 */

import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Area,
  Cell, TooltipProps,
} from "recharts";

// ═══════════════════════════════════════════════════════════════════════════════
// STATIC DATA  (realistic Egypt e-commerce context)
// ═══════════════════════════════════════════════════════════════════════════════

// ── 30-day daily trend ────────────────────────────────────────────────────────
const DAILY_TREND = [
  { day:"Apr 17", txns:1820, fraud:74,  vol:312400,  fraudVol:18200 },
  { day:"Apr 18", txns:1654, fraud:58,  vol:287600,  fraudVol:14900 },
  { day:"Apr 19", txns:2103, fraud:91,  vol:398700,  fraudVol:24400 },
  { day:"Apr 20", txns:1987, fraud:84,  vol:372100,  fraudVol:21800 },
  { day:"Apr 21", txns:2340, fraud:112, vol:441200,  fraudVol:31600 },
  { day:"Apr 22", txns:2198, fraud:99,  vol:408800,  fraudVol:27300 },
  { day:"Apr 23", txns:1762, fraud:67,  vol:318400,  fraudVol:17100 },
  { day:"Apr 24", txns:1903, fraud:72,  vol:354200,  fraudVol:19400 },
  { day:"Apr 25", txns:2054, fraud:80,  vol:387600,  fraudVol:22100 },
  { day:"Apr 26", txns:2287, fraud:104, vol:430100,  fraudVol:29800 },
  { day:"Apr 27", txns:2441, fraud:118, vol:459300,  fraudVol:34100 },
  { day:"Apr 28", txns:2312, fraud:107, vol:437800,  fraudVol:31200 },
  { day:"Apr 29", txns:1894, fraud:76,  vol:341700,  fraudVol:20300 },
  { day:"Apr 30", txns:1788, fraud:61,  vol:309400,  fraudVol:15800 },
  { day:"May 01", txns:2560, fraud:138, vol:492100,  fraudVol:41200 }, // Eid spike
  { day:"May 02", txns:2710, fraud:152, vol:521400,  fraudVol:46300 },
  { day:"May 03", txns:2634, fraud:144, vol:508900,  fraudVol:43700 },
  { day:"May 04", txns:2489, fraud:128, vol:478200,  fraudVol:38100 },
  { day:"May 05", txns:2301, fraud:109, vol:434600,  fraudVol:30700 },
  { day:"May 06", txns:2187, fraud:96,  vol:412300,  fraudVol:27400 },
  { day:"May 07", txns:2043, fraud:88,  vol:381200,  fraudVol:24900 },
  { day:"May 08", txns:1978, fraud:82,  vol:364700,  fraudVol:22800 },
  { day:"May 09", txns:2102, fraud:90,  vol:394800,  fraudVol:25600 },
  { day:"May 10", txns:2234, fraud:98,  vol:421900,  fraudVol:28100 },
  { day:"May 11", txns:2389, fraud:113, vol:453200,  fraudVol:33400 },
  { day:"May 12", txns:2445, fraud:119, vol:466800,  fraudVol:35200 },
  { day:"May 13", txns:2367, fraud:111, vol:449100,  fraudVol:32600 },
  { day:"May 14", txns:2201, fraud:97,  vol:418700,  fraudVol:27900 },
  { day:"May 15", txns:2109, fraud:91,  vol:401200,  fraudVol:25800 },
  { day:"May 16", txns:1980, fraud:79,  vol:376400,  fraudVol:21600 },
];

// ── Risk score distribution buckets ──────────────────────────────────────────
const RISK_DIST = [
  { bucket:"0–9",   count:4812, fill:"#006600" },
  { bucket:"10–19", count:3941, fill:"#008800" },
  { bucket:"20–29", count:3204, fill:"#00aa00" },
  { bucket:"30–39", count:2687, fill:"#44cc44" },
  { bucket:"40–49", count:2103, fill:"#aacc00" },
  { bucket:"50–59", count:1654, fill:"#ccaa00" },
  { bucket:"60–69", count:1187, fill:"#cc7700" },
  { bucket:"70–79", count:834,  fill:"#cc4400" },
  { bucket:"80–89", count:512,  fill:"#cc1100" },
  { bucket:"90–100",count:287,  fill:"#aa0000" },
];

// ── Top risky merchants ───────────────────────────────────────────────────────
const TOP_MERCHANTS = [
  { name:"B.TECH",          fraudRate:8.4, txns:1240, fraudEGP:94200  },
  { name:"Noon Electronics",fraudRate:7.1, txns:980,  fraudEGP:71800  },
  { name:"Jumia EG",        fraudRate:5.8, txns:3420, fraudEGP:58400  },
  { name:"Vodafone Recharge",fraudRate:5.2,txns:2100, fraudEGP:31200  },
  { name:"Talabat",         fraudRate:4.1, txns:4180, fraudEGP:28900  },
  { name:"Amazon Egypt",    fraudRate:3.7, txns:2860, fraudEGP:44100  },
  { name:"Carrefour Cairo", fraudRate:2.9, txns:1980, fraudEGP:19800  },
  { name:"WE Telecom",      fraudRate:2.4, txns:760,  fraudEGP:11400  },
];

// ── Top risky countries ───────────────────────────────────────────────────────
const TOP_COUNTRIES = [
  { name:"Nigeria",       fraudRate:41.2, txns:118  },
  { name:"Unknown/VPN",   fraudRate:28.7, txns:342  },
  { name:"Turkey",        fraudRate:12.4, txns:89   },
  { name:"Saudi Arabia",  fraudRate:4.8,  txns:1240 },
  { name:"UAE",           fraudRate:3.1,  txns:890  },
  { name:"Germany",       fraudRate:1.8,  txns:204  },
  { name:"Egypt",         fraudRate:2.9,  txns:58412},
];

// ── Heatmap: fraud count by [day-of-week][hour] ──────────────────────────────
const DAYS_SHORT    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const HOURS         = Array.from({ length:24 }, (_,i) => i);
// Realistic pattern: late night / early morning spike, mid-day normal, Fri/Sat elevated
function heatVal(day: number, hour: number): number {
  const base      = 2;
  const nightBoost= (hour >= 1 && hour <= 4)  ? 3.2 : 1;
  const eveningB  = (hour >= 20 && hour <= 23) ? 1.8 : 1;
  const weekendB  = (day === 0 || day === 5 || day === 6) ? 1.5 : 1;
  const lunchDip  = (hour >= 12 && hour <= 14) ? 0.6 : 1;
  const noise     = 0.8 + (((day * 7 + hour) * 2654435761) % 1000) / 2000;
  return Math.round(base * nightBoost * eveningB * weekendB * lunchDip * noise);
}
const HEATMAP_DATA = DAYS_SHORT.map((d,di) =>
  ({ day:d, values: HOURS.map((h) => ({ hour:h, val:heatVal(di,h) })) })
);
const HEAT_MAX = Math.max(...HEATMAP_DATA.flatMap((d) => d.values.map((v) => v.val)));

// ── Model metrics ────────────────────────────────────────────────────────────
const MODEL_METRICS = [
  { label:"Accuracy",  value:97.3, desc:"Overall correct classifications" },
  { label:"Precision", value:94.1, desc:"Fraud alerts that were real fraud" },
  { label:"Recall",    value:91.8, desc:"Real fraud cases caught" },
  { label:"F1-Score",  value:92.9, desc:"Harmonic mean of P & R" },
  { label:"AUC-ROC",   value:98.7, desc:"Model discrimination ability" },
  { label:"FPR",       value:1.1,  desc:"False positive rate (lower=better)" },
];

// ── KPI cards ────────────────────────────────────────────────────────────────
const KPIS = [
  { label:"Total Transactions",  value:"62,221",    sub:"Last 30 days",           icon:"💳", color:"#000080" },
  { label:"Overall Fraud Rate",  value:"4.07%",     sub:"↓ 0.31% vs last month",  icon:"⚠",  color:"#cc0000" },
  { label:"Money Saved (EGP)",   value:"831,400",   sub:"Blocked fraud value",     icon:"💰", color:"#006600" },
  { label:"Active Merchants",    value:"143",       sub:"+7 this month",           icon:"🏪", color:"#006688" },
  { label:"Avg. Response Time",  value:"38ms",      sub:"Model inference latency", icon:"⚡", color:"#884400" },
];

// ── Insight cards ────────────────────────────────────────────────────────────
const INSIGHTS = [
  { icon:"🕐", title:"Highest Risk Window",   body:"01:00–04:00 AM — 3.4× baseline fraud rate. Enforce 2-FA on all transactions during this window.", color:"#cc0000" },
  { icon:"🏪", title:"Most Targeted Merchant",body:"B.TECH Electronics — 8.4% fraud rate this month. Card-testing & chargeback fraud are primary vectors.", color:"#cc7700" },
  { icon:"💰", title:"Fraud Saved This Month",body:"EGP 831,400 in fraudulent transactions blocked (1,914 orders stopped before fulfillment).", color:"#006600" },
  { icon:"📱", title:"Device Breakdown",      body:"71% of fraud originates from Android mobile. iOS fraud share stable at 18%. Unknown devices: 11%.", color:"#000080" },
  { icon:"🌐", title:"Top Risk Country",      body:"Nigeria: 41.2% fraud rate on 118 transactions. Auto-block rule active. VPN traffic flagged at 28.7%.", color:"#880000" },
  { icon:"📅", title:"Peak Fraud Day",        body:"May 2 saw the highest single-day fraud volume (152 txns / EGP 46,300) coinciding with Eid campaigns.", color:"#884400" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// WIN95 PRIMITIVE COMPONENTS
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
      {/* Tiny window controls — kept small so titles are never clipped */}
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

// ═══════════════════════════════════════════════════════════════════════════════
// RECHARTS THEME HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Custom tooltip wrapper that looks like a Win95 popup */
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

const CHART_GRID_PROPS = {
  stroke: "#b0b0b0", strokeDasharray: "3 3",
};
const AXIS_TICK_STYLE = { fontSize:9, fontFamily:"'Courier New',monospace", fill:"#333" };

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── KPI Cards ─────────────────────────────────────────────────────────────────

function KpiCards() {
  return (
    <Section title="AEGIS RADAR — Analytics Overview  [CIB Egypt | May 2025]">
      <div className="grid grid-cols-5 gap-2">
        {KPIS.map((kpi) => (
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

function FraudRateChart({ period }: { period: "all"|"week" }) {
  const data = useMemo(() => {
    const slice = period === "week" ? DAILY_TREND.slice(-7) : DAILY_TREND;
    return slice.map((d) => ({
      ...d,
      fraudRate: parseFloat(((d.fraud / d.txns) * 100).toFixed(2)),
    }));
  }, [period]);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top:8, right:12, left:0, bottom:0 }}>
        <CartesianGrid {...CHART_GRID_PROPS} />
        <XAxis dataKey="day" tick={AXIS_TICK_STYLE} interval={period === "all" ? 4 : 0}
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
// Dual Y-axis: left 0–3 000 (total txns), right 0–900 (fraud txns).
// Visual logic: a fraud bar reaching the top = ~30% fraud rate, a severe alarm.
// Typical 4–7% fraud shows as a small-but-visible bar — declarative without panic.

function VolumeChart({ period }: { period: "all"|"week" }) {
  const data = period === "week" ? DAILY_TREND.slice(-7) : DAILY_TREND;
  return (
    <ResponsiveContainer width="100%" height={180}>
      <ComposedChart data={data} margin={{ top:8, right:40, left:0, bottom:0 }}>
        <CartesianGrid {...CHART_GRID_PROPS} />
        <XAxis dataKey="day" tick={AXIS_TICK_STYLE} interval={period === "all" ? 4 : 0}
          tickLine={false} axisLine={{ stroke:"#808080" }} />
        {/* Left axis: total transactions 0–3 000 */}
        <YAxis yAxisId="txns" tick={AXIS_TICK_STYLE} tickLine={true}
         axisLine={{ stroke:"#808080" }} width={40}
         domain={[0, 3000]} ticks={[0, 1000, 2000, 3000]}
         tickFormatter={(v: number) => String(v)} />
        {/* Right axis: fraud txns 0–900 (top = 30% of 3 000) */}
        <YAxis yAxisId="fraud" orientation="right" tick={AXIS_TICK_STYLE}
          tickLine={true} axisLine={{ stroke:"#808080" }} width={36}
          domain={[0, 900]} ticks={[0,300,600,900]} 
          tickFormatter={(v: number) => `${v}`} />
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

// ── Risk Score Distribution ───────────────────────────────────────────────────

function RiskDistChart() {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={RISK_DIST} margin={{ top:8, right:8, left:0, bottom:0 }}>
        <CartesianGrid {...CHART_GRID_PROPS} vertical={false} />
        <XAxis dataKey="bucket" tick={AXIS_TICK_STYLE} tickLine={false}
          axisLine={{ stroke:"#808080" }} />
        <YAxis tick={AXIS_TICK_STYLE} tickLine={false} axisLine={{ stroke:"#808080" }}
          width={40} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
        <Tooltip content={<W95Tooltip formatter={(v) => v.toLocaleString()} />} />
        <Bar dataKey="count" name="Transactions" radius={[1,1,0,0]}>
          {RISK_DIST.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Top Risky Merchants ───────────────────────────────────────────────────────

function MerchantBarChart() {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={TOP_MERCHANTS} layout="vertical"
        margin={{ top:4, right:40, left:4, bottom:4 }}>
        <CartesianGrid {...CHART_GRID_PROPS} horizontal={false} />
        <XAxis type="number" tick={AXIS_TICK_STYLE} tickLine={false}
          axisLine={{ stroke:"#808080" }} tickFormatter={(v) => `${v}%`} domain={[0,10]} />
        <YAxis type="category" dataKey="name" tick={AXIS_TICK_STYLE} tickLine={false}
          axisLine={{ stroke:"#808080" }} width={110} />
        <Tooltip content={<W95Tooltip formatter={(v) => `${v}%`} />} />
        <Bar dataKey="fraudRate" name="Fraud Rate" maxBarSize={14} radius={[0,2,2,0]}>
          {TOP_MERCHANTS.map((m, i) => (
            <Cell key={i} fill={m.fraudRate > 6 ? "#cc1100" : m.fraudRate > 4 ? "#cc7700" : "#cc9900"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Top Risky Countries ───────────────────────────────────────────────────────

function CountryBarChart() {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={TOP_COUNTRIES} layout="vertical"
        margin={{ top:4, right:40, left:4, bottom:4 }}>
        <CartesianGrid {...CHART_GRID_PROPS} horizontal={false} />
        <XAxis type="number" tick={AXIS_TICK_STYLE} tickLine={false}
          axisLine={{ stroke:"#808080" }} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="name" tick={AXIS_TICK_STYLE} tickLine={false}
          axisLine={{ stroke:"#808080" }} width={90} />
        <Tooltip content={<W95Tooltip formatter={(v,n) => n === "fraudRate" ? `${v}%` : v.toLocaleString()} />} />
        <Bar dataKey="fraudRate" name="Fraud Rate" maxBarSize={14} radius={[0,2,2,0]}>
          {TOP_COUNTRIES.map((c, i) => (
            <Cell key={i} fill={c.fraudRate > 20 ? "#cc0000" : c.fraudRate > 5 ? "#cc7700" : "#006600"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Fraud Heatmap ─────────────────────────────────────────────────────────────
// Layout: [heatmap grid | fixed-height detail panel]
//
// Hover label: absolute-positioned inside a reserved row — zero layout reflow.
// Click a cell: detail panel updates with stats + a "VIEW TXN LOG" toggle that
//   switches the panel body to a terminal-style transaction list.

interface HeatCell { day: string; hour: number; val: number }

function buildCellDetail(cell: HeatCell) {
  const idx       = DAYS_SHORT.indexOf(cell.day);
  const fraudEGP  = cell.val * (1200 + ((cell.hour * 7 + idx) % 20) * 180);
  const topVector = cell.val >= 6 ? "Card Testing" : cell.val >= 4 ? "Account Takeover" : cell.val >= 2 ? "Friendly Fraud" : "Promo Abuse";
  const topMerch  = ["B.TECH","Jumia EG","Noon.com","Talabat","Vodafone EG"][(cell.hour + idx) % 5];
  const blocked   = Math.round(cell.val * 0.82);
  const reviewed  = cell.val - blocked;
  // Generate a few fake transaction lines for the log view
  const txns = Array.from({ length: cell.val }, (_, i) => {
    const merchants = ["B.TECH","Jumia EG","Noon.com","Talabat","Vodafone EG","Carrefour","Amazon EG"];
    const statuses  = ["FRAUD","FRAUD","FRAUD","REVIEW"];
    const amounts   = [340,780,1240,2100,450,3300,890,560];
    const m  = Math.floor(i + 3);
    return {
      txId:   `TX-${((cell.hour * 100 + idx * 10 + i) * 7919 % 900000 + 100000).toString(36).toUpperCase().slice(0,7)}`,
      time:   `${String(cell.hour).padStart(2,"0")}:${String((m * 4) % 60).padStart(2,"0")}`,
      merch:  merchants[(i + cell.hour) % merchants.length],
      amount: amounts[(i + idx) % amounts.length],
      status: statuses[i % statuses.length] as "FRAUD"|"REVIEW",
    };
  });
  return { fraudEGP, topVector, topMerch, blocked, reviewed, txns };
}

// Fixed pixel heights so the panel never overflows its container
const GRID_H  = 148; // heatmap grid rows height in px
const PANEL_H = GRID_H + 32; // grid + legend row

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
      setShowTxLog(false); // reset to stats view on new selection
    }
  };

  return (
    <div className="flex gap-3 items-start">

      {/* ── LEFT: grid + legend ── */}
      <div className="flex flex-col shrink-0" style={{ gap:"2px" }}>

        {/* Hour header */}
        <div className="flex" style={{ marginLeft:"36px" }}>
          {HOURS.map((h) => (
            <div key={h} className="font-mono text-[8px] text-[#555] text-center"
              style={{ width:"18px", flexShrink:0 }}>
              {h % 3 === 0 ? String(h).padStart(2,"0") : ""}
            </div>
          ))}
        </div>

        {/* Day rows — fixed height block */}
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
                    style={{
                      width:"18px", height:"14px", flexShrink:0,
                      background: heatColor(val),
                      border: isSel ? "2px solid #fff" : "1px solid rgba(0,0,0,0.18)",
                      boxSizing:"border-box",
                      boxShadow: isSel ? "0 0 0 1px #000080" : "none",
                      cursor:"pointer",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend row — fixed height, hover label absolutely positioned inside */}
        <div className="flex items-center gap-1 relative" style={{ height:"19px", marginLeft:"38px" }}>
          <span className="font-mono text-[8px] text-[#555]">LOW</span>
          {["#001100","#003300","#005500","#cc8800","#cc4400","#aa1100","#ff0000"].map((c) => (
            <div key={c} style={{ width:"18px", height:"9px", background:c, border:"1px solid #606060", flexShrink:0 }} />
          ))}
          <span className="font-mono text-[8px] text-[#555]">HIGH</span>

          {/*
           * Hover label — absolute so it floats over the legend row
           * without touching any sibling's size. The parent row has
           * overflow:visible so it peeks above without displacing anything.
           */}
          {hover && (
            <div
              className="font-mono text-[9px] text-black whitespace-nowrap"
              style={{
                position:"sticky",
                left:"160px",
                top:"-2px",
                background:"#c0c0c0",
                borderStyle:"solid", borderWidth:"1px",
                borderColor:"white white #808080 #808080",
                padding:"1px 5px",
                pointerEvents:"none",
                zIndex:10,
              }}
            >
              {hover.day} {String(hover.hour).padStart(2,"0")}:00 — <b>{hover.val}</b> events
            </div>
          )}
        </div>

        {/* Instruction hint */}
        <div className="font-mono text-[8px] text-[#808080]" style={{ marginLeft:"36px" }}>
          Hover to preview · Click to inspect
        </div>
      </div>

      {/* ── RIGHT: detail panel — fixed height, never overflows ── */}
      <div className="flex flex-col flex-1" style={{ minWidth:0, height:`${PANEL_H}px` }}>

        {/* Mini title bar */}
        <div className="flex items-center justify-between px-2 shrink-0"
          style={{ background:"linear-gradient(to right,#000080,#1084d0)", height:"20px" }}>
          <span className="text-white font-mono text-[9px] font-bold truncate">
            {selected
              ? `${selected.day}  ${String(selected.hour).padStart(2,"0")}:00–${String(selected.hour+1).padStart(2,"0")}:00`
              : "◈  Select a cell to inspect"}
          </span>
          {/* Tab buttons */}
          {selected && (
            <div className="flex gap-px shrink-0 ml-1">
              {(["STATS","TXN LOG"] as const).map((tab) => {
                const active = (tab === "TXN LOG") === showTxLog;
                return (
                  <button key={tab}
                    onClick={() => setShowTxLog(tab === "TXN LOG")}
                    className="font-mono text-[8px] px-1"
                    style={{
                      height:"14px",
                      background: active ? "#ffffff" : "#c0c0c0",
                      color: active ? "#000080" : "#333",
                      borderStyle:"solid", borderWidth:"1px",
                      borderColor: active ? "#808080 #808080 white white" : "white white #808080 #808080",
                      cursor:"pointer",
                    }}>
                    {tab}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel body — flex-1 + overflow-y-auto so it scrolls, never overflows */}
        <div className="flex-1 bg-black overflow-y-auto"
          style={{ borderStyle:"solid", borderWidth:"2px",
            borderColor:"#808080 white white #808080", minHeight:0 }}>

          {/* ── Empty state ── */}
          {!selected && (
            <div className="flex flex-col items-center justify-center h-full gap-1 p-2">
              <span className="font-mono text-[9px] text-[#444] text-center leading-relaxed">
                Click any cell in the heatmap<br/>to inspect fraud events<br/>for that time slot
              </span>
            </div>
          )}

          {/* ── STATS view ── */}
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
              ] as [string,string][]).map(([k, v]) => {
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
              {/* "More info" CTA that switches to TXN LOG tab */}
              <button
                onClick={() => setShowTxLog(true)}
                className="mt-2 w-full font-mono text-[9px] text-left"
                style={{
                  background:"transparent", border:"none", padding:0,
                  color:"#00aaff", cursor:"pointer", textDecoration:"underline",
                }}>
                ▶ VIEW {detail.txns.length} TRANSACTION{detail.txns.length !== 1 ? "S" : ""} IN THIS WINDOW →
              </button>
            </div>
          )}

          {/* ── TXN LOG view ── */}
          {selected && detail && showTxLog && (
            <div className="flex flex-col" style={{ ...MONO }}>
              {/* Log header line */}
              <div className="font-mono text-[9px] px-2 py-1 shrink-0"
                style={{ color:"#00ff00", borderBottom:"1px solid #003300", background:"#000" }}>
                C:\AEGIS&gt; query --window="{selected.day} {String(selected.hour).padStart(2,"0")}:00"
              </div>
              {/* Transaction lines */}
              {detail.txns.length === 0 && (
                <div className="font-mono text-[9px] text-[#444] p-2">— no events recorded —</div>
              )}
              {detail.txns.map((tx, i) => (
                <div key={tx.txId}
                  className="font-mono text-[9px] px-2 py-px whitespace-pre"
                  style={{
                    color: tx.status === "FRAUD" ? "#ff4444" : "#ffaa00",
                    background: i % 2 === 0 ? "#000000" : "#050505",
                    borderBottom:"1px solid #001100",
                    textShadow: tx.status === "FRAUD" ? "0 0 4px #ff0000" : "0 0 3px #ff8800",
                  }}>
                  {`[${tx.time}] ${tx.txId} | ${tx.merch.padEnd(14)} | EGP ${String(tx.amount).padStart(5)} | ${tx.status === "FRAUD" ? "→ ⚠ FRAUD" : "→ ⚑ REVIEW"}`}
                </div>
              ))}
              {/* Back link */}
              <button
                onClick={() => setShowTxLog(false)}
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

// ── Model Metrics ─────────────────────────────────────────────────────────────

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
              <div className="font-mono font-bold" style={{ fontSize:"24px", color:col, textShadow:`0 0 8px ${col}` }}>
                {m.value}
                <span style={{ fontSize:"12px" }}>%</span>
              </div>
              {/* Mini gauge */}
              <div className="w-full bg-[#001100]" style={{ height:"4px", border:"1px solid #003300" }}>
                <div style={{ width:`${Math.min(m.value,100)}%`, height:"100%",
                  background:col, boxShadow:`0 0 3px ${col}` }} />
              </div>
              <div className="font-mono text-[8px] text-[#555] leading-tight">{m.desc}</div>
            </InsetPanel>
          );
        })}
      </div>

      {/* Training metadata */}
      <div className="flex items-center gap-4 px-2 py-1"
        style={{ background:"#d8d8d8", borderStyle:"solid", borderWidth:"1px", borderColor:"#808080 white white #808080" }}>
        {[
          ["MODEL",         "AEGIS v4.2.1-EG"],
          ["LAST TRAINED",  "May 14, 2025"],
          ["TRAIN SAMPLES", "2,841,204"],
          ["ARCHITECTURE",  "XGBoost + Neural Layer"],
          ["THRESHOLD",     "0.52 (tuned for Egypt)"],
          ["NEXT RETRAIN",  "May 21, 2025"],
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

// ── Insight Cards ─────────────────────────────────────────────────────────────

function InsightCards() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {INSIGHTS.map((ins) => (
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

type PeriodFilter = "all" | "week";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<PeriodFilter>("all");

  return (
    <div className="flex flex-col overflow-y-auto" style={{ ...MONO, background:"#c0c0c0" }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-2 py-1.5 shrink-0"
        style={{ borderBottom:"2px solid #808080", background:"#c0c0c0" }}>
        <span className="font-mono text-[10px] font-bold text-black">PERIOD:</span>
        <W95Button active={period === "all"} onClick={() => setPeriod("all")} className="!text-[10px]">
          📅 Last 30 Days
        </W95Button>
        <W95Button active={period === "week"} onClick={() => setPeriod("week")} className="!text-[10px]">
          📅 Last 7 Days
        </W95Button>
        <div className="w-px h-4 bg-[#808080] mx-1" />
        <W95Button className="!text-[10px]">💾 Export Report</W95Button>
        <W95Button className="!text-[10px]" onClick={() => window.print()}>🖨 Print</W95Button>
        <div className="flex-1" />
        <span className="font-mono text-[10px] text-[#444]">
          Business: CIB Egypt E-Commerce &nbsp;|&nbsp; Data as of May 17, 2025 09:14
        </span>
      </div>

      {/* ── Page content ── */}
      <div className="flex flex-col gap-3 p-3">

        {/* Row 1: KPI cards */}
        <KpiCards />

        {/* Row 2: Trend charts (2-col) */}
        <div className="grid grid-cols-2 gap-3">
          <Section title={`Fraud Rate Trend — ${period === "week" ? "Last 7 Days" : "Last 30 Days"}`}>
            <FraudRateChart period={period} />
          </Section>
          <Section title={`Transaction Volume vs Fraud Volume — ${period === "week" ? "Last 7 Days" : "Last 30 Days"}`}>
            <VolumeChart period={period} />
          </Section>
        </div>

        {/* Row 3: Distribution + Top lists (3-col) */}
        <div className="grid grid-cols-3 gap-3">
          <Section title="Risk Score Distribution — All Transactions">
            <RiskDistChart />
          </Section>
          <Section title="Top Risky Merchants — Fraud Rate %">
            <MerchantBarChart />
          </Section>
          <Section title="Top Risky Countries — Fraud Rate %">
            <CountryBarChart />
          </Section>
        </div>

        {/* Row 4: Heatmap (full width) */}
        <Section title="Fraud Event Heatmap — Hour of Day × Day of Week (Last 30 Days)">
          <FraudHeatmap />
        </Section>

        {/* Row 5: Insights (full width, 3-col grid inside) */}
        <Section title="Key Insights & Business Intelligence">
          <InsightCards />
        </Section>

        {/* Row 6: Model performance (full width) */}
        <Section title="Model Performance Metrics — AEGIS v4.2.1-EG">
          <ModelMetrics />
        </Section>

        {/* Footer */}
        <div className="font-mono text-[9px] text-[#555] text-center pb-1"
          style={{ borderTop:"1px solid #b0b0b0", paddingTop:"6px" }}>
          AEGIS RADAR v2.1 — AI-Powered Fraud Detection &nbsp;|&nbsp; Analytics refreshed every 15 min
          &nbsp;|&nbsp; © 2025 AEGIS Systems, Cairo EG &nbsp;|&nbsp; All metrics are indicative only
        </div>
      </div>

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