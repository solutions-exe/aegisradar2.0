"use client";

/**
 * src/app/dashboard/layout.tsx
 *
 * Win95 application shell — shared across every page under /dashboard.
 * Now includes the global NotificationBell (WebSocket fraud alerts).
 *
 * Changes from previous version:
 *   • Imported <NotificationBell /> from @/components/NotificationBell
 *   • Bell + WS status dot placed in the taskbar between the clock and the
 *     existing inset title block — fully visible on every dashboard page.
 */

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import AegisLogo from "@/components/Aegislogo";
import NotificationBell from "@/components/Notificationbell";

// ─── Win95 beveled button (local — keeps layout self-contained) ───────────────

function W95Button({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`select-none cursor-pointer px-3 py-1 font-mono text-xs text-black bg-[#c0c0c0] focus:outline-none ${className}`}
      style={{
        borderStyle: "solid",
        borderWidth: "2px",
        borderColor: "white white #808080 #808080",
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      {children}
    </button>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [time, setTime] = useState("");

  // Keep taskbar clock live
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    /* Win95 teal desktop */
    <div
      className="min-h-screen flex flex-col overflow-hidden"
      style={{
        background: "#008080",
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      {/* ── Scanline overlay ── */}
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        }}
      />

      {/* ── Top taskbar ── */}
      <div
        className="flex items-center px-2 py-1 gap-2 shrink-0 z-10"
        style={{
          background: "#c0c0c0",
          borderBottom: "2px solid #808080",
          height: "28px",
        }}
      >
        {/* Start button */}
        <W95Button className="!font-bold flex items-center gap-1">
          <span>🪟</span> Start
        </W95Button>

        <div className="w-px h-4 bg-[#808080] mx-1" />

        {/* Logo + app title */}
        <AegisLogo size={20} variant="micro" />
        <div
          className="text-xs font-mono text-black px-2 py-0.5"
          style={{ border: "1px inset #808080", background: "#c0c0c0" }}
        >
          AEGIS RADAR v3.3.3 — Dashboard
        </div>

        {/* Push everything after here to the right */}
        <div className="flex-1" />

        {/*
         * ── Notification Bell ──────────────────────────────────────────────
         * Renders:
         *   • Bell button with red unread badge
         *   • WebSocket status dot (green/yellow/red)
         *   • Slide-in notification panel (portaled to fixed position)
         *   • Toast stack (fixed, bottom-right)
         * Lives at the layout level so it persists across all dashboard pages.
         */}
        <div className="flex items-center gap-1.5 mr-1">
          <NotificationBell />
        </div>

        <div className="w-px h-4 bg-[#808080]" />

        {/* Clock */}
        <div
          className="text-xs font-mono px-2"
          style={{ border: "1px inset #808080" }}
        >
          {time}
        </div>
      </div>

      {/* ── Outer window chrome ── */}
      <div className="flex-1 p-3 flex flex-col min-h-0 overflow-hidden">
        <div
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
          style={{
            background: "#c0c0c0",
            borderStyle: "solid",
            borderWidth: "2px",
            borderColor: "white white #808080 #808080",
            boxShadow: "2px 2px 0 #000",
          }}
        >
          {/* Window title bar */}
          <div
            className="flex items-center justify-between px-2 py-1 select-none shrink-0"
            style={{
              background: "linear-gradient(to right, #000080, #1084d0)",
            }}
          >
            <span className="text-white font-mono text-xs font-bold tracking-wide">
              AEGIS-RADAR-V3.3.3 — AI Fraud Detection System [EXE]
            </span>
            <div className="flex gap-1">
              {["_", "□", "✕"].map((btn) => (
                <W95Button key={btn} className="!text-[10px] !px-1 !py-0 leading-none">
                  {btn}
                </W95Button>
              ))}
            </div>
          </div>

          {/* Menu bar */}
          <div
            className="flex items-center px-1 py-0.5 text-xs shrink-0"
            style={{ borderBottom: "1px solid #808080" }}
          >
            {["File", "View", "Monitor", "Alerts", "Help"].map((m) => (
              <button
                key={m}
                className="px-2 py-0.5 font-mono text-black hover:bg-[#000080] hover:text-white focus:outline-none"
              >
                <u>{m[0]}</u>
                {m.slice(1)}
              </button>
            ))}
          </div>

          {/* ── Sidebar + page content ── */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <Sidebar />

            {/* Page content fills the remaining space */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom status bar ── */}
      <div
        className="flex items-center px-2 py-0.5 gap-4 shrink-0 text-[10px] font-mono z-10"
        style={{
          background: "#c0c0c0",
          borderTop: "2px solid #808080",
          height: "22px",
        }}
      >
        <div
          className="text-black"
          style={{ border: "1px inset #808080", padding: "1px 6px" }}
        >
          Aegis Radar
        </div>
        <div
          className="text-black"
          style={{ border: "1px inset #808080", padding: "1px 6px" }}
        >
          EGP Feed — Cairo, EG
        </div>
        <div className="flex-1" />
        <div
          className="text-black"
          style={{ border: "1px inset #808080", padding: "1px 6px" }}
        >
          {new Date().toLocaleDateString("en-GB")}
        </div>
      </div>

      {/* Global styles */}
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