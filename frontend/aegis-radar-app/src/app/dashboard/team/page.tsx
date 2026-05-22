"use client";

/**
 * src/app/dashboard/team/page.tsx
 *
 * AEGIS RADAR — Team & Access Management page.
 * Organisation info, user table, role management, invite modal,
 * action confirmation modal, and a role-permissions reference panel.
 *
 * Lives inside layout.tsx (Win95 shell + sidebar). Fully self-contained.
 */

import { useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type Role   = "Admin" | "Analyst" | "Viewer";
type Status = "Active" | "Inactive" | "Pending";

interface TeamMember {
  id:         string;
  name:       string;
  email:      string;
  role:       Role;
  lastActive: string;
  status:     Status;
  avatar:     string; // initials
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATIC DATA
// ═══════════════════════════════════════════════════════════════════════════════

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: "u1", name: "Ahmed Mostafa",   email: "a.mostafa@cib.com.eg",
    role: "Admin",   lastActive: "Today, 09:14",    status: "Active",   avatar: "AM",
  },
  {
    id: "u2", name: "Sara El-Sayed",   email: "s.elsayed@cib.com.eg",
    role: "Admin",   lastActive: "Today, 08:52",    status: "Active",   avatar: "SE",
  },
  {
    id: "u3", name: "Omar Khalil",     email: "o.khalil@cib.com.eg",
    role: "Analyst", lastActive: "Yesterday, 17:30", status: "Active",  avatar: "OK",
  },
  {
    id: "u4", name: "Nour Abdallah",   email: "n.abdallah@cib.com.eg",
    role: "Analyst", lastActive: "May 14, 11:05",   status: "Active",   avatar: "NA",
  },
  {
    id: "u5", name: "Youssef Hassan",  email: "y.hassan@cib.com.eg",
    role: "Analyst", lastActive: "May 12, 09:48",   status: "Inactive", avatar: "YH",
  },
  {
    id: "u6", name: "Dina Farouk",     email: "d.farouk@cib.com.eg",
    role: "Viewer",  lastActive: "May 10, 14:22",   status: "Active",   avatar: "DF",
  },
  {
    id: "u7", name: "Karim Soliman",   email: "k.soliman@cib.com.eg",
    role: "Viewer",  lastActive: "—",               status: "Pending",  avatar: "KS",
  },
];

const ROLE_PERMISSIONS: Record<Role, { icon: string; color: string; perms: string[] }> = {
  Admin: {
    icon: "★", color: "#cc0000",
    perms: [
      "Full dashboard access",
      "Manage team members & roles",
      "Configure fraud rules & thresholds",
      "Export data & generate reports",
      "Access model configuration",
      "Block IPs, emails, phones",
      "View billing & subscription",
    ],
  },
  Analyst: {
    icon: "◆", color: "#cc7700",
    perms: [
      "View all transaction data",
      "Manage fraud alerts & reviews",
      "Flag & annotate transactions",
      "Contact customers & merchants",
      "Export filtered reports",
      "View analytics & posture scores",
      "Cannot manage team or billing",
    ],
  },
  Viewer: {
    icon: "●", color: "#006600",
    perms: [
      "Read-only dashboard access",
      "View live monitor feed",
      "View analytics & charts",
      "Cannot take any actions",
      "Cannot export data",
      "Cannot manage alerts",
      "Cannot access team settings",
    ],
  },
};

const PLAN_INFO = {
  name:    "Professional Plan",
  renewal: "Renews in 12 days",
  seats:   { used: 7, total: 10 },
  org:     "CIB Egypt — E-Commerce Division",
};

// ═══════════════════════════════════════════════════════════════════════════════
// WIN95 PRIMITIVE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const MONO: React.CSSProperties = { fontFamily: "'Courier New', Courier, monospace" };

