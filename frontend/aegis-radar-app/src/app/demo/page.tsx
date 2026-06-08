"use client";

/**
 * src/app/dashboard/demo/page.tsx
 *
 * AEGIS RADAR — Demo & Faculty Testing Page
 * Controlled batch testing environment for demonstrations.
 *
 * GET  /api/demo/status        → backend + model health
 * GET  /api/demo/batch-test    → run batch test (query param: count, type)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { getToken } from "@/lib/auth"; // adjust path if needed
import AegisLogo from "@/components/Aegislogo";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface BackendStatus {
  status:            string;
  model_version:     string;
  last_trained:      string;
  total_transactions:number;
  fraud_detected_today:number;
  avg_response_ms:   number;
  accuracy:          number;
  server_uptime:      number;
}

interface DetectedTx {
  transaction_id: string;
  merchant:       string;
  amount:         number;
  risk_score:     number;
  is_fraud:       boolean;
  confidence:     number;
  risk_level:     string;
  flags?:         string[];
  timestamp?:     string;
}

interface BatchResult {
  total_sent:      number;
  total_fraud:     number;
  total_normal:    number;
  fraud_rate:      number;
  avg_risk_score:  number;
  processing_ms:   number;
  transactions:    DetectedTx[];
}

type FilterMode = "all" | "fraud" | "normal";

// ═══════════════════════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function authHeaders(): HeadersInit {
  const token = getToken();
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (res.status === 401) { window.location.href = "/auth"; throw new Error("Unauthorized"); }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let detail = `HTTP ${res.status}`;
    try { detail = JSON.parse(body)?.detail ?? (body || detail); } catch { /* noop */ }
    throw new Error(detail);
  }
  return res.json();
}

// ── Fallback status when /api/demo/status is not available ────────────────────
const FALLBACK_STATUS: BackendStatus = {
  status:"offline", model_version:"AEGIS-v3.3.3",
  last_trained:"Jun 3, 2026", total_transactions:0,
  fraud_detected_today:0, avg_response_ms:38,
  accuracy:99.3, server_uptime:99.9,
};

// ═══════════════════════════════════════════════════════════════════════════════
// COLOUR HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const RISK_COLOR: Record<string, string> = {
  LOW:"#006913", MEDIUM:"#cc7700", HIGH:"#cc0000", CRITICAL:"#880000",
};
const RISK_BG: Record<string, string> = {
  LOW:"#ddffdd", MEDIUM:"#fff3cc", HIGH:"#ffdddd", CRITICAL:"#ffcccc",
};

// ═══════════════════════════════════════════════════════════════════════════════
// WIN95 PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════

const MONO: React.CSSProperties = { fontFamily:"'Courier New', Courier, monospace" };

