"use client";

/**
 * src/app/dashboard/page.tsx
 *
 * Live transaction monitor — connected to real FastAPI backend with ML model
 * The Win95 shell (taskbar, window chrome, sidebar) is provided by layout.tsx.
 */

import { useState, useEffect, useRef } from "react";
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// ─── Real Backend Transaction Schema ───────────────────────────────────────
interface Transaction {
  transaction_id: string;
  merchant: string;
  amount: number;
  timestamp?: string;
  risk_score: number;
  is_fraud: boolean;
  confidence: number;
  model_version: string;
}

// ─── Primitive components (Win95 style) ─────────────────────────────────────

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
      }}
    >
      {children}
    </button>
  );
}

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

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "FRAUD" | "LEGITIMATE">("ALL");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const loadTransactions = async () => {
    try {
      const res = await fetch(`${API_BASE}/transactions?limit=200`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: Transaction[] = await res.json();
      setTransactions(data);
      setIsConnected(true);
      setErrorMessage(null);
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setErrorMessage("Unable to connect to backend transaction feed.");
      setIsConnected(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(loadTransactions, 2500);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = 0;
    }
  }, [transactions]);

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    if (filter === "FRAUD") return tx.is_fraud;
    if (filter === "LEGITIMATE") return !tx.is_fraud;
    return true;
  });

  const fraudCount = transactions.filter((t) => t.is_fraud).length;
  const totalCount = transactions.length;
  const fraudRate = totalCount > 0 ? ((fraudCount / totalCount) * 100).toFixed(1) : "0.0";

  return (
    <div className="flex flex-col" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
      {/* Filter Toolbar */}
      <div
        className="flex items-center gap-2 p-2 shrink-0"
        style={{ background: "#c0c0c0", borderBottom: "2px solid #808080" }}
      >
        <span className="text-xs font-mono text-black font-bold mr-1">FILTER:</span>

        {(["ALL", "FRAUD", "LEGITIMATE"] as const).map((f) => (
          <W95Button
            key={f}
            active={filter === f}
            onClick={() => setFilter(f)}
            className="!text-[11px]"
          >
            {f === "ALL" && "📋 "}
            {f === "FRAUD" && "⚠ "}
            {f === "LEGITIMATE" && "✓ "}
            {f}
          </W95Button>
        ))}

        <div className="flex-1" />

        <W95Button onClick={() => setIsRunning((r) => !r)} className="!text-[11px]">
          {isRunning ? "■ PAUSE FEED" : "▶ RESUME FEED"}
        </W95Button>
        <W95Button onClick={() => setTransactions([])} className="!text-[11px]">
          🗑 CLEAR
        </W95Button>
      </div>

      {errorMessage ? (
        <div className="px-2 py-1 text-[11px] font-mono text-[#aa0000] bg-[#f0dede] border border-[#ccaaaa]">
          {errorMessage}
        </div>
      ) : null}

      {/* Terminal Window */}
      <div className="flex flex-col p-2 gap-2">
        <div className="flex flex-col" style={{ height: "420px" }}>
          <TitleBar
            title="C:\AEGISRADAR\monitor.exe — Live Feed"
            active={isRunning}
          />

          <InsetPanel className="flex flex-col overflow-hidden" style={{ height: "calc(100% - 26px)" }}>
            <div className="text-[11px] font-mono px-2 py-1 shrink-0 border-b border-[#004400]" style={{ color: "#00ff00" }}>
              C:\AEGISRADAR&gt; monitor --live --model = ensemble-v2.2 --backend=connected
            </div>

            <div
              ref={terminalRef}
              className="flex-1 overflow-y-auto px-2 py-1 text-[11px] font-mono"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#004400 #000" }}
            >
              {filtered.length === 0 && (
                <div className="text-[#004400] pt-8 text-center">
                  — AWAITING TRANSACTIONS FROM MERCHANTS —
                </div>
              )}

              {filtered.map((tx, i) => (
                <div
                  key={i}
                  className="leading-relaxed mb-1"
                  style={{
                    color: tx.is_fraud ? "#ff4444" : "#00ff00",
                    textShadow: tx.is_fraud ? "0 0 6px #ff0000" : "0 0 4px #00ff00",
                  }}
                >
                  [{tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}] {tx.transaction_id} |{" "}
                  {tx.merchant.padEnd(18)} | EGP {tx.amount.toFixed(2).padStart(8)} |{" "}
                  RISK: {(tx.risk_score * 100).toFixed(1)}%{" "}
                  {tx.is_fraud ? "→ ⚠ FRAUD DETECTED" : "→ ✓ NORMAL"}
                </div>
              ))}
            </div>
          </InsetPanel>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-2 shrink-0">
          {[
            { label: "TOTAL TX", value: totalCount, color: "#00ff00" },
            { label: "FRAUD DETECTED", value: fraudCount, color: "#ff4444" },
            { label: "FRAUD RATE", value: `${fraudRate}%`, color: parseFloat(fraudRate) > 20 ? "#ff4444" : "#ffaa00" },
            { label: "ENGINE STATUS", value: isConnected ? "AEGIS ACTIVE" : "CONNECTING...", color: isConnected ? "#00ff00" : "#ffaa00" },
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
                <div className="text-lg font-mono font-bold" style={{ color: stat.color }}>
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