"use client";

/**
 * src/app/dashboard/settings/page.tsx
 *
 * AEGIS RADAR — Settings page (backend-connected).
 * GET  /api/settings  → load org settings (all roles)
 * PUT  /api/settings  → save changes (Admin only)
 *
 * Auth: bearer token read via getToken() from your auth module.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getToken } from "@/lib/auth"; // adjust path if needed

// ═══════════════════════════════════════════════════════════════════════════════
// API TYPES — mirror backend Pydantic models exactly
// ═══════════════════════════════════════════════════════════════════════════════

interface GeneralSettings {
  organization_name: string;
  division:          string;
  industry:          string;
  primary_email:     string;
  timezone:          string;
  country:           string;
  language:          string;
}

interface SecuritySettings {
  fraud_threshold:      number;
  auto_block_high_risk: boolean;
  require_step_up_auth: boolean;
  block_vpn:            boolean;
  two_factor_enabled:   boolean;
}

interface NotificationSettings {
  email_alerts:  boolean;
  sms_alerts:    boolean;
  in_app_alerts: boolean;
  slack_webhook: string | null;
}

interface ApiSettings {
  webhook_url:    string | null;
  webhook_secret: string | null;
}

interface AppearanceSettings {
  theme:              string;
  density:            string;
  font_size:          string;
  date_format:        string;
  animations_enabled: boolean;
}

interface SettingsResponse {
  general:       GeneralSettings;
  security:      SecuritySettings;
  notifications: NotificationSettings;
  api:           ApiSettings;
  appearance:    AppearanceSettings;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function authHeaders(): HeadersInit {
  const token = getToken();
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (res.status === 401) { window.location.href = "/auth"; throw new Error("Unauthorized"); }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (res.status === 401) { window.location.href = "/auth"; throw new Error("Unauthorized"); }
  if (res.status === 403) throw new Error("Only Admins can modify settings.");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type SettingsTab = "general" | "security" | "api" | "billing" | "appearance" | "help";

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

function W95Input({ value, onChange, placeholder = "", className = "", type = "text", disabled }: {
  value: string; onChange?: (v: string) => void; placeholder?: string;
  className?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input type={type} value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder} disabled={disabled}
      className={`bg-white text-black text-xs px-1 py-0.5 ${className}`}
      style={{ ...MONO, borderStyle:"solid", borderWidth:"2px",
        borderColor:"#808080 white white #808080", outline:"none",
        opacity: disabled ? 0.6 : 1 }} />
  );
}

function W95Select({ value, onChange, options, className = "", disabled }: {
  value: string; onChange?: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string; disabled?: boolean;
}) {
  return (
    <select value={value} onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={`bg-white text-black text-xs px-1 py-0.5 ${className}`}
      style={{ ...MONO, borderStyle:"solid", borderWidth:"2px",
        borderColor:"#808080 white white #808080", outline:"none" }}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function W95Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div onClick={() => onChange(!checked)}
        className="flex items-center justify-center shrink-0"
        style={{ width:"13px", height:"13px", borderStyle:"solid", borderWidth:"2px",
          borderColor:"#808080 white white #808080", background:"white", cursor:"pointer" }}>
        {checked && <span style={{ fontSize:"10px", fontWeight:"bold", lineHeight:1 }}>✓</span>}
      </div>
      <span className="font-mono text-[11px] text-black">{label}</span>
    </label>
  );
}

function FormRow({ label, children, hint }: {
  label: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2" style={{ borderBottom:"1px solid #d0d0d0" }}>
      <label className="font-mono text-[10px] font-bold text-black shrink-0 pt-0.5"
        style={{ width:"160px" }}>
        {label}
      </label>
      <div className="flex flex-col gap-0.5 flex-1">
        {children}
        {hint && <span className="font-mono text-[9px] text-[#808080]">{hint}</span>}
      </div>
    </div>
  );
}

function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 my-2">
      <div className="flex-1 h-px" style={{ background:"#808080" }} />
      {label && <span className="font-mono text-[9px] text-[#808080] px-1 shrink-0">{label}</span>}
      <div className="flex-1 h-px" style={{ background:"#808080" }} />
    </div>
  );
}

// ── Toast banner ──────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: {
  message: string; type: "success"|"error"|"info"; onClose: () => void;
}) {
  const colors = {
    success: { bg:"#000080", border:"white white #404080 #404080", text:"white" },
    error:   { bg:"#cc0000", border:"white white #660000 #660000", text:"white" },
    info:    { bg:"#444",    border:"white white #222 #222",       text:"white" },
  }[type];
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-2"
      style={{ background:colors.bg, color:colors.text,
        borderStyle:"solid", borderWidth:"2px", borderColor:colors.border,
        boxShadow:"2px 2px 0 #000", ...MONO, fontSize:"11px", fontWeight:"bold" }}>
      {type === "success" ? "✓" : type === "error" ? "⚠" : "ℹ"} {message}
      <button onClick={onClose}
        style={{ background:"none", border:"none", color:colors.text,
          cursor:"pointer", fontFamily:"monospace", fontSize:"14px", marginLeft:"4px" }}>
        ×
      </button>
    </div>
  );
}

// ── Loading overlay ───────────────────────────────────────────────────────────

function LoadingPane() {
  return (
    <div className="flex items-center justify-center flex-1 py-16">
      <InsetPanel className="bg-black px-8 py-5">
        <div className="font-mono text-[11px] text-[#00ff00]">
          C:\AEGISRADAR&gt; load settings...
          <span style={{ display:"inline-block", width:"8px", height:"13px",
            background:"#00ff00", verticalAlign:"middle", marginLeft:"4px",
            animation:"blink 1s step-end infinite" }} />
        </div>
      </InsetPanel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECONDARY SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════

const NAV_ITEMS: { id: SettingsTab; icon: string; label: string }[] = [
  { id:"general",    icon:"🏢", label:"General"             },
  { id:"security",   icon:"🛡", label:"Security & Alerts"   },
  { id:"api",        icon:"⚙", label:"API & Integrations"  },
  { id:"billing",    icon:"💳", label:"Billing & Plan"      },
  { id:"appearance", icon:"🎨", label:"Appearance"          },
  { id:"help",       icon:"❓", label:"Help & Legal"        },
];

function SettingsSidebar({ active, onSelect }: {
  active: SettingsTab; onSelect: (t: SettingsTab) => void;
}) {
  return (
    <div className="flex flex-col shrink-0"
      style={{ width:"170px", borderRight:"2px solid #808080", background:"#c0c0c0" }}>
      <div className="font-mono text-[10px] font-bold text-white px-2 py-1 select-none"
        style={{ background:"#000080" }}>
        SETTINGS
      </div>
      <nav className="flex flex-col py-1">
        {NAV_ITEMS.map((item) => (
          <button key={item.id} onClick={() => onSelect(item.id)}
            className={`flex items-center gap-2 px-3 py-1.5 text-left w-full
              font-mono text-xs focus:outline-none
              ${active === item.id ? "bg-[#000080] text-white" : "text-black hover:bg-[#000080] hover:text-white"}`}>
            <span className="text-sm leading-none w-4 text-center">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto px-2 py-2" style={{ borderTop:"1px solid #b0b0b0" }}>
        <div className="font-mono text-[8px] text-[#808080] leading-relaxed">
          AEGIS RADAR V3.3.3<br />Build 20250517<br />© 2026 EXE Solutions
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: GENERAL
// ═══════════════════════════════════════════════════════════════════════════════

function GeneralTab({ data, onChange, onSave, saving, isAdmin }: {
  data: GeneralSettings;
  onChange: (patch: Partial<GeneralSettings>) => void;
  onSave: () => void;
  saving: boolean;
  isAdmin: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-xs font-bold text-black pb-1"
        style={{ borderBottom:"2px solid #808080" }}>
        General Settings — Organisation Profile
      </div>
      <FormRow label="Organisation Name">
        <W95Input value={data.organization_name}
          onChange={(v) => onChange({ organization_name: v })}
          className="w-full max-w-xs" disabled={!isAdmin} />
      </FormRow>
      <FormRow label="Division / Team" hint="Used in reports and exports">
        <W95Input value={data.division}
          onChange={(v) => onChange({ division: v })}
          className="w-full max-w-xs" disabled={!isAdmin} />
      </FormRow>
      <FormRow label="Industry">
        <W95Select value={data.industry}
          onChange={(v) => onChange({ industry: v })}
          disabled={!isAdmin}
          options={[
            { value:"Retail & Banking",    label:"Retail & Banking"     },
            { value:"ecommerce",           label:"E-Commerce"           },
            { value:"banking",             label:"Banking & Finance"    },
            { value:"telecom",             label:"Telecommunications"   },
            { value:"fintech",             label:"Fintech"              },
            { value:"government",          label:"Government"           },
          ]} className="w-48" />
      </FormRow>
      <FormRow label="Primary Country">
        <W95Select value={data.country}
          onChange={(v) => onChange({ country: v })}
          disabled={!isAdmin}
          options={[
            { value:"EG", label:"🇪🇬 Egypt"        },
            { value:"SA", label:"🇸🇦 Saudi Arabia" },
            { value:"AE", label:"🇦🇪 UAE"          },
          ]} className="w-48" />
      </FormRow>
      <FormRow label="Primary Email" hint="Used for critical fraud alerts">
        <W95Input value={data.primary_email} type="email"
          onChange={(v) => onChange({ primary_email: v })}
          className="w-full max-w-xs" disabled={!isAdmin} />
      </FormRow>
      <FormRow label="Timezone">
        <W95Select value={data.timezone}
          onChange={(v) => onChange({ timezone: v })}
          disabled={!isAdmin}
          options={[
            { value:"Africa/Cairo",  label:"Africa/Cairo (GMT+2)"  },
            { value:"Asia/Riyadh",   label:"Asia/Riyadh (GMT+3)"   },
            { value:"Asia/Dubai",    label:"Asia/Dubai (GMT+4)"    },
            { value:"Europe/London", label:"Europe/London (GMT+0)" },
          ]} className="w-56" />
      </FormRow>
      <FormRow label="Language">
        <W95Select value={data.language}
          onChange={(v) => onChange({ language: v })}
          disabled={!isAdmin}
          options={[
            { value:"en", label:"English"           },
            { value:"ar", label:"العربية (Arabic)"  },
          ]} className="w-40" />
      </FormRow>
      {isAdmin && (
        <div className="flex justify-end pt-1">
          <W95Button onClick={onSave} disabled={saving} className="!font-bold"
            style={{ background:"#000080", color:"white",
              borderColor:"white white #808080 #808080" } as React.CSSProperties}>
            {saving ? "⏳ Saving…" : "💾 Save Changes"}
          </W95Button>
        </div>
      )}
      {!isAdmin && (
        <div className="font-mono text-[9px] text-[#808080] text-right">
          Read-only — only Admins can modify settings
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: SECURITY
// ═══════════════════════════════════════════════════════════════════════════════

function SecurityTab({ data, onChange, onSave, saving, isAdmin }: {
  data: SecuritySettings;
  onChange: (patch: Partial<SecuritySettings>) => void;
  onSave: () => void;
  saving: boolean;
  isAdmin: boolean;
}) {
  const riskColor =
    data.fraud_threshold >= 0.8 ? "#cc0000" :
    data.fraud_threshold >= 0.6 ? "#cc7700" : "#006600";

  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-xs font-bold text-black pb-1"
        style={{ borderBottom:"2px solid #808080" }}>
        Security & Alerts — Risk Configuration
      </div>

      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">
          Global Risk Score Threshold
        </div>
        <div className="flex items-center gap-3">
          <input type="range" min={0} max={1} step={0.01}
            value={data.fraud_threshold}
            onChange={(e) => onChange({ fraud_threshold: parseFloat(e.target.value) })}
            disabled={!isAdmin}
            className="flex-1" style={{ accentColor:"#000080" }} />
          <InsetPanel className="bg-black px-3 py-1 shrink-0">
            <span className="font-mono text-lg font-bold" style={{ color:riskColor }}>
              {(data.fraud_threshold * 100).toFixed(0)}
            </span>
          </InsetPanel>
        </div>
        <div className="font-mono text-[9px] text-[#555] mt-1">
          Transactions with risk score ≥ {(data.fraud_threshold * 100).toFixed(0)} will be flagged.
          Setting: {data.fraud_threshold >= 0.8 ? "Strict" : data.fraud_threshold >= 0.55 ? "Balanced" : "Lenient"}.
        </div>
      </Panel>

      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">
          Automated Actions
        </div>
        <div className="flex flex-col gap-2">
          <W95Toggle checked={data.auto_block_high_risk}
            onChange={(v) => onChange({ auto_block_high_risk: v })}
            label="Auto-block transactions with risk score ≥ 90" />
          <W95Toggle checked={data.require_step_up_auth}
            onChange={(v) => onChange({ require_step_up_auth: v })}
            label="Require step-up auth for high-value electronics" />
          <W95Toggle checked={data.block_vpn}
            onChange={(v) => onChange({ block_vpn: v })}
            label="Block transactions from known VPN/proxy IPs" />
          <W95Toggle checked={data.two_factor_enabled}
            onChange={(v) => onChange({ two_factor_enabled: v })}
            label="Enforce 2FA for team logins from new devices" />
        </div>
      </Panel>

      {isAdmin && (
        <div className="flex justify-end">
          <W95Button onClick={onSave} disabled={saving} className="!font-bold"
            style={{ background:"#000080", color:"white",
              borderColor:"white white #808080 #808080" } as React.CSSProperties}>
            {saving ? "⏳ Saving…" : "💾 Save Changes"}
          </W95Button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: API & INTEGRATIONS
// ═══════════════════════════════════════════════════════════════════════════════

function ApiTab({ data, onChange, onSave, saving, isAdmin }: {
  data: ApiSettings;
  onChange: (patch: Partial<ApiSettings>) => void;
  onSave: () => void;
  saving: boolean;
  isAdmin: boolean;
}) {
  const [showSecret, setShowSecret] = useState(false);
  const [copied,     setCopied]     = useState(false);

  const copySecret = () => {
    if (data.webhook_secret) {
      navigator.clipboard.writeText(data.webhook_secret).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-xs font-bold text-black pb-1"
        style={{ borderBottom:"2px solid #808080" }}>
        API & Integrations — Webhooks
      </div>

      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">
          Webhook Configuration
        </div>
        <FormRow label="Endpoint URL" hint="AEGIS will POST JSON event payloads here">
          <W95Input value={data.webhook_url ?? ""}
            onChange={(v) => onChange({ webhook_url: v })}
            className="w-full max-w-sm" disabled={!isAdmin} />
        </FormRow>
        <FormRow label="Signing Secret" hint="Used to verify webhook payloads — keep private">
          <div className="flex gap-2 items-center">
            <W95Input value={data.webhook_secret ?? ""}
              type={showSecret ? "text" : "password"}
              onChange={(v) => onChange({ webhook_secret: v })}
              className="w-full max-w-sm" disabled={!isAdmin} />
            <W95Button onClick={() => setShowSecret((v) => !v)} className="!text-[10px] shrink-0">
              {showSecret ? "🙈" : "👁"}
            </W95Button>
            <W95Button onClick={copySecret} className="!text-[10px] shrink-0">
              {copied ? "✓" : "⎘"}
            </W95Button>
          </div>
        </FormRow>
        {isAdmin && (
          <div className="flex gap-2 mt-2">
            <W95Button className="!text-[10px]">📤 Send Test Payload</W95Button>
            <W95Button onClick={onSave} disabled={saving} className="!text-[10px] !font-bold"
              style={{ background:"#000080", color:"white",
                borderColor:"white white #808080 #808080" } as React.CSSProperties}>
              {saving ? "⏳ Saving…" : "💾 Save Webhook"}
            </W95Button>
          </div>
        )}
      </Panel>

      {/* Connected systems — static display */}
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">Connected Systems</div>
        {[
          { name:"Fawry",          icon:"💳", status:"Connected" },
          { name:"Paymob",         icon:"📱", status:"Connected" },
          { name:"ValU",           icon:"🏦", status:"Connected" },
          { name:"Salesforce CRM", icon:"☁",  status:"Pending"   },
          { name:"Tableau",        icon:"📊", status:"Connected" },
        ].map((c) => (
          <div key={c.name} className="flex items-center gap-3 py-1.5"
            style={{ borderBottom:"1px solid #d0d0d0" }}>
            <span className="text-base w-6 text-center shrink-0">{c.icon}</span>
            <span className="font-mono text-[11px] font-bold text-black flex-1">{c.name}</span>
            <span className="font-mono text-[9px]"
              style={{ color: c.status === "Connected" ? "#006600" : "#cc7700" }}>
              {c.status === "Connected" ? "● Connected" : "◌ Pending"}
            </span>
            <W95Button className="!text-[9px] !px-2 !py-px">
              {c.status === "Connected" ? "Configure" : "Connect"}
            </W95Button>
          </div>
        ))}
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: APPEARANCE
// ═══════════════════════════════════════════════════════════════════════════════

