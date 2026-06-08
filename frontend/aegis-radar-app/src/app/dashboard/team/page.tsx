"use client";

/**
 * src/app/dashboard/team/page.tsx
 *
 * AEGIS RADAR — Team & Access Management (backend-connected).
 *
 * GET    /api/team              → list team members
 * POST   /api/team/invite       → invite new member { name, email, role }
 * PUT    /api/team/{id}/role    → change role       { role }
 * DELETE /api/team/{id}         → remove member     (Admin only)
 */

import { useState, useEffect, useCallback } from "react";
import { getToken } from "@/lib/auth"; // adjust path if needed

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type Role   = "Admin" | "Analyst" | "Viewer";
type Status = "Active" | "Inactive" | "Pending";

interface TeamMember {
  id:         string | number;
  name:       string;
  email:      string;
  role:       Role;
  lastActive: string;
  status:     Status;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function authHeaders(): HeadersInit {
  const token = getToken();
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { ...authHeaders(), ...(opts.headers ?? {}) },
  });
  if (res.status === 401) { window.location.href = "/auth"; throw new Error("Unauthorized"); }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let detail = "";
    try { detail = JSON.parse(body)?.detail ?? body; } catch { detail = body; }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as unknown as T);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE / STATUS DATA
// ═══════════════════════════════════════════════════════════════════════════════

const ROLE_COLOR:   Record<Role,   string> = { Admin:"#cc0000", Analyst:"#cc7700", Viewer:"#006600" };
const ROLE_BG:      Record<Role,   string> = { Admin:"#ffdddd", Analyst:"#fff3cc", Viewer:"#ddffdd" };
const STATUS_COLOR: Record<Status, string> = { Active:"#006600", Inactive:"#808080", Pending:"#000080" };
const STATUS_BG:    Record<Status, string> = { Active:"#ddffdd", Inactive:"#e8e8e8", Pending:"#dde8ff" };

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  Admin:   ["Full dashboard access","Manage team members","Configure fraud rules",
             "Export data & reports","View billing","Block IPs, emails, phones"],
  Analyst: ["View all transaction data","View analytics","Manage fraud alerts","Flag transactions",
             "Contact customers & merchants","Export filtered reports"],
  Viewer:  ["View Transactions","View analytics & charts","Cannot take any actions",
             "Cannot export data", "cannot manage alerts"],
};

const ROLE_ICONS: Record<Role, string> = { Admin:"★", Analyst:"◆", Viewer:"●" };

// ═══════════════════════════════════════════════════════════════════════════════
// WIN95 PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════

const MONO: React.CSSProperties = { fontFamily: "'Courier New', Courier, monospace" };

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