function W95Button({
  children, active, onClick, className = "", disabled, style,
}: {
  children: React.ReactNode; active?: boolean; onClick?: () => void;
  className?: string; disabled?: boolean; style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`select-none cursor-pointer px-3 py-1 text-black bg-[#c0c0c0]
        focus:outline-dotted focus:outline-1 focus:outline-black text-xs
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        ...MONO,
        borderStyle: "solid", borderWidth: "2px",
        borderColor: active
          ? "#808080 #808080 white white"
          : "white white #808080 #808080",
        ...style,
      }}
    >
      {children}
    </button>
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
        {["−", "□", "×"].map((b) => (
          <button key={b}
            className="select-none text-black bg-[#c0c0c0] font-mono"
            style={{ fontSize: "8px", width: "14px", height: "12px", borderStyle: "solid",
              borderWidth: "1px", borderColor: "white white #808080 #808080",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "default" }}>
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
      style={{ borderStyle: "solid", borderWidth: "2px",
        borderColor: "white white #808080 #808080", ...style }}>
      {children}
    </div>
  );
}

function InsetPanel({ children, className = "", style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div className={className}
      style={{ borderStyle: "solid", borderWidth: "2px",
        borderColor: "#808080 white white #808080", ...style }}>
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

/** Win95 select dropdown */
function W95Select({ value, onChange, options, className = "" }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; className?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className={`bg-white text-black text-xs px-1 py-0.5 ${className}`}
      style={{ ...MONO, borderStyle: "solid", borderWidth: "2px",
        borderColor: "#808080 white white #808080", outline: "none" }}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/** Win95 text input */
function W95Input({ value, onChange, placeholder = "", className = "" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-white text-black text-xs px-1 py-0.5 ${className}`}
      style={{ ...MONO, borderStyle: "solid", borderWidth: "2px",
        borderColor: "#808080 white white #808080", outline: "none" }} />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLOUR HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const ROLE_COLOR:   Record<Role,   string> = { Admin: "#cc0000", Analyst: "#cc7700", Viewer: "#006600" };
const ROLE_BG:      Record<Role,   string> = { Admin: "#ffdddd", Analyst: "#fff3cc", Viewer: "#ddffdd" };
const STATUS_COLOR: Record<Status, string> = { Active: "#006600", Inactive: "#808080", Pending: "#000080" };
const STATUS_BG:    Record<Status, string> = { Active: "#ddffdd", Inactive: "#e8e8e8", Pending: "#dde8ff" };

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL: Generic Win95 dialog wrapper
// ═══════════════════════════════════════════════════════════════════════════════

function Modal({ title, children, onClose, width = 400 }: {
  title: string; children: React.ReactNode; onClose: () => void; width?: number;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex flex-col"
        style={{ width: `${width}px`, background: "#c0c0c0", borderStyle: "solid",
          borderWidth: "2px", borderColor: "white white #808080 #808080",
          boxShadow: "4px 4px 0 #000" }}>
        <TitleBar title={title} />
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL: Add Team Member
// ═══════════════════════════════════════════════════════════════════════════════

function AddMemberModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (email: string, role: Role) => void;
}) {
  const [email, setEmail] = useState("");
  const [role,  setRole]  = useState<Role>("Analyst");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    onAdd(email.trim(), role);
  };

  return (
    <Modal title="Add Team Member — AEGIS RADAR" onClose={onClose} width={420}>
      <div className="p-4 flex flex-col gap-3">
        {/* Info banner */}
        <InsetPanel className="bg-white p-2">
          <div className="font-mono text-[10px] text-black leading-relaxed">
            An invitation email will be sent to the address below. The new member
            will be prompted to create their AEGIS RADAR credentials on first login.
          </div>
        </InsetPanel>

        {/* Email field */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10px] font-bold text-black">Email Address</label>
          <W95Input value={email} onChange={(v) => { setEmail(v); setError(""); }}
            placeholder="colleague@cib.com.eg" className="w-full" />
          {error && <span className="font-mono text-[9px] text-[#cc0000]">{error}</span>}
        </div>

        {/* Role selector */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10px] font-bold text-black">Assign Role</label>
          <W95Select value={role} onChange={(v) => setRole(v as Role)}
            options={[
              { value: "Admin",   label: "Admin — Full access" },
              { value: "Analyst", label: "Analyst — Manage alerts & reviews" },
              { value: "Viewer",  label: "Viewer — Read-only access" },
            ]}
            className="w-full" />
        </div>

        {/* Role description hint */}
        <div className="p-2" style={{ background: "#d8d8d8", borderStyle: "solid",
          borderWidth: "1px", borderColor: "#808080 white white #808080" }}>
          <div className="font-mono text-[9px] text-[#444] leading-relaxed">
            <span className="font-bold" style={{ color: ROLE_COLOR[role] }}>
              {ROLE_PERMISSIONS[role].icon} {role}:
            </span>{" "}
            {ROLE_PERMISSIONS[role].perms.slice(0, 3).join(" · ")}…
          </div>
        </div>

        {/* Seat usage */}
        <div className="flex items-center gap-2">
          <div className="font-mono text-[9px] text-[#555]">
            Seats used: {PLAN_INFO.seats.used} / {PLAN_INFO.seats.total}
          </div>
          <div className="flex-1 h-2" style={{ borderStyle: "solid", borderWidth: "1px",
            borderColor: "#808080 white white #808080", background: "#e0e0e0" }}>
            <div style={{ width: `${(PLAN_INFO.seats.used / PLAN_INFO.seats.total) * 100}%`,
              height: "100%", background: "#000080" }} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-1" style={{ borderTop: "1px solid #b0b0b0" }}>
          <W95Button onClick={onClose}>Cancel</W95Button>
          <W95Button onClick={handleSubmit} className="!font-bold"
            style={{ background: "#000080", color: "white",
              borderColor: "white white #808080 #808080" } as React.CSSProperties}>
            ✉ Send Invitation
          </W95Button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL: Confirmation dialog (generic)
// ═══════════════════════════════════════════════════════════════════════════════

function ConfirmModal({ title, message, onClose }: {
  title: string; message: string; onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose} width={380}>
      <div className="p-4 flex flex-col gap-3">
        {/* Icon + message */}
        <div className="flex items-start gap-3">
          <div className="font-mono text-3xl leading-none" style={{ color: "#000080" }}>ℹ</div>
          <InsetPanel className="bg-white flex-1 p-2">
            <div className="font-mono text-[11px] text-black leading-relaxed">{message}</div>
          </InsetPanel>
        </div>
        {/* Demo notice */}
        <div className="font-mono text-[9px] text-[#808080] text-center"
          style={{ borderTop: "1px solid #b0b0b0", paddingTop: "6px" }}>
          This is a demo environment. No changes have been persisted.
        </div>
        <div className="flex justify-center">
          <W95Button onClick={onClose} className="!px-8 !font-bold">OK</W95Button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL: Change Role
// ═══════════════════════════════════════════════════════════════════════════════

function ChangeRoleModal({ member, onClose, onConfirm }: {
  member: TeamMember; onClose: () => void;
  onConfirm: (newRole: Role) => void;
}) {
  const [role, setRole] = useState<Role>(member.role);
  return (
    <Modal title={`Change Role — ${member.name}`} onClose={onClose} width={400}>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="font-mono text-xs font-bold text-white flex items-center justify-center shrink-0"
            style={{ width: "32px", height: "32px", background: "#000080", border: "2px solid #808080" }}>
            {member.avatar}
          </div>
          <div>
            <div className="font-mono text-xs font-bold text-black">{member.name}</div>
            <div className="font-mono text-[10px] text-[#555]">{member.email}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-[#555]">Current:</span>
          <span className="font-mono text-[10px] font-bold px-2 py-0.5"
            style={{ background: ROLE_BG[member.role], color: ROLE_COLOR[member.role],
              border: `1px solid ${ROLE_COLOR[member.role]}` }}>
            {member.role}
          </span>
          <span className="font-mono text-[10px] text-[#555]">→ New:</span>
          <W95Select value={role} onChange={(v) => setRole(v as Role)}
            options={[
              { value: "Admin",   label: "Admin" },
              { value: "Analyst", label: "Analyst" },
              { value: "Viewer",  label: "Viewer" },
            ]} />
        </div>

        {/* Permission diff hint */}
        <InsetPanel className="bg-black p-2">
          <div className="font-mono text-[9px] text-[#00ff00] font-bold mb-1">
            ▶ {role} PERMISSIONS
          </div>
          {ROLE_PERMISSIONS[role].perms.map((p, i) => (
            <div key={i} className="font-mono text-[9px] text-[#00cc00] leading-relaxed">
              {i < 4 ? "✓" : "✗"} {p}
            </div>
          ))}
        </InsetPanel>

        <div className="flex gap-2 justify-end" style={{ borderTop: "1px solid #b0b0b0", paddingTop: "8px" }}>
          <W95Button onClick={onClose}>Cancel</W95Button>
          <W95Button onClick={() => onConfirm(role)} className="!font-bold"
            style={{ background: "#000080", color: "white",
              borderColor: "white white #808080 #808080" } as React.CSSProperties}>
            ✓ Apply Change
          </W95Button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORG HEADER SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function OrgHeader({ onAddMember }: { onAddMember: () => void }) {
  return (
    <Section title="AEGIS RADAR — Team & Access Management">
      <div className="flex items-center gap-4 flex-wrap">

        {/* Org logo area */}
        <InsetPanel className="flex items-center justify-center bg-[#000080] shrink-0"
          style={{ width: "64px", height: "64px" }}>
          <span className="font-mono text-white text-2xl font-bold">CIB</span>
        </InsetPanel>

        {/* Org details */}
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <div className="font-mono text-base font-bold text-black">{PLAN_INFO.org}</div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Plan badge */}
            <span className="font-mono text-[10px] font-bold px-2 py-0.5"
              style={{ background: "#000080", color: "white",
                borderStyle: "solid", borderWidth: "1px", borderColor: "white white #808080 #808080" }}>
              ⬡ {PLAN_INFO.name}
            </span>
            {/* Renewal notice */}
            <span className="font-mono text-[10px] text-[#cc7700] font-bold">
              ⏰ {PLAN_INFO.renewal}
            </span>
          </div>
          {/* Seat bar */}
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-[9px] text-[#555]">
              Team seats: {PLAN_INFO.seats.used} / {PLAN_INFO.seats.total}
            </span>
            <div className="w-32 h-2.5" style={{ borderStyle: "solid", borderWidth: "1px",
              borderColor: "#808080 white white #808080", background: "#e0e0e0" }}>
              <div style={{ width: `${(PLAN_INFO.seats.used / PLAN_INFO.seats.total) * 100}%`,
                height: "100%", background: "#000080" }} />
            </div>
            <span className="font-mono text-[9px] text-[#555]">
              {PLAN_INFO.seats.total - PLAN_INFO.seats.used} remaining
            </span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex flex-col gap-2 items-end shrink-0">
          <W95Button onClick={onAddMember} className="!font-bold !text-[11px]"
            style={{ background: "#000080", color: "white",
              borderColor: "white white #808080 #808080" } as React.CSSProperties}>
            ✉ Add Team Member
          </W95Button>
          <W95Button className="!text-[10px]">
            ↑ Upgrade Plan
          </W95Button>
        </div>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE PERMISSIONS REFERENCE SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════

function RoleReference() {
  return (
    <div className="flex flex-col gap-2" style={{ width: "230px", flexShrink: 0 }}>
      <div className="flex flex-col">
        <TitleBar title="Role Permissions" />
        <Panel className="p-2 flex flex-col gap-2">
          {(Object.entries(ROLE_PERMISSIONS) as [Role, typeof ROLE_PERMISSIONS[Role]][]).map(([role, info]) => (
            <div key={role}>
              {/* Role label */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-mono text-[10px] font-bold" style={{ color: info.color }}>
                  {info.icon} {role}
                </span>
              </div>
              <InsetPanel className="bg-black p-1.5">
                {info.perms.map((p, i) => (
                  <div key={i} className="font-mono text-[8px] leading-relaxed flex gap-1"
                    style={{ color: i < 5 ? "#00cc00" : "#cc4444" }}>
                    <span>{i < 5 ? "✓" : "✗"}</span>
                    <span>{p}</span>
                  </div>
                ))}
              </InsetPanel>
              {role !== "Viewer" && <div className="h-px mt-1.5" style={{ background: "#b0b0b0" }} />}
            </div>
          ))}
        </Panel>
      </div>

      {/* Audit log teaser */}
      <div className="flex flex-col">
        <TitleBar title="Recent Audit Log" />
        <Panel className="p-0">
          <InsetPanel className="bg-black p-2">
            {[
              { time: "09:14", user: "A.Mostafa",  action: "Blocked IP 41.x.x.x" },
              { time: "08:52", user: "S.El-Sayed", action: "Rule threshold updated" },
              { time: "Yesterday", user: "O.Khalil", action: "Flagged TX-A3F2K" },
              { time: "May 14", user: "N.Abdallah", action: "Exported CSV report" },
              { time: "May 12", user: "A.Mostafa",  action: "Added user K.Soliman" },
            ].map((entry, i) => (
              <div key={i} className="font-mono text-[8px] leading-relaxed"
                style={{ color: "#00cc00", borderBottom: i < 4 ? "1px solid #001800" : "none" }}>
                <span style={{ color: "#007700" }}>[{entry.time}]</span>{" "}
                <span style={{ color: "#00aaff" }}>{entry.user}</span>{" "}
                {entry.action}
              </div>
            ))}
          </InsetPanel>
        </Panel>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USERS TABLE
// ═══════════════════════════════════════════════════════════════════════════════

type ActionType = "changeRole" | "deactivate" | "activate" | "resend";

function UsersTable({
  members,
  onAction,
}: {
  members: TeamMember[];
  onAction: (member: TeamMember, action: ActionType) => void;
}) {
  return (
    <div className="flex flex-col flex-1 min-w-0">
      <TitleBar title={`Team Members — ${members.length} users`} />
      <Panel className="p-0">
        <div className="overflow-auto" style={{ maxHeight: "420px" }}>
          <table className="w-full border-collapse" style={{ minWidth: "530px" }}>
            <colgroup>
              <col style={{ width: "160px" }} />
              <col style={{ width: "200px" }} />
              <col style={{ width: "80px"  }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "80px"  }} />
              <col style={{ width: "160px" }} />
            </colgroup>

            {/* Header */}
            <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
              <tr>
                {["NAME", "EMAIL", "ROLE", "LAST ACTIVE", "STATUS", "ACTIONS"].map((h) => (
                  <th key={h}
                    className="px-2 py-1 text-left font-mono text-[10px] font-bold text-black bg-[#c0c0c0]"
                    style={{ borderStyle: "solid", borderWidth: "1px",
                      borderColor: "white white #808080 #808080", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {members.map((m, i) => (
                <tr key={m.id}
                  style={{ background: i % 2 === 0 ? "#ffffff" : "#f4f4f4" }}
                  className="hover:bg-[#dde8ff]">

                  {/* Name + avatar */}
                  <td className="px-2 py-1.5" style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-[9px] font-bold text-white flex items-center justify-center shrink-0"
                        style={{ width: "22px", height: "22px", background: "#000080",
                          border: "1px solid #808080" }}>
                        {m.avatar}
                      </div>
                      <span className="font-mono text-[11px] font-bold text-black">{m.name}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-2 py-1.5 font-mono text-[10px] text-[#444]"
                    style={{ borderBottom: "1px solid #e0e0e0" }}>
                    {m.email}
                  </td>

                  {/* Role badge */}
                  <td className="px-2 py-1.5" style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.5"
                      style={{ background: ROLE_BG[m.role], color: ROLE_COLOR[m.role],
                        border: `1px solid ${ROLE_COLOR[m.role]}` }}>
                      {ROLE_PERMISSIONS[m.role].icon} {m.role}
                    </span>
                  </td>

                  {/* Last active */}
                  <td className="px-2 py-1.5 font-mono text-[10px] text-[#555]"
                    style={{ borderBottom: "1px solid #e0e0e0" }}>
                    {m.lastActive}
                  </td>

                  {/* Status badge */}
                  <td className="px-2 py-1.5" style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.5"
                      style={{ background: STATUS_BG[m.status], color: STATUS_COLOR[m.status],
                        border: `1px solid ${STATUS_COLOR[m.status]}` }}>
                      {m.status === "Active"   ? "● Active"   :
                       m.status === "Inactive" ? "○ Inactive" : "◌ Pending"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-1" style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <div className="flex gap-1 flex-wrap">
                      <W95Button onClick={() => onAction(m, "changeRole")}
                        className="!text-[9px] !px-1.5 !py-px">
                        ✎ Role
                      </W95Button>
                      {m.status === "Active" && (
                        <W95Button onClick={() => onAction(m, "deactivate")}
                          className="!text-[9px] !px-1.5 !py-px"
                          style={{ color: "#cc0000" } as React.CSSProperties}>
                          ⊘ Deactivate
                        </W95Button>
                      )}
                      {m.status === "Inactive" && (
                        <W95Button onClick={() => onAction(m, "activate")}
                          className="!text-[9px] !px-1.5 !py-px"
                          style={{ color: "#006600" } as React.CSSProperties}>
                          ↺ Activate
                        </W95Button>
                      )}
                      {m.status === "Pending" && (
                        <W95Button onClick={() => onAction(m, "resend")}
                          className="!text-[9px] !px-1.5 !py-px">
                          ✉ Resend
                        </W95Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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

type ModalState =
  | { type: "add" }
  | { type: "changeRole"; member: TeamMember }
  | { type: "confirm"; title: string; message: string }
  | null;

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [modal,   setModal]   = useState<ModalState>(null);

  // ── Action dispatcher ──────────────────────────────────────────────────────
  const handleAction = (member: TeamMember, action: ActionType) => {
    if (action === "changeRole") {
      setModal({ type: "changeRole", member });
      return;
    }
    const messages: Record<ActionType, string> = {
      deactivate: `Action simulated for demo.\n\n"${member.name}" (${member.email}) would be deactivated. They will lose access to AEGIS RADAR immediately and be notified by email.`,
      activate:   `Action simulated for demo.\n\n"${member.name}" (${member.email}) would be reactivated with their previous role (${member.role}).`,
      resend:     `Action simulated for demo.\n\nA new invitation email would be sent to "${member.email}". The previous invite link will be invalidated.`,
      changeRole: "",
    };
    setModal({ type: "confirm", title: `${action.charAt(0).toUpperCase() + action.slice(1)} — ${member.name}`, message: messages[action] });
  };

  // ── Add member ─────────────────────────────────────────────────────────────
  const handleAdd = (email: string, role: Role) => {
    const nameParts = email.split("@")[0].split(".");
    const name = nameParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    const avatar = nameParts.map((p) => p[0]?.toUpperCase() ?? "?").join("").slice(0, 2);
    const newMember: TeamMember = {
      id: `u${Date.now()}`, name, email, role,
      lastActive: "—", status: "Pending", avatar,
    };
    setMembers((prev) => [...prev, newMember]);
    setModal({ type: "confirm", title: "Invitation Sent", message: `Action simulated for demo.\n\nAn invitation has been sent to "${email}" with the role "${role}". They will appear as Pending until they accept.` });
  };

  // ── Role change ────────────────────────────────────────────────────────────
  const handleRoleChange = (member: TeamMember, newRole: Role) => {
    setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, role: newRole } : m));
    setModal({ type: "confirm", title: "Role Updated", message: `Action simulated for demo.\n\n"${member.name}" role has been updated from ${member.role} → ${newRole}. Permissions take effect on next login.` });
  };

  return (
    <div className="flex flex-col overflow-y-auto" style={{ ...MONO, background: "#c0c0c0" }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-2 py-1.5 shrink-0"
        style={{ borderBottom: "2px solid #808080", background: "#c0c0c0" }}>
        <W95Button className="!text-[10px]">💾 Export Roster</W95Button>
        <W95Button className="!text-[10px]" onClick={() => window.print()}>🖨 Print</W95Button>
        <div className="w-px h-4 bg-[#808080] mx-1" />
        <W95Button className="!text-[10px]">🔒 Security Policy</W95Button>
        <W95Button className="!text-[10px]">📋 Audit Log</W95Button>
        <div className="flex-1" />
        <span className="font-mono text-[10px] text-[#444]">
          Org: CIB Egypt &nbsp;|&nbsp; {members.filter((m) => m.status === "Active").length} active users &nbsp;|&nbsp; May 17, 2025
        </span>
      </div>

      {/* ── Page content ── */}
      <div className="flex flex-col gap-3 p-3">

        {/* Org header */}
        <OrgHeader onAddMember={() => setModal({ type: "add" })} />

        {/* Main area: table + sidebar */}
        <div className="flex gap-3 items-start">
          <UsersTable members={members} onAction={handleAction} />
          <RoleReference />
        </div>

        {/* Footer */}
        <div className="font-mono text-[9px] text-[#555] text-center pb-1"
          style={{ borderTop: "1px solid #b0b0b0", paddingTop: "6px" }}>
          AEGIS RADAR v2.1 — Team & Access &nbsp;|&nbsp; Role changes take effect on next login
          &nbsp;|&nbsp; © 2025 AEGIS Systems, Cairo EG &nbsp;|&nbsp; All actions are audit-logged
        </div>
      </div>

      {/* ── Modals ── */}
      {modal?.type === "add" && (
        <AddMemberModal onClose={() => setModal(null)} onAdd={handleAdd} />
      )}
      {modal?.type === "changeRole" && (
        <ChangeRoleModal member={modal.member} onClose={() => setModal(null)}
          onConfirm={(role) => handleRoleChange(modal.member, role)} />
      )}
      {modal?.type === "confirm" && (
        <ConfirmModal title={modal.title} message={modal.message} onClose={() => setModal(null)} />
      )}

      {/* Scrollbar styling */}
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