function AppearanceTab({ data, onChange, onSave, saving, isAdmin }: {
  data: AppearanceSettings;
  onChange: (patch: Partial<AppearanceSettings>) => void;
  onSave: () => void;
  saving: boolean;
  isAdmin: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-xs font-bold text-black pb-1"
        style={{ borderBottom:"2px solid #808080" }}>
        Appearance Settings
      </div>

      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">Display Options</div>
        <FormRow label="Table Density">
          <W95Select value={data.density}
            onChange={(v) => onChange({ density: v })}
            disabled={!isAdmin}
            options={[
              { value:"compact",     label:"Compact"     },
              { value:"comfortable", label:"Comfortable" },
              { value:"spacious",    label:"Spacious"    },
            ]} className="w-40" />
        </FormRow>
        <FormRow label="Font Size">
          <W95Select value={data.font_size}
            onChange={(v) => onChange({ font_size: v })}
            disabled={!isAdmin}
            options={[
              { value:"small",  label:"Small"  },
              { value:"medium", label:"Medium" },
              { value:"large",  label:"Large"  },
            ]} className="w-40" />
        </FormRow>
        <FormRow label="Date Format">
          <W95Select value={data.date_format}
            onChange={(v) => onChange({ date_format: v })}
            disabled={!isAdmin}
            options={[
              { value:"DD/MM/YYYY", label:"DD/MM/YYYY (Egyptian standard)" },
              { value:"MM/DD/YYYY", label:"MM/DD/YYYY"                     },
              { value:"YYYY-MM-DD", label:"YYYY-MM-DD (ISO 8601)"          },
            ]} className="w-52" />
        </FormRow>
        <div className="mt-2">
          <W95Toggle checked={data.animations_enabled}
            onChange={(v) => onChange({ animations_enabled: v })}
            label="Enable UI animations and transitions" />
        </div>
      </Panel>

      {/* Theme info — read-only since appearance tab was descoped */}
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-1">Active Theme</div>
        <div className="font-mono text-[9px] text-[#555]">
          Windows 95 Classic (win95) — the one true theme. Additional themes coming in v3.0.
        </div>
      </Panel>

      {isAdmin && (
        <div className="flex justify-end">
          <W95Button onClick={onSave} disabled={saving} className="!font-bold"
            style={{ background:"#000080", color:"white",
              borderColor:"white white #808080 #808080" } as React.CSSProperties}>
            {saving ? "⏳ Saving…" : "💾 Save Appearance"}
          </W95Button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: BILLING (static — no billing endpoint yet)
// ═══════════════════════════════════════════════════════════════════════════════

function BillingTab() {
  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-xs font-bold text-black pb-1"
        style={{ borderBottom:"2px solid #808080" }}>
        Billing & Subscription
      </div>
      <InsetPanel className="bg-[#000080] p-3 flex items-center gap-4">
        <div>
          <div className="font-mono text-base font-bold text-white">Professional Plan</div>
          <div className="font-mono text-[10px] text-[#88aaff]">
            Renews June 1, 2025 · EGP 3,800 / month · Annual billing
          </div>
        </div>
        <div className="flex-1" />
        <W95Button className="!text-[10px] !font-bold shrink-0"
          style={{ background:"#ffffff", color:"#000080",
            borderColor:"white white #808080 #808080" } as React.CSSProperties}>
          ↑ Upgrade
        </W95Button>
      </InsetPanel>
      <Panel className="p-3">
        <div className="font-mono text-[10px] text-[#555]">
          Full billing management is available on the Subscription page.
        </div>
        <div className="mt-2">
          <Link href="/dashboard/subscription"
            className="font-mono text-[10px] text-[#000080] underline">
            → Go to Subscription & Billing
          </Link>
        </div>
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: HELP & LEGAL (static)
// ═══════════════════════════════════════════════════════════════════════════════

function HelpTab() {
  const LINKS = [
    { icon:"📖", label:"Documentation",  url:"https://docs.aegisradar.io",        desc:"API reference and integration guides" },
    { icon:"❓", label:"FAQ",            url:"https://help.aegisradar.io/faq",    desc:"Common setup and billing questions"  },
    { icon:"💬", label:"Contact Support",url:"mailto:support@aegisradar.io",      desc:"support@aegisradar.io · Business hrs" },
    { icon:"🐛", label:"Report a Bug",   url:"https://github.com/aegis-radar",   desc:"Open a GitHub issue"                 },
    { icon:"🔔", label:"Status Page",    url:"https://status.aegisradar.io",      desc:"Uptime and incident reports"         },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-xs font-bold text-black pb-1"
        style={{ borderBottom:"2px solid #808080" }}>
        Help & Legal
      </div>
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">Support & Resources</div>
        <div className="grid grid-cols-2 gap-2">
          {LINKS.map((l) => (
            <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
              className="flex items-start gap-2 p-2 no-underline"
              style={{ borderStyle:"solid", borderWidth:"2px",
                borderColor:"white white #808080 #808080",
                background:"#e8e8e8", textDecoration:"none" }}>
              <span className="text-base shrink-0">{l.icon}</span>
              <div>
                <div className="font-mono text-[10px] font-bold text-[#000080]">{l.label}</div>
                <div className="font-mono text-[8px] text-[#555]">{l.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </Panel>
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-1">System Information</div>
        {[
          ["Platform",   "AEGIS RADAR V3.3.3"],
          ["Framework",  "Next.js 16 App Router"],
          ["Data Region","eu-west-1 — GDPR compliant"],
          ["Uptime 30d", "99.97%"],
        ].map(([k,v]) => (
          <div key={k as string} className="flex gap-2 py-0.5"
            style={{ borderBottom:"1px solid #d0d0d0" }}>
            <span className="font-mono text-[9px] text-[#555] shrink-0" style={{ width:"100px" }}>{k}:</span>
            <span className="font-mono text-[9px] font-bold text-black">{v}</span>
          </div>
        ))}
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE ROOT
// ═══════════════════════════════════════════════════════════════════════════════

const TAB_TITLES: Record<SettingsTab, string> = {
  general:    "General — Organisation Settings",
  security:   "Security & Alerts — Risk Configuration",
  api:        "API & Integrations — Webhooks",
  billing:    "Billing & Subscription",
  appearance: "Appearance — Display Preferences",
  help:       "Help & Legal — Support Resources",
};

export default function SettingsPage() {
  const [activeTab,  setActiveTab]  = useState<SettingsTab>("general");
  const [settings,   setSettings]   = useState<SettingsResponse | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState<{ msg:string; type:"success"|"error"|"info" } | null>(null);
  const [isAdmin,    setIsAdmin]    = useState(false);

  // Detect role from localStorage (set by persistAuth)
  useEffect(() => {
    const role =
      localStorage.getItem("role") ??
      sessionStorage.getItem("role") ?? "";
    setIsAdmin(role === "Admin");
  }, []);

  // ── Load settings ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<SettingsResponse>("/api/settings");
      setSettings(data);
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : "Failed to load settings", type:"error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Patch helpers ─────────────────────────────────────────────────────────
  const patchGeneral     = (p: Partial<GeneralSettings>)      =>
    setSettings((s) => s ? { ...s, general:      { ...s.general,      ...p } } : s);
  const patchSecurity    = (p: Partial<SecuritySettings>)     =>
    setSettings((s) => s ? { ...s, security:     { ...s.security,     ...p } } : s);
  const patchApi         = (p: Partial<ApiSettings>)          =>
    setSettings((s) => s ? { ...s, api:          { ...s.api,          ...p } } : s);
  const patchAppearance  = (p: Partial<AppearanceSettings>)   =>
    setSettings((s) => s ? { ...s, appearance:   { ...s.appearance,   ...p } } : s);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await apiPut("/api/settings", {
        organization_name: settings.general.organization_name,
        ...settings.security,
        ...settings.notifications,
        ...settings.api,
        ...settings.appearance,
      });
      setToast({ msg:"Settings saved successfully", type:"success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : "Save failed", type:"error" });
    } finally {
      setSaving(false);
    }
  }, [settings]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ ...MONO, background:"#c0c0c0" }}>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-2 py-1.5 shrink-0"
        style={{ borderBottom:"2px solid #808080", background:"#c0c0c0" }}>
        <W95Button onClick={handleSave} disabled={saving || !isAdmin} className="!text-[10px]">
          {saving ? "⏳ Saving…" : "💾 Save Changes"}
        </W95Button>
        <W95Button onClick={load} className="!text-[10px]">↺ Reload</W95Button>
        <div className="flex-1" />
        <span className="font-mono text-[10px] text-[#444]">
          AEGIS RADAR Settings &nbsp;|&nbsp;
          {isAdmin ? "Admin — full access" : "Read-only — contact Admin to make changes"}
        </span>
      </div>

      {/* Win95 title bar for the settings window */}
      <TitleBar title={`Settings — ${TAB_TITLES[activeTab]}`} />

      {/* Body: secondary sidebar + content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <SettingsSidebar active={activeTab} onSelect={setActiveTab} />

        <div className="flex-1 overflow-y-auto p-3 min-w-0">
          {loading ? (
            <LoadingPane />
          ) : !settings ? (
            <div className="font-mono text-[10px] text-[#808080] p-4">
              Failed to load settings.{" "}
              <button onClick={load} className="text-[#000080] underline"
                style={{ background:"none", border:"none", cursor:"pointer", ...MONO, fontSize:"10px" }}>
                Retry
              </button>
            </div>
          ) : (
            <>
              {activeTab === "general" && (
                <GeneralTab data={settings.general} onChange={patchGeneral}
                  onSave={handleSave} saving={saving} isAdmin={isAdmin} />
              )}
              {activeTab === "security" && (
                <SecurityTab data={settings.security} onChange={patchSecurity}
                  onSave={handleSave} saving={saving} isAdmin={isAdmin} />
              )}
              {activeTab === "api" && (
                <ApiTab data={settings.api} onChange={patchApi}
                  onSave={handleSave} saving={saving} isAdmin={isAdmin} />
              )}
              {activeTab === "billing"    && <BillingTab />}
              {activeTab === "appearance" && (
                <AppearanceTab data={settings.appearance} onChange={patchAppearance}
                  onSave={handleSave} saving={saving} isAdmin={isAdmin} />
              )}
              {activeTab === "help" && <HelpTab />}
            </>
          )}

          {/* Footer */}
          <div className="font-mono text-[9px] text-[#555] text-center mt-4 pb-1"
            style={{ borderTop:"1px solid #b0b0b0", paddingTop:"6px" }}>
            AEGIS RADAR V3.3.3 — Settings &nbsp;|&nbsp; © 2026 EXE Solutions, Cairo EG
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}