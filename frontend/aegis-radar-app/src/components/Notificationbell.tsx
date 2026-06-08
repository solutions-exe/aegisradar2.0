"use client";

/**
 * src/components/NotificationBell.tsx
 *
 * Retro Win95 notification bell — connects to the WebSocket fraud-alert feed,
 * shows a badge count, plays a ding on new alerts, fires auto-dismissing toasts,
 * and opens a slide-in notification panel.
 *
 * Drop this inside DashboardLayout's top taskbar.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken } from '@/lib/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FraudAlert {
  id: string;                 // generated client-side from Date.now()
  type: "fraud_alert";
  transaction_id: string;
  merchant: string;
  amount: number;
  risk_score: number;         // 0–100
  timestamp: Date;
  read: boolean;
  is_fraud?: boolean;
}

interface ToastNotification extends FraudAlert {
  dismissAt: number;          // epoch ms
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function riskLabel(score: number): { label: string; color: string } {
  if (score >= 85) return { label: "CRITICAL", color: "#ff0000" };
  if (score >= 65) return { label: "HIGH",     color: "#ff8800" };
  if (score >= 40) return { label: "MEDIUM",   color: "#ffff00" };
  return                  { label: "UNKOWN",      color: "#a00000" };
}

/** Generate a short retro beep via the Web Audio API */
function playRetroBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio blocked — silently skip
  }
}

// ─── Win95 beveled helpers ────────────────────────────────────────────────────

const raisedBorder: React.CSSProperties = {
  borderStyle: "solid",
  borderWidth: "2px",
  borderColor: "white white #808080 #808080",
};

const sunkenBorder: React.CSSProperties = {
  borderStyle: "solid",
  borderWidth: "2px",
  borderColor: "#808080 black black #808080",
};

// ─── Toast component ──────────────────────────────────────────────────────────

function AlertToast({
  alert,
  onDismiss,
  onNavigate,
}: {
  alert: ToastNotification;
  onDismiss: (id: string) => void;
  onNavigate: () => void;
}) {
  const { label, color } = riskLabel(alert.risk_score);
  const [visible, setVisible] = useState(false);

  // Fade-in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(alert.id), 200);
  };

  return (
    <div
      onClick={() => { onNavigate(); dismiss(); }}
      style={{
        background: "#c0c0c0",
        ...raisedBorder,
        boxShadow: "3px 3px 0 #000",
        fontFamily: "'Courier New', Courier, monospace",
        width: "300px",
        cursor: "pointer",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(20px)",
        transition: "opacity 0.2s, transform 0.2s",
        userSelect: "none",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          background: "linear-gradient(to right, #800000, #c00000)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "2px 4px",
        }}
      >
        <span style={{ color: "white", fontSize: "10px", fontWeight: "bold", fontFamily: "'Courier New', Courier, monospace" }}>
          ⚠ AEGIS ALERT — FRAUD DETECTED
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          style={{
            ...raisedBorder,
            background: "#c0c0c0",
            color: "black",
            fontSize: "9px",
            lineHeight: 1,
            padding: "1px 3px",
            cursor: "pointer",
            fontFamily: "'Courier New', Courier, monospace",
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "6px 8px", fontSize: "10px" }}>
        <div
          style={{
            ...sunkenBorder,
            background: "#000",
            padding: "4px 6px",
            marginBottom: "6px",
          }}
        >
          <div style={{ color: "#ffff00", fontWeight: "bold", marginBottom: "2px" }}>
            TXN: {alert.transaction_id}
          </div>
          <div style={{ color: "#00ff00" }}>Merchant: {alert.merchant}</div>
          <div style={{ color: "#00ff00" }}>Amount:   ${alert.amount.toFixed(2)}</div>
          <div>
            <span style={{ color: "#c0c0c0" }}>Risk:     </span>
            <span style={{ color, fontWeight: "bold" }}>{label} ({alert.risk_score}%)</span>
          </div>
        </div>
        <div style={{ color: "#808080", fontSize: "9px", textAlign: "right" }}>
          Click to view in Transaction History
        </div>
      </div>
    </div>
  );
}

// ─── Panel row ────────────────────────────────────────────────────────────────