function W95Button({ children, active, onClick, className = "", disabled, style }: {
  children: React.ReactNode; active?: boolean; onClick?: () => void;
  className?: string; disabled?: boolean; style?: React.CSSProperties;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`select-none cursor-pointer px-3 py-1 text-black bg-[#c0c0c0]
        focus:outline-dotted focus:outline-1 focus:outline-black text-xs
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ ...MONO, borderStyle:"solid", borderWidth:"2px",
        borderColor: active ? "#808080 #808080 white white" : "white white #808080 #808080",
        ...style }}>
      {children}
    </button>
  );
}

function TitleBar({ title, accent }: { title: string; accent?: "red"|"green"|"dark"| "normal" }) {
  const bg =
    accent === "red"   ? "linear-gradient(to right,#880000,#cc2200)" :
    accent === "normal"? "linear-gradient(to right,#000080,#1084d0)":
    accent === "green" ? "linear-gradient(to right,#006913,#0ead4e)" :
    accent === "dark"  ? "linear-gradient(to right,#1a1a2e,#16213e)"  :
     "linear-gradient(to right,#000080,#1084d0)";
  return (
    <div className="flex items-center justify-between px-2 select-none shrink-0"
      style={{ background:bg, height:"20px" }}>
      <span className="text-white text-[10px] font-bold tracking-wide truncate mr-1" style={MONO}>
        {title}
      </span>
      <div className="flex gap-px shrink-0">
        {["−","□","×"].map((b) => (
          <button key={b} className="select-none text-black bg-[#c0c0c0] font-mono"
            style={{ fontSize:"8px", width:"14px", height:"12px", cursor:"default",
              borderStyle:"solid", borderWidth:"1px",
              borderColor:"white white #808080 #808080",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
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

// ── Pixel Eye of Aegis (inline SVG, same as AegisLogo variant="full" at 40px) ──

 <AegisLogo size={44} variant="full"/>
// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — BACKEND STATUS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

function BackendStatusPanel({ status, loading, onRefresh }: {
  status: BackendStatus | null; loading: boolean; onRefresh: () => void;
}) {
  const s = status ?? FALLBACK_STATUS;
  const online = s.status === "online" || s.status === "healthy" || s.status === "ok";

  return (
    <div className="flex flex-col">
      <TitleBar title="Backend & Model Status" accent={online ? "green" : "red"} />
      <Panel className="p-3">
        <div className="flex gap-4 flex-wrap items-start">

          {/* Eye + status badge */}
          <div className="flex flex-col items-center gap-2 shrink-0">
           
            <div className="font-mono text-[9px] font-bold px-2 py-0.5 text-center"
              style={{ background: online ? "#006913" : "#cc0000",
                color:"white", borderStyle:"solid", borderWidth:"1px",
                borderColor:"white white #333 #333" }}>
              {loading ? "CHECKING…" : online ? "● ONLINE" : "✗ OFFLINE"}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2 flex-1 min-w-0">
            {[
              { label:"Server Status",    val: s.status.toUpperCase(),           color: online?"#000080":"#cc0000" },
              { label:"Model Version",    val: s.model_version,                  color:"#884400" },
              { label:"Last Trained",     val: s.last_trained,                   color:"#808080"    },
              { label:"Uptime",           val: s.server_uptime,                         color:"#006913" },
              { label:"Total Txns Today", val: s.total_transactions?.toString(), color: online?"#000080":"#cc0000" },
              { label:"Fraud Detected",   val: s.fraud_detected_today.toString(), color:"#884400" },
              { label:"Avg Response",     val: `${s.avg_response_ms}ms`,         color:"#808080" },
              { label:"Accuracy",         val: `${s.accuracy}%`,                 color:"#006913" },
            ].map(({ label, val, color }) => (
              <InsetPanel key={label} className="bg-black p-2 flex flex-col gap-0.5">
                <div className="font-mono text-[8px] text-[#888] uppercase tracking-wider">{label}</div>
                <div className="font-mono font-bold text-sm leading-tight" style={{ color }}>
                  {val}
                </div>
              </InsetPanel>
            ))}
          </div>

          {/* Refresh */}
          <div className="shrink-0">
            <W95Button onClick={onRefresh} disabled={loading} className="!text-[10px]">
              {loading ? "⏳" : "🔄"} Refresh
            </W95Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — BATCH TESTING CONTROLS
// ═══════════════════════════════════════════════════════════════════════════════

interface BatchPreset {
  id:    string;
  label: string;
  count: number;
  type:  string;
  desc:  string;
  icon:  string;
}

const PRESETS: BatchPreset[] = [
  { id:"normal", label:"Normal Transactions", count:30, type:"normal",
    icon:"✓", desc:"30 typical Egyptian e-commerce transactions — expected low fraud rate" },
  { id:"mixed",  label:"Mixed Traffic",       count:50, type:"mixed",
    icon:"≈", desc:"50 transactions: blend of normal, suspicious, and high-risk patterns" },
  { id:"stress", label:"High-Risk Stress Test",count:20,type:"high_risk",
    icon:"⚠", desc:"20 high-risk transactions — card testing, foreign IPs, velocity spikes" },
];

function BatchControls({ onRun, running }: {
  onRun: (count: number, type: string, label: string) => void;
  running: boolean;
}) {
  const [selected,    setSelected]    = useState<string>("normal");
  const [customCount, setCustomCount] = useState<string>("10");
  const [useCustom,   setUseCustom]   = useState(false);

  const active = PRESETS.find((p) => p.id === selected) ?? PRESETS[0];
  const count  = useCustom ? Math.max(1, Math.min(100, parseInt(customCount, 10) || 10)) : active.count;

  return (
    <div className="flex flex-col">
      <TitleBar title="Batch Testing Controls" />
      <Panel className="p-3 flex flex-col gap-3">

        {/* Preset buttons */}
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <div key={p.id}
              onClick={() => { setSelected(p.id); setUseCustom(false); }}
              className="flex flex-col p-2 cursor-pointer"
              style={{
                borderStyle:"solid", borderWidth:"2px",
                borderColor: selected === p.id && !useCustom
                  ? "#000080 #000080 white white"
                  : "white white #808080 #808080",
                background: selected === p.id && !useCustom ? "#dde8ff" : "#e8e8e8",
              }}>
              <div className="font-mono text-sm font-bold text-black">{p.icon}</div>
              <div className="font-mono text-[10px] font-bold text-black mt-0.5">{p.label}</div>
              <div className="font-mono text-[8px] text-[#555] mt-0.5 leading-snug">{p.desc}</div>
              <div className="font-mono text-[9px] font-bold mt-1" style={{ color:"#000080" }}>
                {p.count} transactions
              </div>
            </div>
          ))}
        </div>

        {/* Custom count */}
        <div className="flex items-center gap-2">
          <div
            onClick={() => setUseCustom((v) => !v)}
            className="flex items-center justify-center shrink-0 cursor-pointer"
            style={{ width:"13px", height:"13px", borderStyle:"solid", borderWidth:"2px",
              borderColor:"#808080 white white #808080", background:"white" }}>
            {useCustom && <span style={{ fontSize:"10px", fontWeight:"bold" }}>✓</span>}
          </div>
          <span className="font-mono text-[10px] text-black">Custom count:</span>
          <input type="number" min={1} max={100}
            value={customCount}
            onChange={(e) => setCustomCount(e.target.value)}
            disabled={!useCustom}
            className="bg-white text-black text-xs px-1 py-0.5"
            style={{ ...MONO, width:"56px", borderStyle:"solid", borderWidth:"2px",
              borderColor:"#808080 white white #808080", outline:"none",
              opacity: useCustom ? 1 : 0.5 }} />
          <span className="font-mono text-[9px] text-[#555]">
            (max 100 per batch)
          </span>
        </div>

        {/* Description of selected */}
        <div className="flex items-center gap-3 p-2"
          style={{ background:"#d8d8d8", borderStyle:"solid", borderWidth:"1px",
            borderColor:"#808080 white white #808080" }}>
          <span className="font-mono text-[9px] text-[#555]">Selected:</span>
          <span className="font-mono text-[10px] font-bold text-black">
            {useCustom ? `Custom — ${count} transactions` : active.label}
          </span>
          <span className="font-mono text-[9px] text-[#555]">·</span>
          <span className="font-mono text-[9px] text-[#555]">
            {useCustom ? "mixed type" : active.desc}
          </span>
        </div>

        {/* Big send button */}
        <button
          onClick={() => onRun(count, useCustom ? "mixed" : active.type, useCustom ? `Custom (${count})` : active.label)}
          disabled={running}
          className="w-full font-mono font-bold text-white select-none cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ ...MONO, fontSize:"14px", padding:"12px 0",
            background: running ? "#444" : "#000080",
            borderStyle:"solid", borderWidth:"2px",
            borderColor:"white white #808080 #808080",
            letterSpacing:"0.08em" }}>
          {running
            ? "⏳  PROCESSING BATCH…"
            : `▶  SEND BATCH  ( ${count} TRANSACTIONS )`}
        </button>
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — LIVE RESULTS TABLE
// ═══════════════════════════════════════════════════════════════════════════════

function ResultsTable({ txns, filter, onFilter }: {
  txns:     DetectedTx[];
  filter:   FilterMode;
  onFilter: (f: FilterMode) => void;
}) {
  const visible = txns.filter((t) => {
    if (filter === "fraud")  return t.is_fraud;
    if (filter === "normal") return !t.is_fraud;
    return true;
  });

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-1 px-2 py-1"
        style={{ background:"#c0c0c0", borderBottom:"1px solid #808080" }}>
        <span className="font-mono text-[10px] font-bold text-black mr-2">SHOW:</span>
        {(["all","fraud","normal"] as FilterMode[]).map((f) => (
          <W95Button key={f} active={filter === f} onClick={() => onFilter(f)}
            className="!text-[10px] !px-2 !py-px">
            {f === "all" ? `All (${txns.length})` :
             f === "fraud" ? `⚠ Fraud (${txns.filter((t)=>t.is_fraud).length})` :
             `✓ Normal (${txns.filter((t)=>!t.is_fraud).length})`}
          </W95Button>
        ))}
      </div>
      <div className="overflow-auto flex-1" style={{ background:"white" }}>
        <table className="w-full border-collapse" style={{ minWidth:"760px" }}>
          <thead style={{ position:"sticky", top:0, zIndex:1 }}>
            <tr>
              {["TX ID","MERCHANT","AMOUNT (EGP)","RISK SCORE","RISK LEVEL","FRAUD","CONFIDENCE","FLAGS"].map((h) => (
                <th key={h}
                  className="px-2 py-1 text-left font-mono text-[9px] font-bold text-black bg-[#c0c0c0]"
                  style={{ borderStyle:"solid", borderWidth:"1px",
                    borderColor:"white white #808080 #808080", whiteSpace:"nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-6 font-mono text-[11px] text-[#808080]">
                  — No results yet. Send a batch to begin. —
                </td>
              </tr>
            )}
            {visible.map((tx, i) => (
              <tr key={tx.transaction_id}
                style={{ background: tx.is_fraud
                  ? (i%2===0?"#fff5f5":"#ffeeee")
                  : (i%2===0?"#ffffff":"#f4f4f4") }}
                className="hover:bg-[#dde8ff]">

                <td className="px-2 py-1 font-mono text-[9px] font-bold text-[#000080]"
                  style={{ borderBottom:"1px solid #e0e0e0" }}>
                  {tx.transaction_id}
                </td>
                <td className="px-2 py-1 font-mono text-[9px] text-black truncate"
                  style={{ borderBottom:"1px solid #e0e0e0", maxWidth:"120px" }}>
                  {tx.merchant}
                </td>
                <td className="px-2 py-1 font-mono text-[9px] text-black text-right"
                  style={{ borderBottom:"1px solid #e0e0e0" }}>
                  {tx.amount.toLocaleString("en-EG",{minimumFractionDigits:2,maximumFractionDigits:2})}
                </td>
                <td className="px-2 py-1 font-mono text-[9px] font-bold text-right"
                  style={{ borderBottom:"1px solid #e0e0e0",
                    color: tx.risk_score >= 0.7 ? "#cc0000" : tx.risk_score >= 0.4 ? "#cc7700" : "#006600" }}>
                  {(tx.risk_score * 100).toFixed(1)}%
                </td>
                <td className="px-2 py-1" style={{ borderBottom:"1px solid #e0e0e0" }}>
                  <span className="font-mono text-[9px] font-bold px-1 py-0.5"
                    style={{ background:RISK_BG[tx.risk_level] ?? "#e8e8e8",
                      color:RISK_COLOR[tx.risk_level] ?? "#333",
                      border:`1px solid ${RISK_COLOR[tx.risk_level] ?? "#808080"}` }}>
                    {tx.risk_level}
                  </span>
                </td>
                <td className="px-2 py-1" style={{ borderBottom:"1px solid #e0e0e0" }}>
                  <span className="font-mono text-[9px] font-bold px-1.5 py-0.5"
                    style={{ background: tx.is_fraud ? "#ffdddd" : "#ddffdd",
                      color: tx.is_fraud ? "#cc0000" : "#006913",
                      border: `1px solid ${tx.is_fraud ? "#cc0000" : "#006913"}` }}>
                    {tx.is_fraud ? "⚠ FRAUD" : "✓ NORMAL"}
                  </span>
                </td>
                <td className="px-2 py-1 font-mono text-[9px] text-black"
                  style={{ borderBottom:"1px solid #e0e0e0" }}>
                  {((tx.confidence ?? 0) * 100).toFixed(1)}%
                </td>
                <td className="px-2 py-1 font-mono text-[9px] text-[#808080] truncate"
                  style={{ borderBottom:"1px solid #e0e0e0", maxWidth:"140px" }}>
                  {(tx.flags ?? []).join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — FRAUD ALERTS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

function AlertsSummary({ txns, batchLabel, batchTime }: {
  txns:       DetectedTx[];
  batchLabel: string;
  batchTime:  string;
}) {
  const fraud    = txns.filter((t) => t.is_fraud);
  const critical = txns.filter((t) => t.risk_level === "CRITICAL").length;
  const high     = txns.filter((t) => t.risk_level === "HIGH").length;
  const medium   = txns.filter((t) => t.risk_level === "MEDIUM").length;
  const low      = txns.filter((t) => t.risk_level === "LOW").length;
  const fraudRate = txns.length > 0
    ? ((fraud.length / txns.length) * 100).toFixed(1)
    : "—";
  const avgRisk = fraud.length > 0
    ? (fraud.reduce((s, t) => s + t.risk_score, 0) / fraud.length * 100).toFixed(1)
    : "—";

  return (
    <div className="flex flex-col shrink-0" style={{ width:"240px" }}>
      <TitleBar title="Fraud Alerts Summary" />
      <Panel className="p-2 flex flex-col gap-2">

        {/* Session info */}
        <InsetPanel className="bg-black p-2">
          <div className="font-mono text-[8px] text-[#007700] mb-1">▶ SESSION INFO</div>
          {[
            ["Batch",       batchLabel || "—"],
            ["Tested At",   batchTime  || "—"],
            ["Total Sent",  txns.length.toString()],
            ["Fraud Found", fraud.length.toString()],
            ["Fraud Rate",  `${fraudRate}%`],
            ["Avg Risk",    `${avgRisk}%`],
          ].map(([k,v]) => (
            <div key={k as string} className="flex justify-between gap-1 py-px"
              style={{ borderBottom:"1px solid #001800" }}>
              <span className="font-mono text-[8px] text-[#007700]">{k}</span>
              <span className="font-mono text-[8px] font-bold"
                style={{ color: k === "Fraud Found" && fraud.length > 0 ? "#ff4444" :
                  k === "Fraud Rate" && parseFloat(fraudRate||"0") > 20 ? "#ff4444" : "#00ff00" }}>
                {v}
              </span>
            </div>
          ))}
        </InsetPanel>

        {/* Severity breakdown */}
        <div className="font-mono text-[9px] font-bold text-black">By Severity</div>
        {[
          { level:"CRITICAL", count:critical, color:"#880000", bg:"#ffcccc" },
          { level:"HIGH",     count:high,     color:"#cc0000", bg:"#ffdddd" },
          { level:"MEDIUM",   count:medium,   color:"#cc7700", bg:"#fff3cc" },
          { level:"LOW",      count:low,      color:"#006913", bg:"#ddffdd" },
        ].map(({ level, count, color, bg }) => (
          <div key={level} className="flex items-center gap-2 py-0.5"
            style={{ borderBottom:"1px solid #d0d0d0" }}>
            <span className="font-mono text-[9px] font-bold px-1 py-px shrink-0"
              style={{ background:bg, color, border:`1px solid ${color}`, minWidth:"60px", textAlign:"center" }}>
              {level}
            </span>
            <div className="flex-1 h-3 bg-[#e0e0e0]"
              style={{ borderStyle:"solid", borderWidth:"1px",
                borderColor:"#808080 white white #808080" }}>
              <div style={{ width: txns.length > 0 ? `${(count/txns.length)*100}%` : "0%",
                height:"100%", background:color }} />
            </div>
            <span className="font-mono text-[9px] font-bold shrink-0" style={{ color }}>
              {count}
            </span>
          </div>
        ))}

        {/* Top flagged merchants */}
        {fraud.length > 0 && (
          <>
            <div className="font-mono text-[9px] font-bold text-black mt-1">Top Flagged</div>
            {Object.entries(
              fraud.reduce((acc, t) => {
                acc[t.merchant] = (acc[t.merchant] ?? 0) + 1;
                return acc;
              }, {} as Record<string,number>)
            ).sort((a,b) => b[1]-a[1]).slice(0,4).map(([m,c]) => (
              <div key={m} className="flex justify-between gap-1 py-px"
                style={{ borderBottom:"1px solid #d0d0d0" }}>
                <span className="font-mono text-[8px] text-black truncate flex-1">{m}</span>
                <span className="font-mono text-[8px] font-bold text-[#cc0000] shrink-0">
                  {c} fraud
                </span>
              </div>
            ))}
          </>
        )}

        {/* No fraud message */}
        {txns.length > 0 && fraud.length === 0 && (
          <div className="font-mono text-[9px] text-[#006600] text-center py-2 font-bold">
            ✓ No fraud detected in this batch
          </div>
        )}
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TERMINAL LOG PANEL
// ═══════════════════════════════════════════════════════════════════════════════

function TerminalLog({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);

  return (
    <div className="flex flex-col shrink-0" style={{ height:"140px" }}>
      <TitleBar title="C:\AEGIS\demo.exe — Test Log" accent="dark" />
      <InsetPanel className="flex-1 overflow-hidden bg-black">
        <div ref={ref} className="h-full overflow-y-auto px-2 py-1"
          style={{ scrollbarWidth:"thin", scrollbarColor:"#004400 #000" }}>
          {lines.map((line, i) => (
            <div key={i} className="font-mono text-[9px] leading-relaxed whitespace-pre"
              style={{ color: line.startsWith("ERROR") ? "#ff4444" :
                line.startsWith("✓") ? "#00cc00" :
                line.startsWith("⚠") ? "#ffaa00" :
                line.startsWith("▶") ? "#00aaff" : "#00cc00" }}>
              {line}
            </div>
          ))}
          <div className="font-mono text-[9px] text-[#00ff00]">
            C:\AEGIS&gt;<span style={{ display:"inline-block", width:"7px", height:"11px",
              background:"#00ff00", verticalAlign:"middle", marginLeft:"3px",
              animation:"blink 1s step-end infinite" }} />
          </div>
        </div>
      </InsetPanel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE ROOT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DemoPage() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [results,       setResults]       = useState<DetectedTx[]>([]);
  const [results_,      getResults]       = useState<DetectedTx[]>([]);
  const [running,       setRunning]       = useState(false);
  const [filter,        setFilter]        = useState<FilterMode>("all");
  const [batchLabel,    setBatchLabel]    = useState("");
  const [batchTime,     setBatchTime]     = useState("");
  const [log,           setLog]           = useState<string[]>([
    "▶ AEGIS RADAR Demo Testing Environment",
    "▶ Eye of Aegis — AI Fraud Detection v3.3.3",
    "▶ Awaiting batch command…",
  ]);

  const addLog = useCallback((line: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString("en-GB",{hour12:false})}] ${line}`].slice(-200));
  }, []);

  // ── Load backend status ───────────────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const data = await apiFetch<BackendStatus>("/api/demo/status");
      setBackendStatus(data);
      addLog(`✓ Backend online — model: ${data.model_version} — accuracy: ${data.accuracy}%`);
    } catch (err: unknown) {
      // Fallback: try /api/analytics for partial info
      addLog(`⚠ /demo/status not available — using fallback status`);
      setBackendStatus(FALLBACK_STATUS);
    } finally {
      setStatusLoading(false);
    }
  }, [addLog]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // ── Run batch ─────────────────────────────────────────────────────────────
  const handleRun = useCallback(async (count: number, type: string, label: string) => {
    if (running) return;
    setRunning(true);
    setResults([]);
    setFilter("all");
    setBatchLabel(label);
    setBatchTime(new Date().toLocaleTimeString("en-GB",{hour12:false}));

    addLog(`▶ Starting batch: "${label}" — ${count} transactions — type: ${type}`);

    try {
      const url = `/api/demo/batch-test?count=${count}&type=${type}`;
      const url2 = `/api/demo/demo-test?count=${count}&type=${type}`;
      addLog(`▶ POST ${url}`);

      const data = await apiFetch<BatchResult>(url);
      const res = await apiFetch<BatchResult>(url2);

      const txns: DetectedTx[] = res.transactions ?? [];
      setResults(txns);

      

      const fraudCount = txns.filter((t) => t.is_fraud).length;
      addLog(`✓ Batch complete — ${data.total_sent ?? txns.length} processed in ${data.processing_ms ?? "—"}ms`);
      addLog(`✓ Fraud detected: ${fraudCount} / ${txns.length} (${data.fraud_rate?.toFixed(1) ?? "—"}%)`);
      addLog(`✓ Avg risk score: ${((data.avg_risk_score ?? 0)*100).toFixed(1)}%`);

      const fraudCount_ = txns.filter((t) => t.is_fraud).length;
      addLog(`✓ Batch complete — ${res.total_sent ?? txns.length} processed in ${res.processing_ms ?? "—"}ms`);
      addLog(`✓ Fraud detected: ${fraudCount_} / ${txns.length} (${res.fraud_rate?.toFixed(1) ?? "—"}%)`);
      addLog(`✓ Avg risk score: ${((res.avg_risk_score ?? 0)*100).toFixed(1)}%`);

      if (fraudCount_ > 0) {
        addLog(`⚠ ${fraudCount_} fraud transaction${fraudCount_>1?"s":""} flagged — review alerts panel`);
      } else {
        addLog(`✓ No fraud detected in this batch`);
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      addLog(`ERROR: ${msg}`);

      // Show error in results area gracefully
      setResults([]);
      setBatchLabel(`${label} — FAILED`);
    } finally {
      setRunning(false);
    }
  }, [running, addLog]);

  return (
    <div className="flex flex-col overflow-y-auto" style={{ ...MONO, background:"#c0c0c0" }}>

      {/* ── Page header ── */}
      <div className="flex items-center gap-3 px-3 py-2 shrink-0"
        style={{ borderBottom:"2px solid #808080", background:"#c0c0c0" }}>
       <AegisLogo size={26} variant="full"/>
        <div>
          <div className="font-mono text-sm font-bold text-black">AEGIS RADAR — Demo Testing Environment</div>
          <div className="font-mono text-[9px] text-[#555]">
            Controlled batch testing for faculty demonstration · AEGIS-v3.3.3
          </div>
        </div>
        <div className="flex-1" />
        <div className="font-mono text-[9px] px-2 py-px"
          style={{ background:"#000080", color:"white",
            borderStyle:"solid", borderWidth:"1px", borderColor:"white white #808080 #808080" }}>
          DEMO MODE
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col gap-3 p-3">

        {/* Section 1: Backend status */}
        <BackendStatusPanel
          status={backendStatus}
          loading={statusLoading}
          onRefresh={loadStatus}
        />

        {/* Section 2: Controls */}
        <BatchControls onRun={handleRun} running={running} />

        {/* Section 3+4: Results table + Alerts summary */}
        <div className="flex gap-3 items-start">

          {/* Results table */}
          <div className="flex flex-col flex-1 min-w-0" style={{ minHeight:"300px" }}>
            <TitleBar title={`Live Test Results — ${results.length} transactions${batchLabel ? `  [${batchLabel}]` : ""}`} />
            <Panel className="p-0 flex-1 flex flex-col min-h-0">
              {results.length === 0 && !running ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                 <AegisLogo size={44} variant="full"/>
                  <div className="font-mono text-[10px] text-[#808080] text-center">
                    No results yet.<br />Select a batch type and click ▶ Send Batch.
                  </div>
                </div>
              ) : running ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                <AegisLogo size={44} variant="full"/>
                  <div className="font-mono text-[11px] text-[#000080] font-bold">
                    Processing batch…
                  </div>
                  <div className="font-mono text-[9px] text-[#808080]">
                    Sending transactions to ML backend
                  </div>
                </div>
              ) : (
                <ResultsTable txns={results} filter={filter} onFilter={setFilter} />
              )}
            </Panel>
          </div>

          {/* Alerts summary */}
          <AlertsSummary txns={results} batchLabel={batchLabel} batchTime={batchTime} />
        </div>

        {/* Terminal log */}
        <TerminalLog lines={log} />

        {/* Footer */}
        <div className="font-mono text-[9px] text-[#555] text-center pb-1"
          style={{ borderTop:"1px solid #b0b0b0", paddingTop:"6px" }}>
          AEGIS RADAR-v3.3.3 — Demo Testing Environment &nbsp;|&nbsp;
          Powered by Eye of Aegis ML Engine &nbsp;|&nbsp;
          © 2026 AEGIS Systems, Cairo EG &nbsp;|&nbsp; For demonstration purposes only
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        ::-webkit-scrollbar { width:12px; height:12px; }
        ::-webkit-scrollbar-track { background:#c0c0c0; }
        ::-webkit-scrollbar-thumb {
          background:#c0c0c0;
          border-style:solid; border-width:2px;
          border-color:white white #808080 #808080;
        }
        ::-webkit-scrollbar-corner { background:#c0c0c0; }
      `}</style>
    </div>
  );
}
