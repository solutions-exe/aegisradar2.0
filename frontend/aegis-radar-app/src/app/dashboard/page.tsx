"use client";

/**
 * src/app/dashboard/page.tsx
 *
 * Live transaction monitor — the main content area only.
 * The Win95 shell (taskbar, window chrome, sidebar) is provided by layout.tsx.
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = "HIGH" | "MEDIUM" | "LOW";
type TxStatus = "FRAUD" | "NORMAL";
type FilterType = "ALL" | "FRAUD" | "LEGITIMATE";

interface Transaction {
  id: string;
  time: string;
  txCode: string;
  merchant: string;
  amount: number;
  risk: RiskLevel;
  status: TxStatus;
  raw: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MERCHANTS = [
  "Amazon Egypt",
  "Carrefour Cairo",
  "Vodafone EG",
  "Etisalat Egypt",
  "B.TECH",
  "IKEA Egypt",
  "Jumia EG",
  "Metro Markets",
  "Noon.com",
  "Talabat",
  "CIB Bank",
  "NBE ATM",
  "Banque Misr",
  "WE Telecom",
  "Orange EG",
  "Shell Egypt",
  "Total Energies",
  "McDonald's EG",
  "Hardee's Cairo",
  "Spinney's EG",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad2 = (n: number) => String(n).padStart(2, "0");
const nowTime = () => {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)];

const generateTx = (): Transaction => {
  const risk: RiskLevel = pick(["HIGH", "HIGH", "MEDIUM", "LOW", "LOW", "LOW"]);
  const status: TxStatus =
    risk === "HIGH" && Math.random() > 0.3
      ? "FRAUD"
      : risk === "MEDIUM" && Math.random() > 0.7
        ? "FRAUD"
        : "NORMAL";
  const amount = parseFloat((Math.random() * 4900 + 100).toFixed(2));
  const merchant = pick(MERCHANTS);
  const txCode = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const time = nowTime();
  const riskTag = `RISK: ${risk}`;
  const arrow = status === "FRAUD" ? "→ ⚠ FRAUD" : "→ ✓ NORMAL";
  const raw = `[${time}] ${txCode} | ${merchant.padEnd(18)} | EGP ${String(
    amount.toFixed(2)
  ).padStart(8)} | ${riskTag} ${arrow}`;
  return { id: `${Date.now()}-${Math.random()}`, time, txCode, merchant, amount, risk, status, raw };
};

// ─── Primitive components (scoped to this page) ───────────────────────────────

/** Classic W95 raised/pressed button */
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
      className={`select-none cursor-pointer px-3 py-1 font-mono text-xs text-black bg-[#c0c0c0] focus:outline-dotted focus:outline-1 focus:outline-black focus:outline-offset-[-3px] ${className}`}
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