function NotificationRow({
  alert,
  onNavigate,
}: {
  alert: FraudAlert;
  onNavigate: () => void;
}) {
  const { label, color } = riskLabel(alert.risk_score);
  const ts = alert.timestamp.toLocaleTimeString("en-GB", { hour12: false });

  return (
    <button
      onClick={onNavigate}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: alert.read ? "#808080" : "#696969",
        borderBottom: "1px solid #808080",
        padding: "5px 7px",
        cursor: "pointer",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "10px",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#235fba")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = alert.read ? "#c0c0c0" : "#ffffff")}
      onMouseOverCapture={undefined}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
        <span style={{ color: "#000080", fontWeight: "bold", fontSize: "11px" }}>
          {alert.transaction_id}
        </span>
        <span style={{ color: "#000080", fontWeight: "bold", fontSize: "11px" }}>{ts}</span>
      </div>
      <div style={{ color :"#a00000" , fontWeight: "bold", marginBottom: "1px" }}>{ alert.merchant}</div>
      <div style={{ color: "#a00000", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
        <span>${alert.amount.toFixed(2)}</span>
        <span style={{ color, fontWeight: "bold" }}>{label} {(alert.risk_score)*100}%</span>
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const token_ = getToken();
const wsUrl = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL.replace('http', 'ws')}/api/ws/alerts?token=${token_}`: `ws://aegis-radar-backend.onrender.com/api/ws/alerts?token=${token_}`;
const ws_ = new WebSocket(wsUrl);
const MAX_STORED = 50;
const TOAST_DURATION_MS = 5000;

export default function NotificationBell() {
  const router = useRouter();

  const [alerts, setAlerts]         = useState<FraudAlert[]>([]);
  const [toasts, setToasts]         = useState<ToastNotification[]>([]);
  const [panelOpen, setPanelOpen]   = useState(false);
  const [wsStatus, setWsStatus]     = useState<"connecting" | "open" | "closed">("connecting");

  const wsRef       = useRef<WebSocket | null>(null);
  const toastTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── Unread badge count ─────────────────────────────────────────────────────
  const unreadCount = alerts.filter((a) => !a.read).length;

  // ── Navigate to history ────────────────────────────────────────────────────
  const goToHistory = useCallback(() => {
    setPanelOpen(false);
    router.push("/dashboard/history");
  }, [router]);

  // ── Dismiss toast ──────────────────────────────────────────────────────────
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = toastTimers.current.get(id);
    if (timer) { clearTimeout(timer); toastTimers.current.delete(id); }
  }, []);

  // ── Handle incoming message ────────────────────────────────────────────────
  const handleMessage = useCallback(
    (raw: string) => {
      let payload: any;
      try { payload = JSON.parse(raw); } catch { return; }
      if (payload.type !== "fraud_alert" || payload.is_fraud !== true) return;

      const alert: FraudAlert = {
        id:             `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type:           "fraud_alert",
        transaction_id: payload.transaction_id ?? "TXN-????",
        merchant:       payload.merchant       ?? "Unknown",
        amount:         Number(payload.amount) ?? 0,
        risk_score:     Number(payload.risk_score) ?? 0,
        timestamp:      new Date(),
        read:           false,
      };

      // Store alert (cap at MAX_STORED)
      setAlerts((prev) => [alert, ...prev].slice(0, MAX_STORED));

      // Play beep
      playRetroBeep();

      // Show toast and auto-dismiss
      const toast: ToastNotification = { ...alert, dismissAt: Date.now() + TOAST_DURATION_MS };
      setToasts((prev) => [...prev, toast]);
      const timer = setTimeout(() => dismissToast(alert.id), TOAST_DURATION_MS);
      toastTimers.current.set(alert.id, timer);
    },
    [dismissToast]
  );

  // ── WebSocket lifecycle ────────────────────────────────────────────────────
  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let ws: WebSocket;
    let destroyed = false;

    function connect() {
      if (destroyed) return;
      setWsStatus("connecting");
      ws = ws_;
      wsRef.current = ws;

      ws.onopen  = () => { if (!destroyed) setWsStatus("open"); };
      ws.onclose = () => {
        if (destroyed) return;
        setWsStatus("closed");
        reconnectTimer = setTimeout(connect, 4000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (e) => handleMessage(e.data);
    }

    connect();
    return () => {
      destroyed = true;
      clearTimeout(reconnectTimer);
      ws?.close();
      toastTimers.current.forEach(clearTimeout);
    };
  }, [handleMessage]);

  // ── Mark all read when panel opens ────────────────────────────────────────
  const togglePanel = () => {
    setPanelOpen((o) => {
      if (!o) {
        // mark all as read
        setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
      }
      return !o;
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Bell button ── */}
      <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        <button
          onClick={togglePanel}
          title="Notifications"
          aria-label={`Notifications — ${unreadCount} unread`}
          style={{
            ...raisedBorder,
            background: panelOpen ? "#808080" : "#c0c0c0",
            ...(panelOpen ? { borderColor: "#808080 white white #808080" } : {}),
            padding: "1px 6px",
            cursor: "pointer",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "14px",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            gap: "2px",
            position: "relative",
          }}
        >
          🔔
          {/* Animated pulse ring when new alerts */}
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                inset: 0,
                border: "2px solid #ff0000",
                animation: "aegisPulse 1.2s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
          )}
        </button>

        {/* Badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              background: "#ff0000",
              color: "white",
              fontSize: "9px",
              fontFamily: "'Courier New', Courier, monospace",
              fontWeight: "bold",
              minWidth: "14px",
              height: "14px",
              borderRadius: "0",               // retro — no rounded badges
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #800000",
              padding: "0 2px",
              lineHeight: 1,
              zIndex: 10,
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      {/* ── WS status dot ── */}
      <div
        title={`WebSocket: ${wsStatus}`}
        style={{
          width: "8px",
          height: "8px",
          background:
            wsStatus === "open"
              ? "#00ff00"
              : wsStatus === "connecting"
              ? "#ffff00"
              : "#ff0000",
          border: "1px solid #808080",
          flexShrink: 0,
        }}
      />

      {/* ── Slide-in notification panel ── */}
      {panelOpen && (
        <div
          style={{
            position: "fixed",
            top: "30px",             // just below taskbar
            right: "8px",
            width: "320px",
            maxHeight: "480px",
            background: "#c0c0c0",
            ...raisedBorder,
            boxShadow: "4px 4px 0 #000",
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            fontFamily: "'Courier New', Courier, monospace",
          }}
        >
          {/* Panel title bar */}
          <div
            style={{
              background: "linear-gradient(to right, #000080, #1084d0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "2px 4px",
              cursor: "default",
              userSelect: "none",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "white", fontSize: "11px", fontWeight: "bold" }}>
              🔔 NOTIFICATION CENTER
            </span>
            <button
              onClick={() => setPanelOpen(false)}
              style={{
                ...raisedBorder,
                background: "#c0c0c0",
                color: "black",
                fontSize: "9px",
                padding: "1px 4px",
                cursor: "pointer",
                fontFamily: "'Courier New', Courier, monospace",
              }}
            >
              ✕
            </button>
          </div>

          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 5px",
              borderBottom: "1px solid #808080",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setAlerts([])}
              style={{
                ...raisedBorder,
                background: "#c0c0c0",
                fontSize: "9px",
                padding: "1px 5px",
                cursor: "pointer",
                fontFamily: "'Courier New', Courier, monospace",
              }}
            >
              Clear All
            </button>
            <button
              onClick={goToHistory}
              style={{
                ...raisedBorder,
                background: "#c0c0c0",
                fontSize: "9px",
                padding: "1px 5px",
                cursor: "pointer",
                fontFamily: "'Courier New', Courier, monospace",
              }}
            >
              View History →
            </button>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: "9px", color: "#a00000" }}>
              {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Alert list */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {alerts.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  fontSize: "10px",
                  color: "#808080",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "6px" }}>🔔</div>
                <div>No alerts detected.</div>
                <div>System is monitoring.</div>
              </div>
            ) : (
              alerts.map((alert) => (
                <NotificationRow
                  key={alert.id}
                  alert={alert}
                  onNavigate={goToHistory}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              ...sunkenBorder,
              padding: "2px 6px",
              fontSize: "9px",
              color: "#000080",
              display: "flex",
              justifyContent: "space-between",
              flexShrink: 0,
              background: "#c0c0c0",
            }}
          >
            <span>
              WS:{" "}
              <span
                style={{
                  color:
                    wsStatus === "open"
                      ? "#008000"
                      : wsStatus === "connecting"
                      ? "#808000"
                      : "#800000",
                  fontWeight: "bold",
                }}
              >
                {wsStatus.toUpperCase()}
              </span>
            </span>
            <span>AEGIS RADAR v3.3.3</span>
          </div>
        </div>
      )}

      {/* ── Toast stack ── */}
      <div
        style={{
          position: "fixed",
          bottom: "30px",          // above status bar
          right: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          zIndex: 300,
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} style={{ pointerEvents: "auto" }}>
            <AlertToast
              alert={toast}
              onDismiss={dismissToast}
              onNavigate={goToHistory}
            />
          </div>
        ))}
      </div>

      {/* ── Keyframe for pulse ring ── */}
      <style>{`
        @keyframes aegisPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(1.08); }
        }
      `}</style>
    </>
  );
}