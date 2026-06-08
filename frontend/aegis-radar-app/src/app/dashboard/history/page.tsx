"use client";

import { useState, useMemo, useCallback, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ─── Types (backend contract) ─────────────────────────────────────────────────
type TxStatus   = "FRAUD" | "NORMAL" | "REVIEW";
type RiskLevel  = "HIGH"  | "MEDIUM" | "LOW";
type DeviceType = "Mobile" | "Desktop" | "Tablet" | "POS";
type SortDir    = "asc" | "desc";
type DateRange  = "today" | "7d" | "30d" | "all";
type SortKey    = "time" | "txId" | "merchant" | "amount" | "riskScore" | "status";

interface Transaction {
  id:        string;
  time:      string;
  txId:      string;
  customerId?: string;
  merchant:  string;
  amount:    number;
  country?:  string;
  device?:   DeviceType;
  riskScore: number;
  riskLevel: RiskLevel;
  status:    TxStatus;
  ip?:       string;
  email?:    string;
  phone?:    string;
  cardLast4?: string;
  notes?:    string;
}

// ─── Backend mapping ──────────────────────────────────────────────────────────
function toDate(s?: string) {
  if (!s) return new Date(0);
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date(s.replace(" ", "T")) : d;
}

function formatTimeISO(s?: string) {
  if (!s) return "";
  return toDate(s).toLocaleString();
}

function mapApiTx(t: any): Transaction {
  const ts    = t.timestamp ?? t.time ?? t.created_at ?? new Date().toISOString();
  const raw   = t.risk_score ?? t.riskScore ?? 0;
  const risk  = Math.round(raw * (raw <= 1 ? 100 : 1));
  const level: RiskLevel =
    risk >= 70 ? "HIGH" : risk >= 40 ? "MEDIUM" : "LOW";
  const status: TxStatus =
    t.is_fraud || t.status === "FRAUD"
      ? "FRAUD"
      : t.status === "REVIEW"
        ? "REVIEW"
        : "NORMAL";
  return {
    id:        t.transaction_id ?? t.tx_id ?? t.id ?? `${Math.random()}`,
    txId:      t.transaction_id ?? t.tx_id ?? t.txId ?? "",
    time:      ts,
    merchant:  t.merchant ?? "Unknown",
    amount:    Number(t.amount ?? 0),
    country:   t.country ?? "",
    device:    t.device ?? "Desktop",
    riskScore: risk,
    riskLevel: level,
    status,
    ip:        t.ip,
    email:     t.email,
    phone:     t.phone,
    cardLast4: t.card_last4 ?? t.cardLast4,
    notes:     t.notes ?? "",
  };
}

// ─── Recommendations ──────────────────────────────────────────────────────────
function buildRecommendations(filtered: Transaction[]) {
  const recs: { icon: string; priority: "!!!" | "!!" | "!"; text: string }[] = [];
  const fraud  = filtered.filter((t) => t.status === "FRAUD");
  const review = filtered.filter((t) => t.status === "REVIEW");
  const high   = filtered.filter((t) => t.riskLevel === "HIGH");
  if (fraud.length > 0)
    recs.push({ icon:"🚨", priority:"!!!", text:`${fraud.length} fraud transactions — investigate top merchants` });
  if (high.length > 5)
    recs.push({ icon:"⚠", priority:"!!", text:`${high.length} high-risk transactions — consider step-up auth` });
  if (review.length > 3)
    recs.push({ icon:"👁", priority:"!",  text:`${review.length} pending review — assign to analysts` });
  recs.push({ icon:"📋", priority:"!", text:"Review all FRAUD txns within 4 hours" });
  recs.push({ icon:"🔒", priority:"!", text:"Enforce 2-FA on high-velocity accounts" });
  return recs.slice(0, 6);
}

// ─── CSV export ───────────────────────────────────────────────────────────────
function exportCSV(rows: Transaction[]) {
  const headers = ["Time","TX ID","Merchant","Amount (EGP)","Risk","Status","IP","Email","Notes"];
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((r) => [
      formatTimeISO(r.time), r.txId, esc(r.merchant),
      r.amount.toFixed(2), `${r.riskScore}`, r.status,
      r.ip ?? "", r.email ?? "", esc(r.notes),
    ].join(",")),
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "aegis-transactions.csv";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIN95 PRIMITIVE COMPONENTS  (full styling — consistent with other pages)
// ═══════════════════════════════════════════════════════════════════════════════

const MONO: React.CSSProperties = { fontFamily: "'Courier New', Courier, monospace" };

function W95Button({
  children, active, onClick, className = "", title, style, disabled,
}: {
  children: React.ReactNode; active?: boolean; onClick?: () => void;
  className?: string; title?: string; style?: React.CSSProperties; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`select-none cursor-pointer px-2 py-0.5 text-black bg-[#c0c0c0]
        focus:outline-dotted focus:outline-1 focus:outline-black text-xs
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        ...MONO,
        borderStyle: "solid", borderWidth: "2px",
        borderColor: active ? "#808080 #808080 white white" : "white white #808080 #808080",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function W95Select({
  value, onChange, options, className = "", disabled,
}: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string; disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`bg-white text-black text-xs px-1 py-0.5 ${className}`}
      style={{
        ...MONO,
        borderStyle: "solid", borderWidth: "2px",
        borderColor: "#808080 white white #808080", outline: "none",
      }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function W95Input({
  value, onChange, placeholder = "", className = "",
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input
      type="text" value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-white text-black text-xs px-1 py-0.5 ${className}`}
      style={{
        ...MONO,
        borderStyle: "solid", borderWidth: "2px",
        borderColor: "#808080 white white #808080", outline: "none",
      }}
    />
  );
}

function TitleBar({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between px-2 select-none shrink-0"
      style={{ background: "linear-gradient(to right,#000080,#1084d0)", height: "20px" }}>
      <span className="text-white text-[10px] font-bold tracking-wide truncate mr-1" style={MONO}>
        {title}
      </span>
      <div className="flex gap-px shrink-0">
        {["−","□","×"].map((b) => (
          <button key={b} style={{
            fontSize:"8px", width:"14px", height:"12px", cursor:"default",
            borderStyle:"solid", borderWidth:"1px",
            borderColor:"white white #808080 #808080", background:"#c0c0c0",
            display:"flex", alignItems:"center", justifyContent:"center", ...MONO,
          }}>{b}</button>
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

// ─── Colour helpers ───────────────────────────────────────────────────────────
const STATUS_COLOR: Record<TxStatus,  string> = { FRAUD:"#cc0000", NORMAL:"#006600", REVIEW:"#cc7700" };
const STATUS_BG:    Record<TxStatus,  string> = { FRAUD:"#ffdddd", NORMAL:"#ddffdd", REVIEW:"#fff3cc" };
const RISK_COLOR:   Record<RiskLevel, string> = { HIGH:"#cc0000",  MEDIUM:"#cc7700",  LOW:"#006600"   };
const PRIO_COLOR = { "!!!":"#cc0000", "!!":"#cc7700", "!":"#006600" };

// ─── Filter state ─────────────────────────────────────────────────────────────
interface Filters {
  dateRange: DateRange;
  status:    "" | TxStatus;
  riskLevel: "" | RiskLevel;
  merchant:  string;
  search:    string;
}
const DEFAULT_FILTERS: Filters = {
  dateRange: "30d", status: "", riskLevel: "", merchant: "", search: "",
};

// ─── Sort helper ──────────────────────────────────────────────────────────────
function SortTh({
  col, label, sortKey, sortDir, onSort,
}: {
  col: SortKey; label: string; sortKey: SortKey; sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === col;
  return (
    <th
      className="px-1 py-0.5 text-left font-mono text-[10px] font-bold cursor-pointer
        select-none bg-[#c0c0c0] text-black hover:bg-[#d4d4d4]"
      style={{
        borderStyle:"solid", borderWidth:"1px", whiteSpace:"nowrap",
        borderColor: active ? "#808080 white white #808080" : "white white #808080 #808080",
      }}
      onClick={() => onSort(col)}
    >
      {label} {active ? (sortDir === "asc" ? "▲" : "▼") : ""}
    </th>
  );
}

// ─── Recommendations panel ────────────────────────────────────────────────────
function RecommendationsPanel({ filtered }: { filtered: Transaction[] }) {
  const recs = useMemo(() => buildRecommendations(filtered), [filtered]);
  return (
    <div className="flex flex-col shrink-0" style={{ width:"260px" }}>
      <TitleBar title="⚡ Live Recommendations" />
      <Panel className="p-2 flex flex-col gap-1 overflow-y-auto" style={{ maxHeight:"280px" }}>
        {recs.map((r, i) => (
          <div key={i} className="flex gap-1.5 items-start py-1"
            style={{ borderBottom: i < recs.length-1 ? "1px solid #b0b0b0" : "none" }}>
            <span className="text-sm shrink-0">{r.icon}</span>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[8px] font-bold"
                style={{ color: PRIO_COLOR[r.priority] }}>
                PRIORITY {r.priority}
              </span>
              <span className="font-mono text-[10px] text-black leading-snug">{r.text}</span>
            </div>
          </div>
        ))}
      </Panel>

      <div className="mt-2 flex flex-col">
        <TitleBar title="📋 Best Practices" />
        <Panel className="p-2">
          {[
            "Review all FRAUD txns within 4 hrs",
            "Enforce 2-FA on velocity breaches",
            "Run weekly chargeback audit",
            "Store evidence ≥ 18 months",
          ].map((bp, i) => (
            <div key={i} className="font-mono text-[9px] text-black py-0.5 flex gap-1"
              style={{ borderBottom: i < 3 ? "1px solid #d0d0d0":"none" }}>
              <span className="text-[#008800]">►</span> {bp}
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function HistoryPage() {
  // ── State (all backend-connected — DO NOT MODIFY) ──────────────────────────
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters,      setFilters]      = useState<Filters>(DEFAULT_FILTERS);
  const [sortKey,      setSortKey]      = useState<SortKey>("time");
  const [sortDir,      setSortDir]      = useState<SortDir>("desc");
  const [loading,      setLoading]      = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [newCount,     setNewCount]     = useState(0);
  const [expandedId,   setExpandedId]   = useState<string | null>(null);

  // ── Data fetching (DO NOT MODIFY) ─────────────────────────────────────────
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/transactions?limit=1000`);
      if (!res.ok) throw new Error(`backend ${res.status}`);
      const data = await res.json();
      const mapped = (Array.isArray(data) ? data : []).map(mapApiTx);
      mapped.sort((a, b) => toDate(b.time).getTime() - toDate(a.time).getTime());
      setTransactions(mapped);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    const before = transactions.length;
    await loadTransactions();
    setRefreshing(false);
    setNewCount(Math.max(0, transactions.length - before));
    setExpandedId(null);
    setFilters((p) => ({ ...p, dateRange: "today" }));
    setTimeout(() => setNewCount(0), 4000);
  }, [refreshing, loadTransactions, transactions.length]);

  // ── Filtering (DO NOT MODIFY) ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      const diffDays = (now.getTime() - toDate(tx.time).getTime()) / 86400000;
      if (filters.dateRange === "today" && diffDays > 1)  return false;
      if (filters.dateRange === "7d"    && diffDays > 7)  return false;
      if (filters.dateRange === "30d"   && diffDays > 30) return false;
      if (filters.status    && tx.status    !== filters.status)    return false;
      if (filters.riskLevel && tx.riskLevel !== filters.riskLevel) return false;
      if (filters.merchant  && tx.merchant  !== filters.merchant)  return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!(
          tx.txId.toLowerCase().includes(q) ||
          (tx.email    ?? "").toLowerCase().includes(q) ||
          (tx.merchant ?? "").toLowerCase().includes(q)
        )) return false;
      }
      return true;
    });
  }, [transactions, filters]);

  // ── Sorting (DO NOT MODIFY) ───────────────────────────────────────────────
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: any = (a as any)[sortKey];
      let bv: any = (b as any)[sortKey];
      if (sortKey === "amount" || sortKey === "riskScore") {
        av = Number(av); bv = Number(bv);
      } else if (sortKey === "time") {
        av = toDate(a.time).getTime(); bv = toDate(b.time).getTime();
      } else {
        av = String(av).toLowerCase(); bv = String(bv).toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const stats = useMemo(() => ({
    total:    sorted.length,
    fraud:    sorted.filter((s) => s.status === "FRAUD").length,
    review:   sorted.filter((s) => s.status === "REVIEW").length,
    totalEGP: sorted.reduce((s, t) => s + t.amount, 0),
  }), [sorted]);

  const merchants = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.merchant))).sort(),
    [transactions],
  );

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const setFilter = useCallback(
    (k: keyof Filters, v: any) => setFilters((prev) => ({ ...prev, [k]: v })),
    [],
  );

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }, [sortKey]);

  const handleRowClick = useCallback(
    (id: string) => setExpandedId((prev) => prev === id ? null : id),
    [],
  );

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full overflow-hidden"
      style={{ ...MONO, background:"#c0c0c0" }}>

      {/* ── Filter toolbar ── */}
      <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 shrink-0"
        style={{ borderBottom:"2px solid #808080", background:"#c0c0c0" }}>

        {/* Date range */}
        <span className="text-[10px] font-mono font-bold text-black">DATE:</span>
        {(["today","7d","30d"] as const).map((r) => {
          const DATE_LABELS: Record<"today"|"7d"|"30d", string> = {
            today:"Today", "7d":"7 Days", "30d":"30 Days",
          };
          return (
            <W95Button key={r} active={filters.dateRange === r}
              onClick={() => setFilter("dateRange", r)}
              className="!text-[10px] !px-2">
              {DATE_LABELS[r]}
            </W95Button>
          );
        })}

        <div className="w-px h-4 bg-[#808080] mx-1" />

        <span className="text-[10px] font-mono font-bold text-black">STATUS:</span>
        <W95Select value={filters.status}
          onChange={(v) => setFilter("status", v as Filters["status"])}
          options={[
            { value:"", label:"All" }, { value:"FRAUD", label:"Fraud" },
            { value:"NORMAL", label:"Normal" }, { value:"REVIEW", label:"Review" },
          ]} />

        <span className="text-[10px] font-mono font-bold text-black">RISK:</span>
        <W95Select value={filters.riskLevel}
          onChange={(v) => setFilter("riskLevel", v as Filters["riskLevel"])}
          options={[
            { value:"", label:"All" }, { value:"HIGH", label:"High" },
            { value:"MEDIUM", label:"Medium" }, { value:"LOW", label:"Low" },
          ]} />

        <span className="text-[10px] font-mono font-bold text-black">MERCHANT:</span>
        <W95Select value={filters.merchant}
          onChange={(v) => setFilter("merchant", v)}
          className="max-w-[130px]"
          options={[
            { value:"", label:"All Merchants" },
            ...merchants.map((m) => ({ value:m, label:m })),
          ]} />

        <div className="w-px h-4 bg-[#808080] mx-1" />

        <W95Input value={filters.search}
          onChange={(v) => setFilter("search", v)}
          placeholder="Search TX ID / Email…" className="w-40" />

        <W95Button onClick={() => setFilters(DEFAULT_FILTERS)} className="!text-[10px]">
          ↺ Reset
        </W95Button>

        <div className="flex-1" />

        <W95Button onClick={() => exportCSV(sorted)} className="!text-[10px]">
          💾 Export CSV
        </W95Button>
        <W95Button onClick={() => window.print()} className="!text-[10px]">
          🖨 Print
        </W95Button>
        <div className="w-px h-4 bg-[#808080] mx-1" />
        <W95Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="!text-[10px] !font-bold"
          style={refreshing ? { borderColor:"#808080 #808080 white white" } : undefined}
        >
          {refreshing ? "⏳ Refreshing…" : "🔄 Refresh"}
        </W95Button>
      </div>

      {/* ── Stats bar ── */}
      <div className="flex items-center gap-4 px-2 py-1 shrink-0"
        style={{ borderBottom:"1px solid #808080", background:"#d8d8d8" }}>
        {[
          { label:"SHOWING",   val: stats.total,   col:"#000" },
          { label:"FRAUD",     val: stats.fraud,   col:STATUS_COLOR.FRAUD   },
          { label:"REVIEW",    val: stats.review,  col:STATUS_COLOR.REVIEW  },
          { label:"TOTAL VOL", val:`EGP ${stats.totalEGP.toLocaleString("en-EG",{minimumFractionDigits:2,maximumFractionDigits:2})}`, col:"#000" },
          { label:"ALL RECORDS", val: transactions.length, col:"#000" },
        ].map(({ label, val, col }) => (
          <div key={label} className="flex gap-1 items-baseline">
            <span className="font-mono text-[9px] text-[#555]">{label}:</span>
            <span className="font-mono text-[11px] font-bold" style={{ color:col }}>{val}</span>
          </div>
        ))}

        {loading && (
          <div className="font-mono text-[9px] text-[#808080] ml-2">⏳ Loading…</div>
        )}

        {newCount > 0 && (
          <div className="ml-auto flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] font-bold"
            style={{ background:"#000080", color:"#ffffff",
              borderStyle:"solid", borderWidth:"2px",
              borderColor:"white white #808080 #808080" }}>
            ▲ {newCount} new transaction{newCount > 1 ? "s" : ""} loaded
          </div>
        )}
      </div>

      {/* ── Main body: table + sidebar ── */}
      <div className="flex flex-1 min-h-0 gap-2 p-2 overflow-hidden">

        {/* ── Transaction table ── */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          <TitleBar title={`Transaction History — ${sorted.length} records${loading ? "  (loading…)" : ""}`} />

          <div className="flex-1 overflow-auto"
            style={{ borderStyle:"solid", borderWidth:"2px",
              borderColor:"#808080 white white #808080", background:"white",
              maxHeight:"520px" }}>
            <table className="w-full border-collapse"
              style={{ tableLayout:"fixed", minWidth:"820px" }}>
              <colgroup>
                <col style={{ width:"140px" }} />
                <col style={{ width:"90px"  }} />
                <col style={{ width:"160px" }} />
                <col style={{ width:"90px"  }} />
                <col style={{ width:"65px"  }} />
                <col style={{ width:"75px"  }} />
                <col style={{ width:"30px"  }} />
              </colgroup>

              <thead style={{ position:"sticky", top:0, zIndex:1 }}>
                <tr>
                  <SortTh col="time"      label="TIME"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="txId"      label="TX ID"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="merchant"  label="MERCHANT"  sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="amount"    label="AMT (EGP)" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="riskScore" label="RISK"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="status"    label="STATUS"    sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-1 py-0.5 font-mono text-[10px] font-bold bg-[#c0c0c0]
                    text-black text-center"
                    style={{ borderStyle:"solid", borderWidth:"1px",
                      borderColor:"white white #808080 #808080" }}>
                    ▼
                  </th>
                </tr>
              </thead>

              <tbody>
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 font-mono text-xs text-[#808080]">
                      {loading ? "⏳ Loading transactions…" : "— No transactions match current filters —"}
                    </td>
                  </tr>
                )}

                {sorted.map((tx, i) => {
                  const isExpanded = expandedId === tx.id;
                  const rowBg = isExpanded ? "#dde8ff" : i % 2 === 0 ? "#fff" : "#f4f4f4";

                  return [
                    /* Main row */
                    <tr key={tx.id}
                      onClick={() => handleRowClick(tx.id)}
                      className="cursor-pointer hover:bg-[#dde8ff]"
                      style={{ background:rowBg }}>
                      <td className="px-1 py-0.5 font-mono text-[10px] text-black"
                        style={{ borderBottom:"1px solid #e0e0e0" }}>
                        {formatTimeISO(tx.time)}
                      </td>
                      <td className="px-1 py-0.5 font-mono text-[10px] font-bold text-[#000080]"
                        style={{ borderBottom:"1px solid #e0e0e0" }}>
                        {tx.txId}
                      </td>
                      <td className="px-1 py-0.5 font-mono text-[10px] text-black truncate"
                        style={{ borderBottom:"1px solid #e0e0e0" }}>
                        {tx.merchant}
                        {tx.email && (
                          <span className="text-[#808080]"> — {tx.email}</span>
                        )}
                      </td>
                      <td className="px-1 py-0.5 font-mono text-[10px] text-black text-right"
                        style={{ borderBottom:"1px solid #e0e0e0" }}>
                        {tx.amount.toLocaleString("en-EG",{minimumFractionDigits:2,maximumFractionDigits:2})}
                      </td>
                      <td className="px-1 py-0.5 font-mono text-[10px] font-bold"
                        style={{ borderBottom:"1px solid #e0e0e0", color:RISK_COLOR[tx.riskLevel] }}>
                        {tx.riskScore} {tx.riskLevel==="HIGH"?"▲":tx.riskLevel==="LOW"?"▼":"►"}
                      </td>
                      <td className="px-1 py-0.5" style={{ borderBottom:"1px solid #e0e0e0" }}>
                        <span className="font-mono text-[9px] font-bold px-1 py-0.5"
                          style={{ background:STATUS_BG[tx.status], color:STATUS_COLOR[tx.status],
                            border:`1px solid ${STATUS_COLOR[tx.status]}` }}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-1 py-0.5 text-center font-mono text-[10px] text-[#808080]"
                        style={{ borderBottom:"1px solid #e0e0e0" }}>
                        {isExpanded ? "▲" : "▼"}
                      </td>
                    </tr>,

                    /* Expanded detail row */
                    isExpanded && (
                      <tr key={`${tx.id}-detail`}>
                        <td colSpan={7} className="p-0">
                          <div className="bg-[#f0f0f0] p-3 flex flex-col gap-2"
                            style={{ borderTop:"2px solid #808080", borderBottom:"2px solid #808080" }}>

                            <div className="grid grid-cols-2 gap-3">
                              {/* Detail grid */}
                              <InsetPanel className="bg-white p-2">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                  {[
                                    ["TX ID",       tx.txId],
                                    ["Merchant",    tx.merchant],
                                    ["Amount",      `EGP ${tx.amount.toFixed(2)}`],
                                    ["Risk Score",  `${tx.riskScore} / 100`],
                                    ["Status",      tx.status],
                                    ["IP",          tx.ip      ?? "—"],
                                    ["Email",       tx.email   ?? "—"],
                                    ["Phone",       tx.phone   ?? "—"],
                                    ["Card Last 4", tx.cardLast4 ? `•••• ${tx.cardLast4}` : "—"],
                                    ["Country",     tx.country ?? "—"],
                                    ["Device",      tx.device  ?? "—"],
                                    ["Time",        formatTimeISO(tx.time)],
                                  ].map(([k, v]) => (
                                    <div key={k as string} className="flex gap-1">
                                      <span className="font-mono text-[10px] text-[#555] shrink-0 w-20">{k}:</span>
                                      <span className="font-mono text-[10px] text-black font-bold">{v}</span>
                                    </div>
                                  ))}
                                </div>
                              </InsetPanel>

                              {/* AEGIS terminal analysis */}
                              <InsetPanel className="bg-black p-2 flex flex-col gap-1">
                                <div className="text-[9px] font-mono text-[#00cc00] font-bold mb-1">
                                  ▶ AEGIS ANALYSIS
                                </div>
                                <div className="text-[10px] font-mono text-[#00ff00] leading-relaxed">
                                  {tx.notes || "No analysis notes available."}
                                </div>
                                <div className="mt-auto pt-2 text-[9px] font-mono text-[#006600]"
                                  style={{ borderTop:"1px solid #003300" }}>
                                  {`{ "txId":"${tx.txId}", "risk":${tx.riskScore}, "status":"${tx.status}" }`}
                                </div>
                              </InsetPanel>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-1 items-center">
                              <span className="font-mono text-[10px] text-black font-bold mr-1">ACTIONS:</span>
                              {[
                                { label:"🚫 Block IP",             show: true },
                                { label:"📞 Contact Customer",     show: true },
                                { label:"🏪 Contact Merchant",     show: true },
                                { label:"⛔ Stop Order",           show: tx.status !== "NORMAL" },
                                { label:"🚩 Flag for Review",      show: tx.status !== "REVIEW" },
                                { label:"🚔 Report to Authorities",show: tx.status === "FRAUD"  },
                              ].filter((a) => a.show).map(({ label }) => (
                                <W95Button key={label} className="!text-[9px] !px-1.5 !py-px">
                                  {label}
                                </W95Button>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Recommendations sidebar ── */}
        <RecommendationsPanel filtered={filtered} />
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          table, table * { visibility: visible; }
          table { position: absolute; top: 0; left: 0; width: 100%; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}