/** Win95 title bar strip */
function TitleBar({ title, active = true }: { title: string; active?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-2 py-1 select-none shrink-0"
      style={{
        background: active
          ? "linear-gradient(to right, #000080, #1084d0)"
          : "#808080",
      }}
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

/** Sunken inset panel with black background */
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
      className={`bg-black ${className}`}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Seed on mount
  useEffect(() => {
    setTransactions(Array.from({ length: 18 }, generateTx));
  }, []);

  // Live feed — recursive setTimeout for natural variance
  const startFeed = useCallback(() => {
    const schedule = () => {
      timeoutRef.current = setTimeout(() => {
        setTransactions((prev) => [generateTx(), ...prev].slice(0, 200));
        schedule();
      }, randInt(700, 1000));
    };
    schedule();
  }, []);

  useEffect(() => {
    if (isRunning) startFeed();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isRunning, startFeed]);

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 530);
    return () => clearInterval(id);
  }, []);

  // Keep newest entry at top
  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = 0;
  }, [transactions.length]);

  // Derived values
  const filtered = transactions.filter((tx) => {
    if (filter === "FRAUD") return tx.status === "FRAUD";
    if (filter === "LEGITIMATE") return tx.status === "NORMAL";
    return true;
  });
  const fraudCount = transactions.filter((t) => t.status === "FRAUD").length;
  const totalCount = transactions.length;
  const fraudRate =
    totalCount > 0 ? ((fraudCount / totalCount) * 100).toFixed(1) : "0.0";

  const lineColor = (tx: Transaction) => {
    if (tx.status === "FRAUD") return "#ff4444";
    if (tx.risk === "MEDIUM") return "#ffaa00";
    return "#00ff00";
  };

  return (
    /*
     * This div fills whatever space layout.tsx gives us.
     * overflow-hidden + flex-col lets the terminal grow to fill
     * available height without ever pushing outside the parent chrome.
     */
    <div
      className="flex flex-col"
      style={{ fontFamily: "'Courier New', Courier, monospace" }}
    >
      {/* ── Filter toolbar ── */}
      <div
        className="flex items-center gap-2 p-2 shrink-0"
        style={{
          background: "#c0c0c0",
          borderBottom: "2px solid #808080",
        }}
      >
        <span className="text-xs font-mono text-black font-bold mr-1">
          FILTER:
        </span>

        {(["ALL", "FRAUD", "LEGITIMATE"] as FilterType[]).map((f) => (
          <W95Button
            key={f}
            active={filter === f}
            onClick={() => setFilter(f)}
            className="!text-[11px]"
          >
            {f === "ALL" && "📋 "}
            {f === "FRAUD" && "⚠ "}
            {f === "LEGITIMATE" && "✓ "}
            {f} TRANSACTIONS
          </W95Button>
        ))}

        <div className="flex-1" />

        <W95Button onClick={() => setIsRunning((r) => !r)} className="!text-[11px]">
          {isRunning ? "■ PAUSE" : "▶ RESUME"}
        </W95Button>
        <W95Button onClick={() => setTransactions([])} className="!text-[11px]">
          🗑 CLEAR
        </W95Button>
      </div>

      {/* ── Terminal + stats ── */}
      <div className="flex flex-col p-2 gap-2">

        {/* Terminal chrome — fixed height, never grows */}
        <div className="flex flex-col" style={{ height: "420px" }}>
          <TitleBar
            title="C:\AEGISRADAR\monitor.exe — Live Feed"
            active={isRunning}
          />

          {/* InsetPanel is also fixed-height; inner div scrolls */}
          <InsetPanel className="flex flex-col overflow-hidden" style={{ height: "calc(100% - 26px)" }}>
            {/* Command prompt header */}
            <div
              className="text-[11px] font-mono px-2 py-1 shrink-0 border-b border-[#004400]"
              style={{ color: "#00ff00" }}
            >
              C:\AEGISRADAR&gt; monitor --live --filter={filter} --feed=ACTIVE
            </div>

            {/* Scrollable log — fixed height inherited from parent, scrolls internally */}
            <div
              ref={terminalRef}
              className="flex-1 overflow-y-auto px-2 py-1"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#004400 #000",
              }}
            >
              {filtered.length === 0 && (
                <div className="text-[#004400] text-xs font-mono pt-4 text-center">
                  — NO TRANSACTIONS MATCH CURRENT FILTER —
                </div>
              )}

              {filtered.map((tx, i) => (
                <div
                  key={tx.id}
                  className="text-[11px] font-mono leading-relaxed whitespace-pre"
                  style={{
                    color: lineColor(tx),
                    opacity: i === 0 ? 1 : Math.max(0.5, 1 - i * 0.012),
                    textShadow:
                      tx.status === "FRAUD"
                        ? "0 0 6px #ff0000"
                        : "0 0 4px #00ff00",
                    animation: i === 0 ? "fadeIn 0.3s ease" : undefined,
                  }}
                >
                  {tx.raw}
                </div>
              ))}

              {/* Blinking block cursor */}
              <div
                className="text-[11px] font-mono"
                style={{ color: "#00ff00" }}
              >
                C:\FRAUDGUARD&gt;{" "}
                <span
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "14px",
                    background: "#00ff00",
                    verticalAlign: "middle",
                    opacity: tick % 2 === 0 ? 1 : 0,
                    boxShadow: "0 0 4px #00ff00",
                  }}
                />
              </div>
            </div>
          </InsetPanel>
        </div>

        {/* ── Stats row (always visible at the bottom) ── */}
        <div className="grid grid-cols-4 gap-2 shrink-0">
          {[
            {
              label: "TOTAL TX",
              value: totalCount,
              color: "#00ff00",
            },
            {
              label: "FRAUD DETECTED",
              value: fraudCount,
              color: "#ff4444",
            },
            {
              label: "FRAUD RATE",
              value: `${fraudRate}%`,
              color: parseFloat(fraudRate) > 20 ? "#ff4444" : "#ffaa00",
            },
            {
              label: "FEED STATUS",
              value: isRunning ? "LIVE ▶" : "PAUSED",
              color: isRunning ? "#00ff00" : "#808080",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-2"
              style={{
                background: "#c0c0c0",
                borderStyle: "solid",
                borderWidth: "2px",
                borderColor: "#808080 white white #808080",
              }}
            >
              <InsetPanel className="p-2 text-center">
                <div
                  className="text-lg font-mono font-bold"
                  style={{
                    color: stat.color,
                    textShadow: `0 0 6px ${stat.color}`,
                  }}
                >
                  {stat.value}
                </div>
                <div className="text-[9px] font-mono text-[#007700] mt-0.5">
                  {stat.label}
                </div>
              </InsetPanel>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}