function TitleBar({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between px-2 select-none shrink-0"
      style={{ background:"linear-gradient(to right,#000080,#1084d0)", height:"20px" }}>
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

function W95Input({ value, onChange, placeholder = "", className = "", type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  className?: string; type?: string;
}) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-white text-black text-xs px-1 py-0.5 ${className}`}
      style={{ ...MONO, borderStyle:"solid", borderWidth:"2px",
        borderColor:"#808080 white white #808080", outline:"none" }} />
  );
}

function W95Select({ value, onChange, options, className = "" }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; className?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className={`bg-white text-black text-xs px-1 py-0.5 ${className}`}
      style={{ ...MONO, borderStyle:"solid", borderWidth:"2px",
        borderColor:"#808080 white white #808080", outline:"none" }}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: {
  message: string; type: "success"|"error"|"info"; onClose: () => void;
}) {
  const bg = type === "success" ? "#000080" : type === "error" ? "#cc0000" : "#444";
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2"
      style={{ background:bg, color:"white", borderStyle:"solid", borderWidth:"2px",
        borderColor:"white white #808080 #808080",
        boxShadow:"2px 2px 0 #000", ...MONO, fontSize:"11px", fontWeight:"bold" }}>
      {type === "success" ? "✓" : type === "error" ? "⚠" : "ℹ"} {message}
      <button onClick={onClose}
        style={{ background:"none", border:"none", color:"white", cursor:"pointer",
          fontFamily:"monospace", fontSize:"14px", marginLeft:"4px" }}>×</button>
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ title, children, onClose, width = 420 }: {
  title: string; children: React.ReactNode; onClose: () => void; width?: number;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background:"rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:`${width}px`, background:"#c0c0c0", borderStyle:"solid",
        borderWidth:"2px", borderColor:"white white #808080 #808080",
        boxShadow:"4px 4px 0 #000" }}>
        <TitleBar title={title} />
        {children}
      </div>
    </div>
  );
}

// ── Loading pane ──────────────────────────────────────────────────────────────

function LoadingPane() {
  return (
    <div className="flex items-center justify-center py-16">
      <InsetPanel className="bg-black px-8 py-5">
        <div className="font-mono text-[11px] text-[#00ff00]">
          C:\AEGISRADAR&gt; load team...
          <span style={{ display:"inline-block", width:"8px", height:"13px",
            background:"#00ff00", verticalAlign:"middle", marginLeft:"4px",
            animation:"blink 1s step-end infinite" }} />
        </div>
      </InsetPanel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVITE MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function InviteModal({ onClose, onInvited }: {
  onClose: () => void; onInvited: () => void;
}) {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [role,    setRole]    = useState<Role>("Analyst");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async () => {
    if (!name.trim())  { setError("Name is required."); return; }
    if (!email.trim() || !email.includes("@")) { setError("Valid email required."); return; }
    setLoading(true); setError("");
    try {
      await apiFetch("/api/team/invite", {
        method: "POST",
        body: JSON.stringify({ name, email, role }),
      });
      onInvited();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Invite Team Member — AEGIS RADAR" onClose={onClose}>
      <div className="p-4 flex flex-col gap-3">
        <InsetPanel className="bg-white p-2">
          <div className="font-mono text-[10px] text-black leading-relaxed">
            An invitation email will be sent. The new member will be prompted to
            create their AEGIS RADAR credentials on first login.
          </div>
        </InsetPanel>

        {error && (
          <div className="font-mono text-[9px] font-bold px-2 py-1"
            style={{ background:"#ffdddd", color:"#cc0000",
              borderStyle:"solid", borderWidth:"1px", borderColor:"#cc0000" }}>
            ⚠ {error}
          </div>
        )}

        <div className="flex flex-col gap-0.5">
          <label className="font-mono text-[10px] font-bold text-black">Full Name</label>
          <W95Input value={name} onChange={setName} placeholder="Ahmed Mostafa" className="w-full" />
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="font-mono text-[10px] font-bold text-black">Email Address</label>
          <W95Input value={email} onChange={setEmail} type="email"
            placeholder="colleague@company.com.eg" className="w-full" />
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="font-mono text-[10px] font-bold text-black">Assign Role</label>
          <W95Select value={role} onChange={(v) => setRole(v as Role)}
            options={[
              { value:"Admin",   label:"Admin — Full access" },
              { value:"Analyst", label:"Analyst — Manage alerts" },
              { value:"Viewer",  label:"Viewer — Read-only" },
            ]} className="w-full" />
        </div>

        {/* Role hint */}
        <div className="p-2" style={{ background:"#d8d8d8", borderStyle:"solid",
          borderWidth:"1px", borderColor:"#808080 white white #808080" }}>
          <div className="font-mono text-[9px] text-[#444] leading-relaxed">
            <span className="font-bold" style={{ color:ROLE_COLOR[role] }}>
              {ROLE_ICONS[role]} {role}:
            </span>{" "}
            {ROLE_PERMISSIONS[role].slice(0,3).join(" · ")}…
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-1" style={{ borderTop:"1px solid #b0b0b0" }}>
          <W95Button onClick={onClose} disabled={loading}>Cancel</W95Button>
          <W95Button onClick={handleSubmit} disabled={loading} className="!font-bold"
            style={{ background:"#000080", color:"white",
              borderColor:"white white #808080 #808080" } as React.CSSProperties}>
            {loading ? "⏳ Sending…" : "✉ Send Invitation"}
          </W95Button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHANGE ROLE MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function ChangeRoleModal({ member, onClose, onChanged }: {
  member: TeamMember; onClose: () => void; onChanged: () => void;
}) {
  const [role,    setRole]    = useState<Role>(member.role);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleConfirm = async () => {
    setLoading(true); setError("");
    try {
      await apiFetch(`/api/team/${member.id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
      onChanged();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to change role");
    } finally {
      setLoading(false);
    }
  };

  const avatar = (member.name ?? "?").split(" ").map((w) => w[0]).join("").slice(0,2).toUpperCase();

  return (
    <Modal title={`Change Role — ${member.name}`} onClose={onClose} width={400}>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <InsetPanel className="bg-[#000080] flex items-center justify-center shrink-0"
            style={{ width:"32px", height:"32px" }}>
            <span className="font-mono text-white text-[9px] font-bold">{avatar}</span>
          </InsetPanel>
          <div>
            <div className="font-mono text-xs font-bold text-black">{member.name}</div>
            <div className="font-mono text-[10px] text-[#555]">{member.email}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-[#555]">Current:</span>
          <span className="font-mono text-[10px] font-bold px-2 py-0.5"
            style={{ background:ROLE_BG[member.role], color:ROLE_COLOR[member.role],
              border:`1px solid ${ROLE_COLOR[member.role]}` }}>
            {member.role}
          </span>
          <span className="font-mono text-[10px] text-[#555]">→ New:</span>
          <W95Select value={role} onChange={(v) => setRole(v as Role)}
            options={[
              { value:"Admin",   label:"Admin"   },
              { value:"Analyst", label:"Analyst" },
              { value:"Viewer",  label:"Viewer"  },
            ]} />
        </div>

        <InsetPanel className="bg-black p-2">
          <div className="font-mono text-[9px] text-[#00ff00] font-bold mb-1">
            ▶ {role} PERMISSIONS
          </div>
          {ROLE_PERMISSIONS[role].map((p, i) => (
            <div key={i} className="font-mono text-[9px] leading-relaxed"
              style={{ color: i < 4 ? "#00cc00" : "#cc4444" }}>
              {i < 4 ? "✓" : "✗"} {p}
            </div>
          ))}
        </InsetPanel>

        {error && (
          <div className="font-mono text-[9px] px-2 py-1"
            style={{ background:"#ffdddd", color:"#cc0000",
              borderStyle:"solid", borderWidth:"1px", borderColor:"#cc0000" }}>
            ⚠ {error}
          </div>
        )}

        <div className="flex gap-2 justify-end" style={{ borderTop:"1px solid #b0b0b0", paddingTop:"8px" }}>
          <W95Button onClick={onClose} disabled={loading}>Cancel</W95Button>
          <W95Button onClick={handleConfirm} disabled={loading} className="!font-bold"
            style={{ background:"#000080", color:"white",
              borderColor:"white white #808080 #808080" } as React.CSSProperties}>
            {loading ? "⏳ Applying…" : "✓ Apply Change"}
          </W95Button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIRM MODAL (remove / deactivate)
// ═══════════════════════════════════════════════════════════════════════════════

function ConfirmModal({ title, message, onClose, onConfirm, loading }: {
  title: string; message: string;
  onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <Modal title={title} onClose={onClose} width={380}>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="font-mono text-3xl leading-none" style={{ color:"#000080" }}>ℹ</div>
          <InsetPanel className="bg-white flex-1 p-2">
            <div className="font-mono text-[11px] text-black leading-relaxed">{message}</div>
          </InsetPanel>
        </div>
        <div className="flex justify-end gap-2">
          <W95Button onClick={onClose} disabled={loading}>Cancel</W95Button>
          <W95Button onClick={onConfirm} disabled={loading} className="!font-bold"
            style={{ background:"#cc0000", color:"white",
              borderColor:"white white #660000 #660000" } as React.CSSProperties}>
            {loading ? "⏳ Processing…" : "✓ Confirm"}
          </W95Button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE REFERENCE SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════

function RoleReference({ currentUserRole }: { currentUserRole: string }) {
  return (
    <div className="flex flex-col gap-2" style={{ width:"220px", flexShrink:0 }}>

      {/* Current user badge */}
      <div className="flex flex-col">
        <TitleBar title="Your Access Level" />
        <Panel className="p-2">
          <InsetPanel className="bg-[#000080] p-2">
            <div className="font-mono text-[9px] text-[#88aaff]">SIGNED IN AS</div>
            <div className="font-mono text-sm font-bold text-white">{currentUserRole || "—"}</div>
            <div className="font-mono text-[8px] text-[#88aaff] mt-0.5">
              {currentUserRole === "Admin"
                ? "Full access · can modify team"
                : currentUserRole === "Analyst"
                ? "Can manage alerts & reviews"
                : "Read-only access"}
            </div>
          </InsetPanel>
        </Panel>
      </div>

      {/* Role permissions reference */}
      <div className="flex flex-col">
        <TitleBar title="Role Permissions" />
        <Panel className="p-2 flex flex-col gap-2">
          {(["Admin","Analyst","Viewer"] as Role[]).map((role) => (
            <div key={role}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-mono text-[10px] font-bold"
                  style={{ color:ROLE_COLOR[role] }}>
                  {ROLE_ICONS[role]} {role}
                </span>
              </div>
              <InsetPanel className="bg-black p-1.5">
                {ROLE_PERMISSIONS[role].map((p, i) => (
                  <div key={i} className="font-mono text-[8px] leading-relaxed flex gap-1"
                    style={role === "Admin" ? { color: i < 6 ? "#00cc00" : "#cc4444" } : role === "Analyst" ? { color: i < 4 ? "#00cc00" : "#cc4444" } : { color: i < 2 ? "#00cc00" : "#cc4444" }}>
                    <span>{role === "Admin" ? (i < 6 ? "✓" : "✗") : role === "Analyst" ? (i < 4 ? "✓" : "✗") : (i < 2 ? "✓" : "✗")}</span>
                    <span>{p}</span>
                  </div>
                ))}
              </InsetPanel>
              {role !== "Viewer" && <div className="h-px mt-1.5" style={{ background:"#b0b0b0" }} />}
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USERS TABLE
// ═══════════════════════════════════════════════════════════════════════════════

type ModalState =
  | { type: "invite" }
  | { type: "changeRole"; member: TeamMember }
  | { type: "remove"; member: TeamMember }
  | null;

function UsersTable({ members, isAdmin, onAction }: {
  members:  TeamMember[];
  isAdmin:  boolean;
  onAction: (member: TeamMember, action: "changeRole"|"remove") => void;
}) {
  return (
    <div className="flex flex-col flex-1 min-w-0">
      <TitleBar title={`Team Members — ${members.length} users`} />
      <Panel className="p-0">
        <div className="overflow-auto" style={{ maxHeight:"460px" }}>
          <table className="w-full border-collapse" style={{ minWidth:"620px" }}>
            <colgroup>
              <col style={{ width:"160px" }} />
              <col style={{ width:"200px" }} />
              <col style={{ width:"85px"  }} />
              <col style={{ width:"140px" }} />
              <col style={{ width:"85px"  }} />
              <col style={{ width:"160px" }} />
            </colgroup>
            <thead style={{ position:"sticky", top:0, zIndex:1 }}>
              <tr>
                {["NAME","EMAIL","ROLE","LAST ACTIVE","STATUS","ACTIONS"].map((h) => (
                  <th key={h}
                    className="px-2 py-1 text-left font-mono text-[10px] font-bold text-black bg-[#c0c0c0]"
                    style={{ borderStyle:"solid", borderWidth:"1px",
                      borderColor:"white white #808080 #808080", whiteSpace:"nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 font-mono text-xs text-[#808080]">
                    — No team members found —
                  </td>
                </tr>
              )}
              {members.map((m, i) => {
                const avatar = (m.name ?? "?").split(" ").map((w) => w[0]).join("").slice(0,2).toUpperCase();
                return (
                  <tr key={m.id}
                    style={{ background: i % 2 === 0 ? "#ffffff" : "#f4f4f4" }}
                    className="hover:bg-[#dde8ff]">

                    {/* Name */}
                    <td className="px-2 py-1.5" style={{ borderBottom:"1px solid #e0e0e0" }}>
                      <div className="flex items-center gap-2">
                        <InsetPanel className="bg-[#000080] flex items-center justify-center shrink-0"
                          style={{ width:"22px", height:"22px" }}>
                          <span className="font-mono text-white text-[9px] font-bold">{avatar}</span>
                        </InsetPanel>
                        <span className="font-mono text-[11px] font-bold text-black truncate">
                          {m.name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-2 py-1.5 font-mono text-[10px] text-[#444]"
                      style={{ borderBottom:"1px solid #e0e0e0" }}>
                      {m.email}
                    </td>

                    {/* Role */}
                    <td className="px-2 py-1.5" style={{ borderBottom:"1px solid #e0e0e0" }}>
                      <span className="font-mono text-[9px] font-bold px-1.5 py-0.5"
                        style={{ background:ROLE_BG[m.role], color:ROLE_COLOR[m.role],
                          border:`1px solid ${ROLE_COLOR[m.role]}` }}>
                        {ROLE_ICONS[m.role]} {m.role}
                      </span>
                    </td>

                    {/* Last active */}
                    <td className="px-2 py-1.5 font-mono text-[10px] text-[#555]"
                      style={{ borderBottom:"1px solid #e0e0e0" }}>
                      {m.lastActive ?? "—"}
                    </td>

                    {/* Status */}
                    <td className="px-2 py-1.5" style={{ borderBottom:"1px solid #e0e0e0" }}>
                      <span className="font-mono text-[9px] font-bold px-1.5 py-0.5"
                        style={{ background:STATUS_BG[m.status], color:STATUS_COLOR[m.status],
                          border:`1px solid ${STATUS_COLOR[m.status]}` }}>
                        {m.status === "Active" ? "● Active" :
                         m.status === "Inactive" ? "○ Inactive" : "◌ Pending"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-1" style={{ borderBottom:"1px solid #e0e0e0" }}>
                      {isAdmin ? (
                        <div className="flex gap-1 flex-wrap">
                          <W95Button onClick={() => onAction(m, "changeRole")}
                            className="!text-[9px] !px-1.5 !py-px">
                            ✎ Role
                          </W95Button>
                          <W95Button onClick={() => onAction(m, "remove")}
                            className="!text-[9px] !px-1.5 !py-px"
                            style={{ color:"#cc0000" } as React.CSSProperties}>
                            ✕ Remove
                          </W95Button>
                        </div>
                      ) : (
                        <span className="font-mono text-[9px] text-[#aaa]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE ROOT
// ═══════════════════════════════════════════════════════════════════════════════

export default function TeamPage() {
  const [members,         setMembers]         = useState<TeamMember[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [modal,           setModal]           = useState<ModalState>(null);
  const [confirmLoading,  setConfirmLoading]  = useState(false);
  const [toast,           setToast]           = useState<{ msg:string; type:"success"|"error"|"info" } | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState("");

  const isAdmin = currentUserRole === "Admin";

  // Read role from auth storage
  useEffect(() => {
    const role =
      localStorage.getItem("role") ??
      sessionStorage.getItem("role") ?? "";
    setCurrentUserRole(role);
  }, []);

  // ── Load team ──────────────────────────────────────────────────────────────
  const loadTeam = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<TeamMember[]>("/api/team");
      setMembers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  const showToast = useCallback((msg: string, type: "success"|"error"|"info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Remove member ──────────────────────────────────────────────────────────
  const handleRemoveConfirm = useCallback(async () => {
    if (modal?.type !== "remove") return;
    setConfirmLoading(true);
    try {
      await apiFetch(`/api/team/${modal.member.id}`, { method:"DELETE" });
      setModal(null);
      showToast(`${modal.member.name} has been removed.`, "success");
      loadTeam();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Remove failed", "error");
    } finally {
      setConfirmLoading(false);
    }
  }, [modal, loadTeam, showToast]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    active:  members.filter((m) => m.status === "Active").length,
    pending: members.filter((m) => m.status === "Pending").length,
    admins:  members.filter((m) => m.role === "Admin").length,
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col overflow-y-auto" style={{ ...MONO, background:"#c0c0c0" }}>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-2 py-1.5 shrink-0"
        style={{ borderBottom:"2px solid #808080", background:"#c0c0c0" }}>
        {isAdmin && (
          <W95Button onClick={() => setModal({ type:"invite" })}
            className="!font-bold !text-[10px]"
            style={{ background:"#000080", color:"white",
              borderColor:"white white #808080 #808080" } as React.CSSProperties}>
            ✉ Invite Member
          </W95Button>
        )}
        <W95Button onClick={loadTeam} className="!text-[10px]">🔄 Refresh</W95Button>
        <W95Button className="!text-[10px]" onClick={() => window.print()}>🖨 Print</W95Button>
        <div className="flex-1" />
        <span className="font-mono text-[10px] text-[#444]">
          {stats.active} active · {stats.pending} pending · {stats.admins} admins
          &nbsp;|&nbsp; {new Date().toLocaleDateString("en-GB")}
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-3 mx-3 mt-3"
          style={{ background:"#ffdddd", borderStyle:"solid", borderWidth:"2px",
            borderColor:"#cc0000 #cc0000 #cc0000 #cc0000" }}>
          <span className="text-base">⚠</span>
          <div className="flex-1">
            <div className="font-mono text-[10px] font-bold text-[#880000]">Failed to load team</div>
            <div className="font-mono text-[9px] text-[#880000]">{error}</div>
          </div>
          <W95Button onClick={loadTeam} className="!text-[10px] shrink-0">↺ Retry</W95Button>
        </div>
      )}

      {/* Page content */}
      <div className="flex flex-col gap-3 p-3">

        {/* Org header */}
        <div className="flex flex-col">
          <TitleBar title="AEGIS RADAR — Team & Access Management" />
          <Panel className="p-3">
            <div className="flex items-center gap-4 flex-wrap">
              <InsetPanel className="bg-[#000080] flex items-center justify-center shrink-0"
                style={{ width:"56px", height:"56px" }}>
                <span className="font-mono text-white font-bold" style={{ fontSize:"20px" }}>
                  BFCAI
                </span>
              </InsetPanel>
              <div className="flex flex-col gap-1 flex-1">
                <div className="font-mono text-base font-bold text-black">
                  BFCAI IS-Depatment
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5"
                    style={{ background:"#000080", color:"white",
                      borderStyle:"solid", borderWidth:"1px",
                      borderColor:"white white #808080 #808080" }}>
                    ⬡ Professional Plan
                  </span>
                  <span className="font-mono text-[10px] font-bold"
                    style={{ color: currentUserRole === "Admin" ? "#cc0000" : "#006600" }}>
                    Your role: {currentUserRole || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[9px] text-[#555]">
                    {members.length} / 10 seats used
                  </span>
                  <div className="w-32 h-2.5"
                    style={{ borderStyle:"solid", borderWidth:"1px",
                      borderColor:"#808080 white white #808080", background:"#e0e0e0" }}>
                    <div style={{ width:`${(members.length / 10) * 100}%`,
                      height:"100%", background:"#000080" }} />
                  </div>
                </div>
              </div>
              {isAdmin && (
                <W95Button onClick={() => setModal({ type:"invite" })}
                  className="!font-bold !text-[10px] shrink-0"
                  style={{ background:"#000080", color:"white",
                    borderColor:"white white #808080 #808080" } as React.CSSProperties}>
                  ✉ Add Team Member
                </W95Button>
              )}
            </div>
          </Panel>
        </div>

        {/* Main area */}
        <div className="flex gap-3 items-start">
          {loading ? (
            <div className="flex-1"><LoadingPane /></div>
          ) : (
            <UsersTable members={members} isAdmin={isAdmin}
              onAction={(member, action) => setModal({ type:action, member })} />
          )}
          <RoleReference currentUserRole={currentUserRole} />
        </div>

        {/* Footer */}
        <div className="font-mono text-[9px] text-[#555] text-center pb-1"
          style={{ borderTop:"1px solid #b0b0b0", paddingTop:"6px" }}>
          AEGIS RADAR V3.3.3 — Team & Access &nbsp;|&nbsp; Role changes take effect on next login
          &nbsp;|&nbsp; © 2026 EXE Solutions, Cairo EG
        </div>
      </div>

      {/* Modals */}
      {modal?.type === "invite" && (
        <InviteModal onClose={() => setModal(null)}
          onInvited={() => { loadTeam(); showToast("Invitation sent successfully", "success"); }} />
      )}
      {modal?.type === "changeRole" && (
        <ChangeRoleModal member={modal.member} onClose={() => setModal(null)}
          onChanged={() => { loadTeam(); showToast(`Role updated for ${modal.member.name}`, "success"); }} />
      )}
      {modal?.type === "remove" && (
        <ConfirmModal
          title={`Remove Member — ${modal.member.name}`}
          message={`This will permanently remove "${modal.member.name}" (${modal.member.email}) from your organisation. They will immediately lose all access to AEGIS RADAR.`}
          onClose={() => setModal(null)}
          onConfirm={handleRemoveConfirm}
          loading={confirmLoading} />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @media print {
          body * { visibility:hidden; }
          table, table * { visibility:visible; }
          table { position:absolute; top:0; left:0; width:100%; }
        }
      `}</style>
    </div>
  );
}