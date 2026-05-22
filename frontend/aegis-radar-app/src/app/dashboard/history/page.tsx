"use client";

/**
 * src/app/dashboard/history/page.tsx
 *
 * AEGIS RADAR — Transaction History page.
 * Full audit log with advanced filters, sortable table, expandable row details,
 * per-row action buttons, a dynamic recommendations panel, and CSV/print export.
 *
 * Lives inside layout.tsx (Win95 shell + sidebar). Fully self-contained.
 */

import { useState, useMemo, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type TxStatus   = "FRAUD" | "NORMAL" | "REVIEW";
type RiskLevel  = "HIGH"  | "MEDIUM" | "LOW";
type DeviceType = "Mobile" | "Desktop" | "Tablet" | "POS";
type SortDir    = "asc" | "desc";
type DateRange  = "today" | "7d" | "30d" | "custom";

type SortKey = "time" | "txId" | "merchant" | "amount" | "riskScore" | "status";

interface Transaction {
  id:         string;
  time:       string;        // ISO-ish datetime string
  txId:       string;
  customerId: string;
  merchant:   string;
  amount:     number;        // EGP
  country:    string;
  device:     DeviceType;
  riskScore:  number;        // 0–100
  riskLevel:  RiskLevel;
  status:     TxStatus;
  ip:         string;
  email:      string;
  phone:      string;
  cardLast4:  string;
  notes:      string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAKE DATA GENERATION  (50+ realistic Egyptian e-commerce transactions)
// ═══════════════════════════════════════════════════════════════════════════════

const MERCHANTS_LIST = [
  "Jumia EG", "Noon.com", "B.TECH", "Talabat", "Carrefour Cairo",
  "Vodafone EG", "Etisalat Egypt", "Amazon Egypt", "IKEA Egypt",
  "Metro Markets", "Spinney's EG", "Orange EG", "CIB Bank",
  "Banque Misr", "NBE ATM", "WE Telecom", "McDonald's EG",
  "Hardee's Cairo", "Total Energies", "Shell Egypt",
];

const COUNTRIES_LIST = [
  "Egypt", "Egypt", "Egypt", "Egypt", "Egypt", "Egypt",
  "Saudi Arabia", "UAE", "Nigeria", "Turkey", "Germany",
];

const NOTES_BY_STATUS: Record<TxStatus, string[]> = {
  FRAUD: [
    "Card-testing pattern detected — 12 micro-txns in 8 min",
    "IP matches known fraud proxy (AS49453)",
    "Device fingerprint flagged in 3 prior fraud events",
    "Velocity breach: 18 txns/hr from same BIN",
    "SIM-swap detected 22 min before transaction",
    "Billing address mismatch with issuer records",
  ],
  REVIEW: [
    "New device + new country combination",
    "High-value first-time transaction",
    "Shipping address differs from billing",
    "Slight behavioral deviation — awaiting 2FA confirmation",
    "Merchant category elevated risk (electronics)",
  ],
  NORMAL: [
    "Transaction within expected profile",
    "Returning customer — 14 prior clean txns",
    "3D Secure authenticated",
    "Device fingerprint matches prior sessions",
    "Amount within daily average ± 1σ",
  ],
};

/** Deterministic "random" from a seed so data is stable between renders */
function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function buildTransactions(): Transaction[] {
  const rand = seededRand(42);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

  const now = new Date("2025-05-17T10:00:00");
  const rows: Transaction[] = [];

  for (let i = 0; i < 55; i++) {
    const minsAgo   = Math.floor(rand() * 43200); // up to 30 days
    const dt        = new Date(now.getTime() - minsAgo * 60000);
    const riskScore = Math.floor(rand() * 100);
    const riskLevel: RiskLevel =
      riskScore >= 70 ? "HIGH" : riskScore >= 40 ? "MEDIUM" : "LOW";
    const status: TxStatus =
      riskScore >= 75 && rand() > 0.3
        ? "FRAUD"
        : riskScore >= 45 && rand() > 0.6
          ? "REVIEW"
          : "NORMAL";
    const country = pick(COUNTRIES_LIST);
    const merchant = pick(MERCHANTS_LIST);
    const amount   = parseFloat((rand() * 9800 + 50).toFixed(2));

    const p2 = (n: number) => String(n).padStart(2, "0");
    const timeStr = `${dt.getFullYear()}-${p2(dt.getMonth() + 1)}-${p2(dt.getDate())} ${p2(dt.getHours())}:${p2(dt.getMinutes())}`;

    rows.push({
      id:         `row-${i}`,
      time:       timeStr,
      txId:       `TX-${Math.floor(rand() * 900000 + 100000).toString(36).toUpperCase().slice(0, 7)}`,
      customerId: `CUS-${Math.floor(rand() * 90000 + 10000)}`,
      merchant,
      amount,
      country,
      device:     pick<DeviceType>(["Mobile", "Desktop", "Tablet", "POS"]),
      riskScore,
      riskLevel,
      status,
      ip:         `${Math.floor(rand()*223+1)}.${Math.floor(rand()*254)}.${Math.floor(rand()*254)}.${Math.floor(rand()*254)}`,
      email:      `user${Math.floor(rand()*9000+1000)}@${pick(["gmail.com","yahoo.com","hotmail.com","outlook.com"])}`,
      phone:      `+20 10${Math.floor(rand()*9000+1000)} ${Math.floor(rand()*9000+1000)}`,
      cardLast4:  String(Math.floor(rand() * 9000 + 1000)),
      notes:      pick(NOTES_BY_STATUS[status]),
    });
  }

  // Sort newest first
  return rows.sort((a, b) => b.time.localeCompare(a.time));
}

const SEED_TRANSACTIONS: Transaction[] = buildTransactions();
const ALL_MERCHANTS = [...new Set(SEED_TRANSACTIONS.map((t) => t.merchant))].sort();
const ALL_COUNTRIES = [...new Set(SEED_TRANSACTIONS.map((t) => t.country))].sort();

/** Generate `count` brand-new transactions stamped right now (non-deterministic). */
function generateFreshTxns(count: number, existingCount: number): Transaction[] {
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  const p2   = (n: number) => String(n).padStart(2, "0");
  const rows: Transaction[] = [];

  for (let i = 0; i < count; i++) {
    const now     = new Date();
    // Spread arrivals over the last 0–3 minutes so they look like a live burst
    const secsAgo = Math.floor(Math.random() * 180);
    const dt      = new Date(now.getTime() - secsAgo * 1000);
    const timeStr = `${dt.getFullYear()}-${p2(dt.getMonth()+1)}-${p2(dt.getDate())} ${p2(dt.getHours())}:${p2(dt.getMinutes())}`;
    const riskScore = Math.floor(Math.random() * 100);
    const riskLevel: RiskLevel =
      riskScore >= 70 ? "HIGH" : riskScore >= 40 ? "MEDIUM" : "LOW";
    const status: TxStatus =
      riskScore >= 75 && Math.random() > 0.3 ? "FRAUD" :
      riskScore >= 45 && Math.random() > 0.6 ? "REVIEW" : "NORMAL";

    rows.push({
      id:         `fresh-${existingCount + i}-${Date.now()}`,
      time:       timeStr,
      txId:       `TX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      customerId: `CUS-${Math.floor(Math.random() * 90000 + 10000)}`,
      merchant:   pick(MERCHANTS_LIST),
      amount:     parseFloat((Math.random() * 9800 + 50).toFixed(2)),
      country:    pick(COUNTRIES_LIST),
      device:     pick<DeviceType>(["Mobile", "Desktop", "Tablet", "POS"]),
      riskScore,
      riskLevel,
      status,
      ip:         `${Math.floor(Math.random()*223+1)}.${Math.floor(Math.random()*254)}.${Math.floor(Math.random()*254)}.${Math.floor(Math.random()*254)}`,
      email:      `user${Math.floor(Math.random()*9000+1000)}@${pick(["gmail.com","yahoo.com","hotmail.com","outlook.com"])}`,
      phone:      `+20 10${Math.floor(Math.random()*9000+1000)} ${Math.floor(Math.random()*9000+1000)}`,
      cardLast4:  String(Math.floor(Math.random() * 9000 + 1000)),
      notes:      pick(NOTES_BY_STATUS[status]),
    });
  }

  return rows;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIN95 PRIMITIVE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const MONO: React.CSSProperties = { fontFamily: "'Courier New', Courier, monospace" };

function W95Button({
  children, active, onClick, className = "", title, style,
}: {
  children: React.ReactNode; active?: boolean; onClick?: () => void;
  className?: string; title?: string; style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`select-none cursor-pointer px-2 py-0.5 text-black bg-[#c0c0c0]
        focus:outline-dotted focus:outline-1 focus:outline-black text-xs ${className}`}
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

function TitleBar({ title }: { title: string }) {
  return (
    <div
      className="flex items-center justify-between px-2 py-0.5 select-none shrink-0"
      style={{ background: "linear-gradient(to right,#000080,#1084d0)" }}
    >
      <span className="text-white text-xs font-bold tracking-wide truncate mr-2" style={MONO}>
        {title}
      </span>
      <div className="flex gap-1 shrink-0">
        {["_","□","✕"].map((b) => (
          <W95Button key={b} className="!text-[10px] !px-1 !py-0 leading-none">{b}</W95Button>
        ))}
      </div>
    </div>
  );
}

function Panel({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`bg-[#c0c0c0] ${className}`}
      style={{ borderStyle:"solid", borderWidth:"2px", borderColor:"white white #808080 #808080", ...style }}>
      {children}
    </div>
  );
}

function InsetPanel({
  children, className = "", style,
}: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`${className}`}
      style={{ borderStyle:"solid", borderWidth:"2px",
        borderColor:"#808080 white white #808080", ...style }}>
      {children}
    </div>
  );
}

/** Win95-style select / dropdown */
function W95Select({
  value, onChange, options, className = "",
}: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-white text-black text-xs px-1 py-0.5 ${className}`}
      style={{ ...MONO, borderStyle:"solid", borderWidth:"2px",
        borderColor:"#808080 white white #808080", outline:"none" }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/** Win95-style text input */
function W95Input({
  value, onChange, placeholder = "", className = "",
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-white text-black text-xs px-1 py-0.5 ${className}`}
      style={{ ...MONO, borderStyle:"solid", borderWidth:"2px",
        borderColor:"#808080 white white #808080", outline:"none" }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLOUR HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_COLOR: Record<TxStatus, string>  = { FRAUD:"#cc0000", NORMAL:"#006600", REVIEW:"#cc7700" };
const STATUS_BG:    Record<TxStatus, string>  = { FRAUD:"#ffdddd", NORMAL:"#ddffdd", REVIEW:"#fff3cc" };
const RISK_COLOR:   Record<RiskLevel, string> = { HIGH:"#cc0000",  MEDIUM:"#cc7700",  LOW:"#006600"   };

// ═══════════════════════════════════════════════════════════════════════════════
// FILTER STATE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

interface Filters {
  dateRange:  DateRange;
  status:     "" | TxStatus;
  riskLevel:  "" | RiskLevel;
  country:    string;
  merchant:   string;
  search:     string;
}

const DEFAULT_FILTERS: Filters = {
  dateRange: "30d", status: "", riskLevel: "", country: "", merchant: "", search: "",
};

function applyFilters(txns: Transaction[], f: Filters): Transaction[] {
  const now = new Date("2025-05-17T10:00:00");

  return txns.filter((tx) => {
    // Date range
    const txDate = new Date(tx.time);
    const diffMs = now.getTime() - txDate.getTime();
    const diffDays = diffMs / 86400000;
    if (f.dateRange === "today"  && diffDays > 1)   return false;
    if (f.dateRange === "7d"     && diffDays > 7)   return false;
    if (f.dateRange === "30d"    && diffDays > 30)  return false;

    if (f.status    && tx.status    !== f.status)    return false;
    if (f.riskLevel && tx.riskLevel !== f.riskLevel) return false;
    if (f.country   && tx.country   !== f.country)   return false;
    if (f.merchant  && tx.merchant  !== f.merchant)  return false;

    if (f.search) {
      const q = f.search.toLowerCase();
      if (!tx.txId.toLowerCase().includes(q) &&
          !tx.customerId.toLowerCase().includes(q) &&
          !tx.email.toLowerCase().includes(q)) return false;
    }

    return true;
  });
}

function sortTxns(txns: Transaction[], key: SortKey, dir: SortDir): Transaction[] {
  return [...txns].sort((a, b) => {
    let av: string | number = a[key];
    let bv: string | number = b[key];
    if (key === "amount" || key === "riskScore") {
      av = Number(av); bv = Number(bv);
    } else {
      av = String(av); bv = String(bv);
    }
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECOMMENDATIONS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

interface Rec { icon: string; priority: "!" | "!!" | "!!!"; text: string }

function buildRecommendations(filtered: Transaction[]): Rec[] {
  const recs: Rec[] = [];
  const fraudTxns   = filtered.filter((t) => t.status === "FRAUD");
  const reviewTxns  = filtered.filter((t) => t.status === "REVIEW");
  const nigeriaTxns = filtered.filter((t) => t.country === "Nigeria");

  if (nigeriaTxns.length > 0)
    recs.push({ icon:"🚨", priority:"!!!", text:`Block all transactions from Nigeria (${nigeriaTxns.length} flagged in current view)` });

  const highAmountFraud = fraudTxns.filter((t) => t.amount > 5000);
  if (highAmountFraud.length > 0)
    recs.push({ icon:"💳", priority:"!!!", text:`${highAmountFraud.length} fraud txns exceed EGP 5,000 — report to CIB fraud desk immediately` });

  const cardTestMerchants = [...new Set(fraudTxns.map((t) => t.merchant))];
  if (cardTestMerchants.length > 0)
    recs.push({ icon:"🏪", priority:"!!", text:`Enable 3D Secure for: ${cardTestMerchants.slice(0,3).join(", ")}` });

  if (reviewTxns.length > 5)
    recs.push({ icon:"👁", priority:"!!", text:`${reviewTxns.length} transactions pending manual review — assign to analyst queue` });

  const mobileRisk = filtered.filter((t) => t.device === "Mobile" && t.riskLevel === "HIGH");
  if (mobileRisk.length > 3)
    recs.push({ icon:"📱", priority:"!!", text:`${mobileRisk.length} high-risk mobile txns — enforce device fingerprint step-up auth` });

  const uniqueIPs = new Set(fraudTxns.map((t) => t.ip));
  if (uniqueIPs.size > 0)
    recs.push({ icon:"🌐", priority:"!!!", text:`Block ${uniqueIPs.size} IPs associated with fraud — add to blocklist` });

  recs.push({ icon:"📋", priority:"!", text:"Schedule weekly transaction audit review with compliance team" });
  recs.push({ icon:"🔒", priority:"!", text:"Enforce 2-FA for all accounts with txn velocity > 5/hr" });
  recs.push({ icon:"📊", priority:"!", text:"Request chargeback report from payment gateway for last 30 days" });

  return recs.slice(0, 8);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSV EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

function exportCSV(rows: Transaction[]) {
  const headers = ["Time","TX ID","Customer ID","Merchant","Amount (EGP)","Country","Device","Risk Score","Risk Level","Status","IP","Email","Phone","Card Last 4","Notes"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [r.time, r.txId, r.customerId, `"${r.merchant}"`, r.amount.toFixed(2),
       r.country, r.device, r.riskScore, r.riskLevel, r.status,
       r.ip, r.email, r.phone, r.cardLast4, `"${r.notes}"`].join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "aegis-radar-transactions.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTION MODAL
// ═══════════════════════════════════════════════════════════════════════════════

interface ActionModal { tx: Transaction; action: string }

function ActionDialog({ modal, onClose }: { modal: ActionModal; onClose: () => void }) {
  const { tx, action } = modal;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="flex flex-col" style={{ width:"420px",
        background:"#c0c0c0", borderStyle:"solid", borderWidth:"2px",
        borderColor:"white white #808080 #808080", boxShadow:"4px 4px 0 #000" }}>
        <TitleBar title={`AEGIS RADAR — ${action}`} />
        <div className="p-4 flex flex-col gap-3">
          <InsetPanel className="bg-white p-2">
            <div className="text-xs font-mono text-black leading-relaxed">
              <div><b>TX ID:</b>      {tx.txId}</div>
              <div><b>Customer:</b>   {tx.customerId} ({tx.email})</div>
              <div><b>Merchant:</b>   {tx.merchant}</div>
              <div><b>Amount:</b>     EGP {tx.amount.toFixed(2)}</div>
              <div><b>IP:</b>         {tx.ip}</div>
              <div><b>Phone:</b>      {tx.phone}</div>
            </div>
          </InsetPanel>
          <div className="text-xs font-mono text-black font-bold">
            Confirm action: <span style={{ color: "#cc0000" }}>{action}</span>?
          </div>
          <div className="text-[10px] font-mono text-[#555]">
            This action will be logged in the AEGIS audit trail with your credentials and timestamp.
          </div>
          <div className="flex gap-2 justify-end mt-1">
            <W95Button onClick={onClose} className="px-4">Cancel</W95Button>
            <W95Button
              onClick={onClose}
              className="px-4 !font-bold"
              style={{ background:"#000080", color:"white",
                borderColor:"white white #808080 #808080" } as React.CSSProperties}
            >
              ✓ Confirm
            </W95Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPANDED ROW DETAIL
// ═══════════════════════════════════════════════════════════════════════════════

function ExpandedRow({
  tx, onAction,
}: { tx: Transaction; onAction: (tx: Transaction, action: string) => void }) {
  const actions: { label: string; icon: string; show: boolean }[] = [
    { label: "Block IP",              icon: "🚫", show: true },
    { label: "Block Phone / Email",   icon: "📵", show: true },
    { label: "Contact Customer",      icon: "📞", show: true },
    { label: "Contact Merchant",      icon: "🏪", show: true },
    { label: "Stop Order",            icon: "⛔", show: tx.status !== "NORMAL" },
    { label: "Flag for Manual Review",icon: "🚩", show: tx.status !== "REVIEW" },
    { label: "Report to Authorities", icon: "🚔", show: tx.status === "FRAUD" },
  ].filter((a) => a.show);

  return (
    <tr>
      <td colSpan={10} className="p-0">
        <div className="bg-[#f0f0f0] p-3 flex flex-col gap-3"
          style={{ borderTop:"2px solid #808080", borderBottom:"2px solid #808080" }}>

          {/* Detail grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Left: core fields */}
            <InsetPanel className="bg-white p-2 col-span-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {[
                  ["TX ID",        tx.txId],
                  ["Customer ID",  tx.customerId],
                  ["Email",        tx.email],
                  ["Phone",        tx.phone],
                  ["Card Last 4",  `•••• •••• •••• ${tx.cardLast4}`],
                  ["IP Address",   tx.ip],
                  ["Country",      tx.country],
                  ["Device",       tx.device],
                  ["Merchant",     tx.merchant],
                  ["Amount",       `EGP ${tx.amount.toFixed(2)}`],
                  ["Risk Score",   `${tx.riskScore} / 100`],
                  ["Status",       tx.status],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-1">
                    <span className="font-mono text-[10px] text-[#555] shrink-0 w-24">{k}:</span>
                    <span className="font-mono text-[10px] text-black font-bold">{v}</span>
                  </div>
                ))}
              </div>
            </InsetPanel>

            {/* Right: notes + raw JSON hint */}
            <InsetPanel className="bg-black p-2 flex flex-col gap-1">
              <div className="text-[9px] font-mono text-[#00cc00] font-bold mb-1">
                ▶ AEGIS ANALYSIS
              </div>
              <div className="text-[10px] font-mono text-[#00ff00] leading-relaxed">
                {tx.notes}
              </div>
              <div className="mt-auto pt-2 text-[9px] font-mono text-[#006600] border-t border-[#003300]">
                {`{ "txId":"${tx.txId}", "risk":${tx.riskScore}, "model":"v4.2.1-EG" }`}
              </div>
            </InsetPanel>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-1 items-center">
            <span className="font-mono text-[10px] text-black font-bold mr-1">ACTIONS:</span>
            {actions.map(({ label, icon }) => (
              <W95Button
                key={label}
                onClick={() => onAction(tx, label)}
                className="!text-[10px] !px-2"
              >
                {icon} {label}
              </W95Button>
            ))}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECOMMENDATIONS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

function RecommendationsPanel({ filtered }: { filtered: Transaction[] }) {
  const recs = useMemo(() => buildRecommendations(filtered), [filtered]);
  const PRIO_COLOR = { "!!!": "#cc0000", "!!": "#cc7700", "!": "#006600" };

  return (
    <div className="flex flex-col shrink-0" style={{ width: "280px" }}>
      <TitleBar title="⚡ Live Recommendations" />
      <Panel className="flex-1 p-2 flex flex-col gap-1 overflow-y-auto" style={{ maxHeight:"320px" }}>
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

      {/* Best practices */}
      <div className="mt-2 flex flex-col">
        <TitleBar title="📋 Best Practices" />
        <Panel className="p-2">
          {[
            "Review all FRAUD txns within 4 hrs",
            "Never re-use blocked card BINs",
            "Run weekly velocity audits",
            "Store chargeback evidence ≥18 mo",
            "Test rules in shadow mode first",
          ].map((bp, i) => (
            <div key={i} className="font-mono text-[9px] text-black py-0.5 flex gap-1"
              style={{ borderBottom: i < 4 ? "1px solid #d0d0d0":"none" }}>
              <span className="text-[#008800]">►</span> {bp}
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SORT HEADER CELL
// ═══════════════════════════════════════════════════════════════════════════════

function SortTh({
  col, label, sortKey, sortDir, onSort, style,
}: {
  col: SortKey; label: string; sortKey: SortKey; sortDir: SortDir;
  onSort: (k: SortKey) => void; style?: React.CSSProperties;
}) {
  const active = sortKey === col;
  return (
    <th
      className="px-1 py-0.5 text-left font-mono text-[10px] font-bold cursor-pointer select-none
        bg-[#c0c0c0] text-black hover:bg-[#d4d4d4]"
      style={{
        borderStyle:"solid", borderWidth:"1px",
        borderColor: active ? "#808080 white white #808080" : "white white #808080 #808080",
        whiteSpace: "nowrap", ...style,
      }}
      onClick={() => onSort(col)}
    >
      {label} {active ? (sortDir === "asc" ? "▲" : "▼") : ""}
    </th>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function HistoryPage() {
  // ── Filter state ────────────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<Transaction[]>(SEED_TRANSACTIONS);
  const [filters,    setFilters]    = useState<Filters>(DEFAULT_FILTERS);
  const [sortKey,    setSortKey]    = useState<SortKey>("time");
  const [sortDir,    setSortDir]    = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionModal,setActionModal]= useState<ActionModal | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newCount,   setNewCount]   = useState(0); // banner: how many rows just added

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filtered = useMemo(
    () => applyFilters(transactions, filters),
    [transactions, filters],
  );
  const sorted = useMemo(
    () => sortTxns(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir],
  );

  // ── Stats bar ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:  filtered.length,
    fraud:  filtered.filter((t) => t.status === "FRAUD").length,
    review: filtered.filter((t) => t.status === "REVIEW").length,
    normal: filtered.filter((t) => t.status === "NORMAL").length,
    totalEGP: filtered.reduce((s, t) => s + t.amount, 0),
  }), [filtered]);

  // ── Callbacks ────────────────────────────────────────────────────────────────
  const setFilter = useCallback(
    <K extends keyof Filters>(key: K, val: Filters[K]) =>
      setFilters((prev) => ({ ...prev, [key]: val })),
    [],
  );

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      setSortDir(prev === key ? (d: SortDir) => d === "asc" ? "desc" : "asc" : () => "asc");
      return key;
    });
    setSortDir((prev) => sortKey === key ? (prev === "asc" ? "desc" : "asc") : "asc");
    setSortKey(key);
  }, [sortKey]);

  const handleRowClick = useCallback((id: string) =>
    setExpandedId((prev) => prev === id ? null : id), []);

  const handleAction = useCallback((tx: Transaction, action: string) =>
    setActionModal({ tx, action }), []);

  // ── Refresh: generate 5–12 new transactions and prepend them ─────────────
  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    setNewCount(0);

    // Brief simulated network delay (400–900 ms) for authenticity
    const delay = 400 + Math.floor(Math.random() * 500);
    setTimeout(() => {
      const batch = 5 + Math.floor(Math.random() * 8); // 5–12 new rows
      setTransactions((prev) => {
        const fresh = generateFreshTxns(batch, prev.length);
        return [...fresh, ...prev];
      });
      setNewCount(batch);
      setExpandedId(null);                          // collapse any open row
      setFilters((prev) => ({ ...prev, dateRange: "today" })); // jump to Today view
      setRefreshing(false);

      // Hide the "N new" banner after 4 s
      setTimeout(() => setNewCount(0), 4000);
    }, delay);
  }, [refreshing]);

  return (
    <div className="flex flex-col h-full overflow-hidden"
      style={{ ...MONO, background: "#c0c0c0" }}>

      {/* ── Top toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 shrink-0"
        style={{ borderBottom:"2px solid #808080", background:"#c0c0c0" }}>

        {/* Date range */}
        <span className="text-[10px] font-mono font-bold text-black">DATE:</span>
        {(["today","7d","30d"] as const).map((r) => {
          const DATE_LABELS: Record<"today"|"7d"|"30d", string> = { today:"Today", "7d":"7 Days", "30d":"30 Days" };
          return (
            <W95Button key={r} active={filters.dateRange === r}
              onClick={() => setFilter("dateRange", r)}
              className="!text-[10px] !px-2">
              {DATE_LABELS[r]}
            </W95Button>
          );
        })}

        <div className="w-px h-4 bg-[#808080] mx-1" />

        {/* Status filter */}
        <span className="text-[10px] font-mono font-bold text-black">STATUS:</span>
        <W95Select value={filters.status} onChange={(v) => setFilter("status", v as Filters["status"])}
          options={[
            { value:"", label:"All" }, { value:"FRAUD", label:"Fraud" },
            { value:"NORMAL", label:"Normal" }, { value:"REVIEW", label:"Review" },
          ]} />

        {/* Risk filter */}
        <span className="text-[10px] font-mono font-bold text-black">RISK:</span>
        <W95Select value={filters.riskLevel} onChange={(v) => setFilter("riskLevel", v as Filters["riskLevel"])}
          options={[
            { value:"", label:"All" }, { value:"HIGH", label:"High" },
            { value:"MEDIUM", label:"Medium" }, { value:"LOW", label:"Low" },
          ]} />

        {/* Country filter */}
        <span className="text-[10px] font-mono font-bold text-black">COUNTRY:</span>
        <W95Select value={filters.country} onChange={(v) => setFilter("country", v)}
          options={[{ value:"", label:"All" }, ...ALL_COUNTRIES.map((c) => ({ value:c, label:c }))]} />

        {/* Merchant filter */}
        <span className="text-[10px] font-mono font-bold text-black">MERCHANT:</span>
        <W95Select value={filters.merchant} onChange={(v) => setFilter("merchant", v)}
          className="max-w-[130px]"
          options={[{ value:"", label:"All Merchants" }, ...ALL_MERCHANTS.map((m) => ({ value:m, label:m }))]} />

        <div className="w-px h-4 bg-[#808080] mx-1" />

        {/* Search */}
        <W95Input value={filters.search} onChange={(v) => setFilter("search", v)}
          placeholder="Search TX ID / Customer..." className="w-40" />

        <W95Button onClick={() => setFilters(DEFAULT_FILTERS)} className="!text-[10px]">
          ↺ Reset
        </W95Button>

        <div className="flex-1" />

        {/* Export */}
        <W95Button onClick={() => exportCSV(sorted)} className="!text-[10px]">
          💾 Export CSV
        </W95Button>
        <W95Button onClick={() => window.print()} className="!text-[10px]">
          🖨 Print
        </W95Button>

        <div className="w-px h-4 bg-[#808080] mx-1" />

        {/* Refresh */}
        <W95Button
          onClick={handleRefresh}
          className="!text-[10px] !font-bold"
          style={refreshing ? { borderColor:"#808080 #808080 white white" } : undefined}
          title="Fetch latest transactions"
        >
          {refreshing ? "⏳ Refreshing…" : "🔄 Refresh"}
        </W95Button>
      </div>

      {/* ── Stats bar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-2 py-1 shrink-0"
        style={{ borderBottom:"1px solid #808080", background:"#d8d8d8" }}>
        {[
          { label:"SHOWING",  val: sorted.length,                  col: "#000" },
          { label:"FRAUD",    val: stats.fraud,                    col: "#cc0000" },
          { label:"REVIEW",   val: stats.review,                   col: "#cc7700" },
          { label:"NORMAL",   val: stats.normal,                   col: "#006600" },
          { label:"TOTAL VOL",val: `EGP ${stats.totalEGP.toLocaleString("en-EG",{minimumFractionDigits:2,maximumFractionDigits:2})}`, col:"#000" },
          { label:"ALL RECORDS", val: transactions.length,         col: "#000" },
        ].map(({ label, val, col }) => (
          <div key={label} className="flex gap-1 items-baseline">
            <span className="font-mono text-[9px] text-[#555]">{label}:</span>
            <span className="font-mono text-[11px] font-bold" style={{ color:col }}>{val}</span>
          </div>
        ))}

        {/* Flash banner: appears for 4 s after a refresh */}
        {newCount > 0 && (
          <div
            className="ml-auto flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] font-bold"
            style={{
              background: "#000080", color: "#ffffff",
              borderStyle: "solid", borderWidth: "2px",
              borderColor: "white white #808080 #808080",
              animation: "fadeIn 0.2s ease",
            }}
          >
            ▲ {newCount} new transaction{newCount > 1 ? "s" : ""} loaded
          </div>
        )}
      </div>

      {/* ── Main body: table + sidebar ───────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 gap-2 p-2 overflow-hidden">

        {/* ── Transaction table ─────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          <TitleBar title={`Transaction History — ${sorted.length} records`} />
          <div className="flex-1 overflow-auto" style={{
            borderStyle:"solid", borderWidth:"2px",
            borderColor:"#808080 white white #808080",
            background:"white",
          }}>
            <table className="w-full border-collapse" style={{ tableLayout:"fixed", minWidth:"860px" }}>
              <colgroup>
                <col style={{ width:"130px" }} /> {/* Time */}
                <col style={{ width:"90px"  }} /> {/* TX ID */}
                <col style={{ width:"80px"  }} /> {/* Customer */}
                <col style={{ width:"120px" }} /> {/* Merchant */}
                <col style={{ width:"80px"  }} /> {/* Amount */}
                <col style={{ width:"70px"  }} /> {/* Country */}
                <col style={{ width:"65px"  }} /> {/* Device */}
                <col style={{ width:"60px"  }} /> {/* Risk */}
                <col style={{ width:"70px"  }} /> {/* Status */}
                <col style={{ width:"30px"  }} /> {/* Expand */}
              </colgroup>
              {/* Header */}
              <thead style={{ position:"sticky", top:0, zIndex:1 }}>
                <tr>
                  <SortTh col="time"      label="TIME"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="txId"      label="TX ID"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-1 py-0.5 text-left font-mono text-[10px] font-bold bg-[#c0c0c0] text-black"
                    style={{ borderStyle:"solid",borderWidth:"1px",borderColor:"white white #808080 #808080",whiteSpace:"nowrap" }}>
                    CUST ID
                  </th>
                  <SortTh col="merchant"  label="MERCHANT"  sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="amount"    label="AMT (EGP)" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-1 py-0.5 text-left font-mono text-[10px] font-bold bg-[#c0c0c0] text-black"
                    style={{ borderStyle:"solid",borderWidth:"1px",borderColor:"white white #808080 #808080",whiteSpace:"nowrap" }}>
                    COUNTRY
                  </th>
                  <th className="px-1 py-0.5 text-left font-mono text-[10px] font-bold bg-[#c0c0c0] text-black"
                    style={{ borderStyle:"solid",borderWidth:"1px",borderColor:"white white #808080 #808080",whiteSpace:"nowrap" }}>
                    DEVICE
                  </th>
                  <SortTh col="riskScore" label="RISK"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="status"    label="STATUS"    sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-1 py-0.5 font-mono text-[10px] font-bold bg-[#c0c0c0] text-black text-center"
                    style={{ borderStyle:"solid",borderWidth:"1px",borderColor:"white white #808080 #808080" }}>
                    ▼
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-8 font-mono text-xs text-[#808080]">
                      — No transactions match current filters —
                    </td>
                  </tr>
                )}
                {sorted.map((tx, i) => {
                  const isExpanded = expandedId === tx.id;
                  const rowBg = isExpanded
                    ? "#dde8ff"
                    : i % 2 === 0 ? "#ffffff" : "#f4f4f4";

                  return [
                    // Main row
                    <tr
                      key={tx.id}
                      onClick={() => handleRowClick(tx.id)}
                      className="cursor-pointer hover:bg-[#dde8ff]"
                      style={{ background: rowBg }}
                    >
                      {/* Time */}
                      <td className="px-1 py-0.5 font-mono text-[10px] text-black"
                        style={{ borderBottom:"1px solid #e0e0e0" }}>
                        {tx.time}
                      </td>
                      {/* TX ID */}
                      <td className="px-1 py-0.5 font-mono text-[10px] font-bold text-[#000080]"
                        style={{ borderBottom:"1px solid #e0e0e0" }}>
                        {tx.txId}
                      </td>
                      {/* Customer */}
                      <td className="px-1 py-0.5 font-mono text-[10px] text-[#444]"
                        style={{ borderBottom:"1px solid #e0e0e0" }}>
                        {tx.customerId}
                      </td>
                      {/* Merchant */}
                      <td className="px-1 py-0.5 font-mono text-[10px] text-black truncate"
                        style={{ borderBottom:"1px solid #e0e0e0" }}>
                        {tx.merchant}
                      </td>
                      {/* Amount */}
                      <td className="px-1 py-0.5 font-mono text-[10px] text-black text-right"
                        style={{ borderBottom:"1px solid #e0e0e0" }}>
                        {tx.amount.toLocaleString("en-EG",{minimumFractionDigits:2,maximumFractionDigits:2})}
                      </td>
                      {/* Country */}
                      <td className="px-1 py-0.5 font-mono text-[10px] text-black"
                        style={{ borderBottom:"1px solid #e0e0e0" }}>
                        {tx.country}
                      </td>
                      {/* Device */}
                      <td className="px-1 py-0.5 font-mono text-[10px] text-black"
                        style={{ borderBottom:"1px solid #e0e0e0" }}>
                        {tx.device}
                      </td>
                      {/* Risk score */}
                      <td className="px-1 py-0.5 font-mono text-[10px] font-bold"
                        style={{ borderBottom:"1px solid #e0e0e0", color:RISK_COLOR[tx.riskLevel] }}>
                        {tx.riskScore} {tx.riskLevel === "HIGH" ? "▲" : tx.riskLevel === "LOW" ? "▼" : "►"}
                      </td>
                      {/* Status badge */}
                      <td className="px-1 py-0.5" style={{ borderBottom:"1px solid #e0e0e0" }}>
                        <span className="font-mono text-[9px] font-bold px-1 py-0.5"
                          style={{ background:STATUS_BG[tx.status], color:STATUS_COLOR[tx.status],
                            border:`1px solid ${STATUS_COLOR[tx.status]}` }}>
                          {tx.status}
                        </span>
                      </td>
                      {/* Expand toggle */}
                      <td className="px-1 py-0.5 text-center font-mono text-[10px] text-[#808080]"
                        style={{ borderBottom:"1px solid #e0e0e0" }}>
                        {isExpanded ? "▲" : "▼"}
                      </td>
                    </tr>,

                    // Expanded detail row
                    isExpanded && (
                      <ExpandedRow key={`${tx.id}-detail`} tx={tx} onAction={handleAction} />
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right sidebar: recommendations ─────────────────────────────────── */}
        <RecommendationsPanel filtered={filtered} />
      </div>

      {/* ── Action confirmation modal ─────────────────────────────────────────── */}
      {actionModal && (
        <ActionDialog modal={actionModal} onClose={() => setActionModal(null)} />
      )}

      {/* ── Print styles ─────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media print {
          body * { visibility: hidden; }
          table, table * { visibility: visible; }
          table { position: absolute; top: 0; left: 0; width: 100%; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
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