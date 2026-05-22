"use client";

/**
 * src/app/dashboard/settings/page.tsx
 *
 * AEGIS RADAR — Settings page.
 * Secondary Win95 explorer-style sidebar + tabbed main content area.
 * Sections: General · Security & Alerts · API & Integrations ·
 *           Billing & Subscription · Appearance · Help & Legal
 *
 * Lives inside layout.tsx (Win95 shell + sidebar). Fully self-contained.
 */

import { useState, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type SettingsTab =
  | "general"
  | "security"
  | "api"
  | "billing"
  | "appearance"
  | "help";

// ═══════════════════════════════════════════════════════════════════════════════
// WIN95 PRIMITIVES
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
    <div
      className="flex items-center justify-between px-2 select-none shrink-0"
      style={{ background: "linear-gradient(to right,#000080,#1084d0)", height: "20px" }}
    >
      <span className="text-white text-[10px] font-bold tracking-wide truncate mr-1" style={MONO}>
        {title}
      </span>
      <div className="flex gap-px shrink-0">
        {["−", "□", "×"].map((b) => (
          <button
            key={b}
            style={{
              fontSize: "8px", width: "14px", height: "12px", cursor: "default",
              borderStyle: "solid", borderWidth: "1px",
              borderColor: "white white #808080 #808080",
              background: "#c0c0c0", display: "flex",
              alignItems: "center", justifyContent: "center", ...MONO,
            }}
          >
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}

function Panel({
  children, className = "", style,
}: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div
      className={`bg-[#c0c0c0] ${className}`}
      style={{ borderStyle: "solid", borderWidth: "2px",
        borderColor: "white white #808080 #808080", ...style }}
    >
      {children}
    </div>
  );
}

function InsetPanel({
  children, className = "", style,
}: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{ borderStyle: "solid", borderWidth: "2px",
        borderColor: "#808080 white white #808080", ...style }}
    >
      {children}
    </div>
  );
}

/** Horizontal divider with optional label */
function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 my-2">
      <div className="flex-1 h-px" style={{ background: "#808080" }} />
      {label && (
        <span className="font-mono text-[9px] text-[#808080] px-1 shrink-0">{label}</span>
      )}
      <div className="flex-1 h-px" style={{ background: "#808080" }} />
    </div>
  );
}

/** A labeled form row */
function FormRow({
  label, children, hint,
}: {
  label: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2" style={{ borderBottom: "1px solid #d0d0d0" }}>
      <label className="font-mono text-[10px] font-bold text-black shrink-0 pt-0.5"
        style={{ width: "160px" }}>
        {label}
      </label>
      <div className="flex flex-col gap-0.5 flex-1">
        {children}
        {hint && <span className="font-mono text-[9px] text-[#808080]">{hint}</span>}
      </div>
    </div>
  );
}

/** Win95 text input */
function W95Input({
  value, onChange, placeholder = "", className = "", type = "text", disabled,
}: {
  value: string; onChange?: (v: string) => void; placeholder?: string;
  className?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`bg-white text-black text-xs px-1 py-0.5 ${className}`}
      style={{ ...MONO, borderStyle: "solid", borderWidth: "2px",
        borderColor: "#808080 white white #808080", outline: "none",
        opacity: disabled ? 0.6 : 1 }}
    />
  );
}

/** Win95 select */
function W95Select({
  value, onChange, options, className = "", disabled,
}: {
  value: string; onChange?: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string; disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={`bg-white text-black text-xs px-1 py-0.5 ${className}`}
      style={{ ...MONO, borderStyle: "solid", borderWidth: "2px",
        borderColor: "#808080 white white #808080", outline: "none" }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/** Toggle checkbox styled as Win95 checkbox */
function W95Toggle({
  checked, onChange, label,
}: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className="flex items-center justify-center shrink-0"
        style={{
          width: "13px", height: "13px",
          borderStyle: "solid", borderWidth: "2px",
          borderColor: "#808080 white white #808080",
          background: "white", cursor: "pointer",
        }}
      >
        {checked && <span className="font-mono text-[10px] font-bold text-black leading-none">✓</span>}
      </div>
      <span className="font-mono text-[11px] text-black">{label}</span>
    </label>
  );
}

/** Win95 radio button */
function W95Radio({
  checked, onChange, label,
}: {
  checked: boolean; onChange: () => void; label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={onChange}
        className="flex items-center justify-center shrink-0 rounded-full"
        style={{
          width: "13px", height: "13px",
          borderStyle: "solid", borderWidth: "2px",
          borderColor: "#808080 white white #808080",
          background: "white", cursor: "pointer",
        }}
      >
        {checked && (
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#000" }} />
        )}
      </div>
      <span className="font-mono text-[11px] text-black">{label}</span>
    </label>
  );
}

/** Toast-style save confirmation */
function SaveBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 font-mono text-[11px] font-bold"
      style={{ background: "#000080", color: "white",
        borderStyle: "solid", borderWidth: "2px", borderColor: "white white #808080 #808080",
        boxShadow: "2px 2px 0 #000", animation: "fadeIn 0.15s ease" }}
    >
      ✓ Settings saved (demo — no data persisted)
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECONDARY SIDEBAR NAV
// ═══════════════════════════════════════════════════════════════════════════════

const NAV_ITEMS: { id: SettingsTab; icon: string; label: string }[] = [
  { id: "general",    icon: "🏢", label: "General"              },
  { id: "security",   icon: "🛡", label: "Security & Alerts"    },
  { id: "api",        icon: "⚙", label: "API & Integrations"   },
  { id: "billing",    icon: "💳", label: "Billing & Plan"       },
  { id: "appearance", icon: "🎨", label: "Appearance"           },
  { id: "help",       icon: "❓", label: "Help & Legal"         },
];

function SettingsSidebar({
  active, onSelect,
}: {
  active: SettingsTab; onSelect: (t: SettingsTab) => void;
}) {
  return (
    <div
      className="flex flex-col shrink-0"
      style={{ width: "170px", borderRight: "2px solid #808080", background: "#c0c0c0" }}
    >
      {/* Explorer-style header */}
      <div
        className="font-mono text-[10px] font-bold text-white px-2 py-1 select-none"
        style={{ background: "#000080" }}
      >
        SETTINGS
      </div>

      {/* Nav items */}
      <nav className="flex flex-col py-1">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-left w-full
                font-mono text-xs focus:outline-none transition-none
                ${isActive ? "bg-[#000080] text-white" : "text-black hover:bg-[#000080] hover:text-white"}`}
            >
              <span className="text-sm leading-none w-4 text-center" aria-hidden="true">
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Version footer */}
      <div className="mt-auto px-2 py-2" style={{ borderTop: "1px solid #b0b0b0" }}>
        <div className="font-mono text-[8px] text-[#808080] leading-relaxed">
          AEGIS RADAR v2.1<br />
          Build 20250517<br />
          © 2025 AEGIS Systems
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: GENERAL
// ═══════════════════════════════════════════════════════════════════════════════

function GeneralTab({ onSave }: { onSave: () => void }) {
  const [org,      setOrg]      = useState("CIB Egypt");
  const [division, setDivision] = useState("E-Commerce Division");
  const [industry, setIndustry] = useState("banking");
  const [email,    setEmail]    = useState("fraud-ops@cib.com.eg");
  const [timezone, setTimezone] = useState("Africa/Cairo");
  const [country,  setCountry]  = useState("EG");
  const [language, setLanguage] = useState("en");

  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-xs font-bold text-black pb-1"
        style={{ borderBottom: "2px solid #808080" }}>
        General Settings — Organisation Profile
      </div>

      <div>
        <FormRow label="Organisation Name">
          <W95Input value={org} onChange={setOrg} className="w-full max-w-xs" />
        </FormRow>
        <FormRow label="Division / Team" hint="Used in reports and exports">
          <W95Input value={division} onChange={setDivision} className="w-full max-w-xs" />
        </FormRow>
        <FormRow label="Industry">
          <W95Select value={industry} onChange={setIndustry} options={[
            { value: "banking",    label: "Banking & Finance" },
            { value: "ecommerce",  label: "E-Commerce" },
            { value: "telecom",    label: "Telecommunications" },
            { value: "insurance",  label: "Insurance" },
            { value: "government", label: "Government" },
          ]} className="w-48" />
        </FormRow>
        <FormRow label="Primary Country">
          <W95Select value={country} onChange={setCountry} options={[
            { value: "EG", label: "🇪🇬 Egypt" },
            { value: "SA", label: "🇸🇦 Saudi Arabia" },
            { value: "AE", label: "🇦🇪 UAE" },
          ]} className="w-48" />
        </FormRow>
        <FormRow label="Contact Email" hint="Used for critical fraud alerts and billing">
          <W95Input value={email} onChange={setEmail} type="email" className="w-full max-w-xs" />
        </FormRow>
        <FormRow label="Timezone">
          <W95Select value={timezone} onChange={setTimezone} options={[
            { value: "Africa/Cairo",  label: "Africa/Cairo (GMT+2)" },
            { value: "Asia/Riyadh",   label: "Asia/Riyadh (GMT+3)" },
            { value: "Asia/Dubai",    label: "Asia/Dubai (GMT+4)" },
            { value: "Europe/London", label: "Europe/London (GMT+0)" },
          ]} className="w-56" />
        </FormRow>
        <FormRow label="Dashboard Language">
          <W95Select value={language} onChange={setLanguage} options={[
            { value: "en", label: "English" },
            { value: "ar", label: "العربية (Arabic)" },
          ]} className="w-40" />
        </FormRow>
      </div>

      <div className="flex justify-end pt-1">
        <W95Button onClick={onSave} className="!font-bold"
          style={{ background: "#000080", color: "white",
            borderColor: "white white #808080 #808080" } as React.CSSProperties}>
          💾 Save Changes
        </W95Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: SECURITY & ALERTS
// ═══════════════════════════════════════════════════════════════════════════════

function SecurityTab({ onSave }: { onSave: () => void }) {
  const [threshold,    setThreshold]    = useState(65);
  const [emailAlert,   setEmailAlert]   = useState(true);
  const [inAppAlert,   setInAppAlert]   = useState(true);
  const [smsAlert,     setSmsAlert]     = useState(false);
  const [slackAlert,   setSlackAlert]   = useState(false);
  const [autoBlock,    setAutoBlock]    = useState(true);
  const [autoReview,   setAutoReview]   = useState(true);
  const [blockNigeria, setBlockNigeria] = useState(true);
  const [blockVPN,     setBlockVPN]     = useState(true);
  const [stepUpAuth,   setStepUpAuth]   = useState(true);
  const [twoFA,        setTwoFA]        = useState(true);

  const riskColor = threshold >= 80 ? "#cc0000" : threshold >= 60 ? "#cc7700" : "#006600";

  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-xs font-bold text-black pb-1"
        style={{ borderBottom: "2px solid #808080" }}>
        Security & Alerts — Risk Configuration
      </div>

      {/* Risk threshold */}
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">
          Global Risk Score Threshold
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range" min={0} max={100} value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="flex-1" style={{ accentColor: "#000080" }}
          />
          <InsetPanel className="bg-black px-3 py-1 shrink-0">
            <span className="font-mono text-lg font-bold" style={{ color: riskColor }}>
              {threshold}
            </span>
          </InsetPanel>
        </div>
        <div className="font-mono text-[9px] text-[#555] mt-1">
          Transactions with a risk score ≥ <b>{threshold}</b> will be automatically flagged.
          Current setting: {threshold >= 80 ? "Strict" : threshold >= 55 ? "Balanced" : "Lenient"}.
        </div>
      </Panel>

      {/* Notification channels */}
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">
          Notification Channels
        </div>
        <div className="grid grid-cols-2 gap-2">
          <W95Toggle checked={emailAlert}  onChange={setEmailAlert}  label="Email Alerts" />
          <W95Toggle checked={inAppAlert}  onChange={setInAppAlert}  label="In-App Notifications" />
          <W95Toggle checked={smsAlert}    onChange={setSmsAlert}    label="SMS Alerts (Vodafone/Orange)" />
          <W95Toggle checked={slackAlert}  onChange={setSlackAlert}  label="Slack Webhook" />
        </div>
        {smsAlert && (
          <div className="mt-2">
            <FormRow label="SMS Phone Number">
              <W95Input value="+20 100 000 0000" className="w-40"
                placeholder="Egyptian mobile number required" />
            </FormRow>
          </div>
        )}
        {slackAlert && (
          <div className="mt-2">
            <FormRow label="Slack Webhook URL">
              <W95Input value="https://hooks.slack.com/services/..." className="w-full max-w-sm" />
            </FormRow>
          </div>
        )}
      </Panel>

      {/* Auto-actions */}
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">
          Automated Actions
        </div>
        <div className="flex flex-col gap-2">
          <W95Toggle checked={autoBlock}    onChange={setAutoBlock}    label="Auto-block transactions with risk score ≥ 90" />
          <W95Toggle checked={autoReview}   onChange={setAutoReview}   label="Auto-flag transactions with risk score 65–89 for review" />
          <W95Toggle checked={blockNigeria} onChange={setBlockNigeria} label="Block all transactions from Nigeria (current rule)" />
          <W95Toggle checked={blockVPN}     onChange={setBlockVPN}     label="Block transactions from known VPN/proxy IPs" />
          <W95Toggle checked={stepUpAuth}   onChange={setStepUpAuth}   label="Require step-up auth for electronics MCC > EGP 2,500" />
          <W95Toggle checked={twoFA}        onChange={setTwoFA}        label="Enforce 2FA for team logins from new devices" />
        </div>
      </Panel>

      <div className="flex justify-end">
        <W95Button onClick={onSave} className="!font-bold"
          style={{ background: "#000080", color: "white",
            borderColor: "white white #808080 #808080" } as React.CSSProperties}>
          💾 Save Changes
        </W95Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: API & INTEGRATIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface ApiKey {
  id:        string;
  name:      string;
  key:       string;
  created:   string;
  lastUsed:  string;
  scope:     string;
  active:    boolean;
}

const INITIAL_KEYS: ApiKey[] = [
  { id:"k1", name:"Production",    key:"aegis_live_sk_4xK9mN2pQrT8vWzA",  created:"Jan 12, 2025", lastUsed:"Today, 09:11",   scope:"read,write", active:true  },
  { id:"k2", name:"Analytics App", key:"aegis_live_sk_7hR3jL6cUeY1oBsD",  created:"Mar 04, 2025", lastUsed:"May 14, 08:44",  scope:"read",       active:true  },
  { id:"k3", name:"Dev / Staging", key:"aegis_test_sk_2wX5nP9qMvC4gIuF",  created:"Apr 28, 2025", lastUsed:"Yesterday",      scope:"read,write", active:true  },
  { id:"k4", name:"Legacy CRM",    key:"aegis_live_sk_1aB8dE0fGhJkLmNo",  created:"Oct 18, 2024", lastUsed:"Feb 02, 2025",   scope:"read",       active:false },
];

function ApiTab({ onSave }: { onSave: () => void }) {
  const [keys,       setKeys]       = useState<ApiKey[]>(INITIAL_KEYS);
  const [webhookUrl, setWebhookUrl] = useState("https://api.cib.com.eg/aegis/webhook");
  const [webhookSec, setWebhookSec] = useState("whsec_cib_prod_Xp2mKvNqR8tA");
  const [revealed,   setRevealed]   = useState<Set<string>>(new Set());
  const [copied,     setCopied]     = useState<string | null>(null);

  const toggleReveal = (id: string) =>
    setRevealed((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const copyKey = (id: string, key: string) => {
    navigator.clipboard.writeText(key).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const revokeKey = (id: string) =>
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, active: false } : k));

  const generateKey = () => {
    const rand = () => Math.random().toString(36).substring(2).toUpperCase();
    const newKey: ApiKey = {
      id:       `k${Date.now()}`,
      name:     "New Key",
      key:      `aegis_live_sk_${rand()}${rand()}`.slice(0, 38),
      created:  "Today",
      lastUsed: "—",
      scope:    "read",
      active:   true,
    };
    setKeys((prev) => [newKey, ...prev]);
  };

  const CONNECTED = [
    { name:"Fawry",          icon:"💳", status:"Connected", since:"Jan 2025" },
    { name:"Paymob",         icon:"📱", status:"Connected", since:"Mar 2025" },
    { name:"ValU",           icon:"🏦", status:"Connected", since:"Apr 2025" },
    { name:"Salesforce CRM", icon:"☁",  status:"Pending",   since:"—"       },
    { name:"Tableau",        icon:"📊", status:"Connected", since:"Feb 2025" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-xs font-bold text-black pb-1"
        style={{ borderBottom: "2px solid #808080" }}>
        API & Integrations — Keys, Webhooks, Connected Systems
      </div>

      {/* API Keys */}
      <Panel className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] font-bold text-black">API Keys</span>
          <W95Button onClick={generateKey} className="!text-[10px]"
            style={{ background: "#000080", color: "white",
              borderColor: "white white #808080 #808080" } as React.CSSProperties}>
            ⊕ Generate New Key
          </W95Button>
        </div>

        <InsetPanel className="bg-white overflow-auto" style={{ maxHeight: "210px" }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "#c0c0c0" }}>
                {["NAME","KEY","CREATED","LAST USED","SCOPE","STATUS","ACTIONS"].map((h) => (
                  <th key={h} className="px-2 py-1 text-left font-mono text-[9px] font-bold text-black"
                    style={{ borderStyle:"solid", borderWidth:"1px",
                      borderColor:"white white #808080 #808080", whiteSpace:"nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((k, i) => (
                <tr key={k.id} style={{ background: i % 2 === 0 ? "#fff" : "#f4f4f4",
                  opacity: k.active ? 1 : 0.55 }}>
                  <td className="px-2 py-1 font-mono text-[10px] font-bold text-black"
                    style={{ borderBottom:"1px solid #e0e0e0" }}>{k.name}</td>
                  <td className="px-2 py-1 font-mono text-[9px]"
                    style={{ borderBottom:"1px solid #e0e0e0", color:"#000080", fontStyle:"normal" }}>
                    {revealed.has(k.id)
                      ? k.key
                      : `${k.key.slice(0, 18)}${"•".repeat(8)}`}
                  </td>
                  <td className="px-2 py-1 font-mono text-[9px] text-[#555]"
                    style={{ borderBottom:"1px solid #e0e0e0", whiteSpace:"nowrap" }}>{k.created}</td>
                  <td className="px-2 py-1 font-mono text-[9px] text-[#555]"
                    style={{ borderBottom:"1px solid #e0e0e0", whiteSpace:"nowrap" }}>{k.lastUsed}</td>
                  <td className="px-2 py-1 font-mono text-[9px] text-[#555]"
                    style={{ borderBottom:"1px solid #e0e0e0" }}>{k.scope}</td>
                  <td className="px-2 py-1" style={{ borderBottom:"1px solid #e0e0e0" }}>
                    <span className="font-mono text-[9px] font-bold px-1"
                      style={{ color: k.active ? "#006600" : "#808080",
                        background: k.active ? "#ddffdd" : "#e8e8e8",
                        border: `1px solid ${k.active ? "#006600" : "#808080"}` }}>
                      {k.active ? "● Active" : "○ Revoked"}
                    </span>
                  </td>
                  <td className="px-2 py-1" style={{ borderBottom:"1px solid #e0e0e0" }}>
                    <div className="flex gap-1">
                      <W95Button onClick={() => toggleReveal(k.id)}
                        className="!text-[8px] !px-1 !py-px">
                        {revealed.has(k.id) ? "🙈" : "👁"}
                      </W95Button>
                      <W95Button onClick={() => copyKey(k.id, k.key)}
                        className="!text-[8px] !px-1 !py-px">
                        {copied === k.id ? "✓" : "⎘"}
                      </W95Button>
                      {k.active && (
                        <W95Button onClick={() => revokeKey(k.id)}
                          className="!text-[8px] !px-1 !py-px"
                          style={{ color: "#cc0000" } as React.CSSProperties}>
                          ⊘
                        </W95Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </InsetPanel>
        <div className="font-mono text-[9px] text-[#808080] mt-1">
          API keys grant programmatic access to AEGIS RADAR. Treat them like passwords — never commit to source control.
        </div>
      </Panel>

      {/* Webhook */}
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">Webhook Configuration</div>
        <FormRow label="Endpoint URL" hint="AEGIS will POST JSON event payloads to this URL">
          <W95Input value={webhookUrl} onChange={setWebhookUrl} className="w-full max-w-sm" />
        </FormRow>
        <FormRow label="Signing Secret" hint="Used to verify webhook payloads — keep this private">
          <div className="flex gap-2 items-center">
            <W95Input value={webhookSec} className="w-full max-w-sm font-mono"
              type="password" disabled />
            <W95Button onClick={() => setWebhookSec(`whsec_${Math.random().toString(36).slice(2,18)}`)}
              className="!text-[10px] shrink-0">
              ↺ Rotate
            </W95Button>
          </div>
        </FormRow>
        <div className="flex gap-2 mt-2">
          <W95Button onClick={onSave} className="!text-[10px]">📤 Send Test Payload</W95Button>
          <W95Button onClick={onSave} className="!text-[10px] !font-bold"
            style={{ background:"#000080", color:"white",
              borderColor:"white white #808080 #808080" } as React.CSSProperties}>
            💾 Save Webhook
          </W95Button>
        </div>
      </Panel>

      {/* Connected systems */}
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">Connected Systems</div>
        <div className="flex flex-col gap-1">
          {CONNECTED.map((c) => (
            <div key={c.name} className="flex items-center gap-3 py-1.5"
              style={{ borderBottom: "1px solid #d0d0d0" }}>
              <span className="text-base w-6 text-center shrink-0">{c.icon}</span>
              <span className="font-mono text-[11px] font-bold text-black flex-1">{c.name}</span>
              <span className="font-mono text-[9px]" style={{ color: c.status === "Connected" ? "#006600" : "#cc7700" }}>
                {c.status === "Connected" ? "● Connected" : "◌ Pending"}
              </span>
              <span className="font-mono text-[9px] text-[#808080] w-20 text-right">
                {c.since !== "—" ? `Since ${c.since}` : "—"}
              </span>
              <W95Button className="!text-[9px] !px-2 !py-px">
                {c.status === "Connected" ? "Configure" : "Connect"}
              </W95Button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: BILLING
// ═══════════════════════════════════════════════════════════════════════════════

function BillingTab() {
  const FEATURES = [
    ["Team seats",            "7 / 10 used"],
    ["API calls (monthly)",   "284,102 / 500,000"],
    ["Transactions analysed", "62,221 this month"],
    ["Data retention",        "18 months"],
    ["Model retraining",      "Weekly (auto)"],
    ["Support tier",          "Business hours (EG)"],
  ];

  const PLANS = [
    { name:"Starter",      price:"EGP 1,200/mo",  seats:3,  calls:"100k",  highlight:false },
    { name:"Professional", price:"EGP 3,800/mo",  seats:10, calls:"500k",  highlight:true  },
    { name:"Enterprise",   price:"Custom",         seats:999,calls:"Unlimited",highlight:false},
  ];

  const INVOICES = [
    { date:"May 1, 2025",  amount:"EGP 3,800", status:"Paid" },
    { date:"Apr 1, 2025",  amount:"EGP 3,800", status:"Paid" },
    { date:"Mar 1, 2025",  amount:"EGP 3,800", status:"Paid" },
    { date:"Feb 1, 2025",  amount:"EGP 3,800", status:"Paid" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-xs font-bold text-black pb-1"
        style={{ borderBottom: "2px solid #808080" }}>
        Billing & Subscription
      </div>

      {/* Current plan banner */}
      <InsetPanel className="bg-[#000080] p-3 flex items-center gap-4">
        <div>
          <div className="font-mono text-base font-bold text-white">Professional Plan</div>
          <div className="font-mono text-[10px] text-[#88aaff]">
            Renews June 1, 2025 &nbsp;·&nbsp; EGP 3,800 / month &nbsp;·&nbsp; Annual billing
          </div>
        </div>
        <div className="flex-1" />
        <W95Button className="!text-[10px] !font-bold shrink-0"
          style={{ background: "#ffffff", color: "#000080",
            borderColor: "white white #808080 #808080" } as React.CSSProperties}>
          ↑ Upgrade to Enterprise
        </W95Button>
        <W95Button className="!text-[10px] shrink-0">Manage Billing</W95Button>
      </InsetPanel>

      {/* Usage stats */}
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">Usage This Period</div>
        <div className="flex flex-col gap-2">
          {FEATURES.map(([label, val]) => (
            <div key={label} className="flex items-center gap-3"
              style={{ borderBottom: "1px solid #d0d0d0", paddingBottom: "4px" }}>
              <span className="font-mono text-[10px] text-[#555] shrink-0" style={{ width: "180px" }}>
                {label}
              </span>
              <span className="font-mono text-[10px] font-bold text-black">{val}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Plan comparison */}
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">Available Plans</div>
        <div className="grid grid-cols-3 gap-2">
          {PLANS.map((p) => (
            <div key={p.name}
              style={{
                borderStyle: "solid", borderWidth: p.highlight ? "2px" : "1px",
                borderColor: p.highlight ? "#000080" : "#b0b0b0",
                padding: "10px", background: p.highlight ? "#f0f4ff" : "#f8f8f8",
              }}>
              <div className="font-mono text-[11px] font-bold text-black">{p.name}</div>
              {p.highlight && (
                <div className="font-mono text-[8px] text-white font-bold px-1 py-px mb-1 inline-block"
                  style={{ background: "#000080" }}>CURRENT</div>
              )}
              <div className="font-mono text-[13px] font-bold text-[#000080] mt-1">{p.price}</div>
              <div className="font-mono text-[9px] text-[#555] mt-1 leading-relaxed">
                {p.seats < 999 ? `${p.seats} seats` : "Unlimited seats"}<br />
                {p.calls} API calls/mo
              </div>
              {!p.highlight && (
                <W95Button className="!text-[9px] !px-2 !py-px mt-2">
                  {p.name === "Starter" ? "Downgrade" : "Upgrade"}
                </W95Button>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {/* Invoices */}
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">Invoice History</div>
        {INVOICES.map((inv, i) => (
          <div key={i} className="flex items-center gap-3 py-1"
            style={{ borderBottom: "1px solid #d0d0d0" }}>
            <span className="font-mono text-[10px] text-[#555] flex-1">{inv.date}</span>
            <span className="font-mono text-[10px] font-bold text-black">{inv.amount}</span>
            <span className="font-mono text-[9px] font-bold px-1"
              style={{ color: "#006600", background: "#ddffdd", border: "1px solid #006600" }}>
              {inv.status}
            </span>
            <W95Button className="!text-[9px] !px-2 !py-px">⇩ PDF</W95Button>
          </div>
        ))}
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: APPEARANCE
// ═══════════════════════════════════════════════════════════════════════════════

function AppearanceTab({ onSave }: { onSave: () => void }) {
  const [density,   setDensity]   = useState("comfortable");
  const [fontSize,  setFontSize]  = useState("medium");
  const [dateFormat,setDateFormat]= useState("DD/MM/YYYY");
  const [currency,  setCurrency]  = useState("EGP");
  const [animations,setAnimations]= useState(true);
  const [scanlines, setScanlines] = useState(true);

  const THEMES = [
    { id:"win95",  label:"Windows 95 Classic", desc:"Gray #c0c0c0 with teal desktop",       preview:"#c0c0c0" },
    { id:"win98",  label:"Windows 98",          desc:"Same palette, slightly smoother",       preview:"#c8c8c8" },
    { id:"highcon",label:"High Contrast",        desc:"Black & white — accessibility mode",    preview:"#000000" },
    { id:"matrix", label:"Matrix Terminal",      desc:"Black with green phosphor — AEGIS mode",preview:"#001100" },
  ];
  const [theme, setTheme] = useState("win95");

  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-xs font-bold text-black pb-1"
        style={{ borderBottom: "2px solid #808080" }}>
        Appearance Settings
      </div>

      {/* Theme picker */}
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">Interface Theme</div>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => (
            <div key={t.id} onClick={() => setTheme(t.id)}
              className="flex items-center gap-2 p-2 cursor-pointer"
              style={{
                borderStyle: "solid", borderWidth: "2px",
                borderColor: theme === t.id ? "#000080 #000080 white white" : "white white #808080 #808080",
                background: theme === t.id ? "#dde8ff" : "#e8e8e8",
              }}>
              <div className="shrink-0"
                style={{ width: "24px", height: "24px", background: t.preview,
                  borderStyle:"solid", borderWidth:"1px", borderColor:"#808080" }} />
              <div>
                <div className="font-mono text-[10px] font-bold text-black">{t.label}</div>
                <div className="font-mono text-[8px] text-[#555]">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="font-mono text-[9px] text-[#808080] mt-1">
          Additional themes are applied on next page load.
        </div>
      </Panel>

      {/* Display options */}
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">Display Options</div>
        <FormRow label="Table Density">
          <div className="flex gap-2">
            {["compact","comfortable","spacious"].map((d) => (
              <W95Radio key={d} checked={density === d} onChange={() => setDensity(d)}
                label={d.charAt(0).toUpperCase() + d.slice(1)} />
            ))}
          </div>
        </FormRow>
        <FormRow label="Font Size">
          <div className="flex gap-2">
            {["small","medium","large"].map((s) => (
              <W95Radio key={s} checked={fontSize === s} onChange={() => setFontSize(s)}
                label={s.charAt(0).toUpperCase() + s.slice(1)} />
            ))}
          </div>
        </FormRow>
        <FormRow label="Date Format">
          <W95Select value={dateFormat} onChange={setDateFormat}
            options={[
              { value:"DD/MM/YYYY", label:"DD/MM/YYYY (Egyptian standard)" },
              { value:"MM/DD/YYYY", label:"MM/DD/YYYY" },
              { value:"YYYY-MM-DD", label:"YYYY-MM-DD (ISO 8601)" },
            ]} className="w-52" />
        </FormRow>
        <FormRow label="Currency Display">
          <W95Select value={currency} onChange={setCurrency}
            options={[
              { value:"EGP", label:"EGP — Egyptian Pound" },
              { value:"USD", label:"USD — US Dollar" },
              { value:"EUR", label:"EUR — Euro" },
            ]} className="w-44" />
        </FormRow>
        <div className="mt-2 flex flex-col gap-2">
          <W95Toggle checked={animations} onChange={setAnimations} label="Enable UI animations and transitions" />
          <W95Toggle checked={scanlines}  onChange={setScanlines}  label="Show scanline overlay effect (retro aesthetic)" />
        </div>
      </Panel>

      <div className="flex justify-end">
        <W95Button onClick={onSave} className="!font-bold"
          style={{ background:"#000080", color:"white",
            borderColor:"white white #808080 #808080" } as React.CSSProperties}>
          💾 Save Appearance
        </W95Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: HELP & LEGAL
// ═══════════════════════════════════════════════════════════════════════════════

function HelpTab() {
  const LINKS = [
    { icon:"📖", label:"Documentation",        url:"https://docs.aegisradar.io",              desc:"Full API reference and integration guides" },
    { icon:"❓", label:"FAQ",                   url:"https://help.aegisradar.io/faq",          desc:"Answers to common setup and billing questions" },
    { icon:"💬", label:"Contact Support",       url:"mailto:support@aegisradar.io",            desc:"support@aegisradar.io · Business hours (EG)" },
    { icon:"🐛", label:"Report a Bug",          url:"https://github.com/aegis-radar/issues",  desc:"Open a GitHub issue for platform bugs" },
    { icon:"🔔", label:"Status Page",           url:"https://status.aegisradar.io",           desc:"Real-time uptime and incident reports" },
    { icon:"🗺", label:"Roadmap",               url:"https://roadmap.aegisradar.io",          desc:"Upcoming features and release timeline" },
  ];

  const LEGAL = [
    { label:"Privacy Policy",        url:"https://aegisradar.io/privacy",   updated:"Jan 10, 2025" },
    { label:"Terms of Service",      url:"https://aegisradar.io/terms",     updated:"Jan 10, 2025" },
    { label:"Data Processing Agreement", url:"https://aegisradar.io/dpa",   updated:"Mar 01, 2025" },
    { label:"Cookie Policy",         url:"https://aegisradar.io/cookies",   updated:"Jan 10, 2025" },
    { label:"Security Whitepaper",   url:"https://aegisradar.io/security",  updated:"Apr 15, 2025" },
  ];

  const LICENSES = [
    { name:"AEGIS RADAR Platform", license:"Proprietary — All rights reserved" },
    { name:"Next.js",              license:"MIT License" },
    { name:"React",                license:"MIT License" },
    { name:"Recharts",             license:"MIT License" },
    { name:"Tailwind CSS",         license:"MIT License" },
    { name:"TypeScript",           license:"Apache 2.0 License" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-xs font-bold text-black pb-1"
        style={{ borderBottom: "2px solid #808080" }}>
        Help & Legal
      </div>

      {/* Support links */}
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">Support & Resources</div>
        <div className="grid grid-cols-2 gap-2">
          {LINKS.map((l) => (
            <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
              className="flex items-start gap-2 p-2 no-underline"
              style={{ borderStyle:"solid", borderWidth:"2px",
                borderColor:"white white #808080 #808080", background:"#e8e8e8",
                textDecoration:"none" }}>
              <span className="text-base shrink-0">{l.icon}</span>
              <div>
                <div className="font-mono text-[10px] font-bold text-[#000080]">{l.label}</div>
                <div className="font-mono text-[8px] text-[#555]">{l.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </Panel>

      {/* Legal documents */}
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">Legal Documents</div>
        {LEGAL.map((doc, i) => (
          <div key={doc.label} className="flex items-center gap-3 py-1.5"
            style={{ borderBottom: i < LEGAL.length-1 ? "1px solid #d0d0d0" : "none" }}>
            <span className="font-mono text-[10px] text-[#000080] flex-1"
              style={{ cursor:"pointer", textDecoration:"underline" }}>
              {doc.label}
            </span>
            <span className="font-mono text-[9px] text-[#808080]">Updated: {doc.updated}</span>
            <W95Button className="!text-[9px] !px-2 !py-px">⇩ PDF</W95Button>
          </div>
        ))}
      </Panel>

      {/* Open source licences */}
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-2">
          Open Source Licenses
        </div>
        <InsetPanel className="bg-black p-2">
          {LICENSES.map((lic, i) => (
            <div key={lic.name} className="flex items-center gap-2 py-0.5"
              style={{ borderBottom: i < LICENSES.length-1 ? "1px solid #001800" : "none" }}>
              <span className="font-mono text-[9px] text-[#00cc00] flex-1">{lic.name}</span>
              <span className="font-mono text-[9px] text-[#007700]">{lic.license}</span>
            </div>
          ))}
        </InsetPanel>
      </Panel>

      {/* System info */}
      <Panel className="p-3">
        <div className="font-mono text-[10px] font-bold text-black mb-1">System Information</div>
        {[
          ["Platform",      "AEGIS RADAR v2.1 (Build 20250517)"],
          ["Environment",   "Production — Cairo, EG"],
          ["Node Version",  "v20.14.0 LTS"],
          ["Framework",     "Next.js 16 App Router"],
          ["Data Region",   "eu-west-1 (Ireland) — GDPR compliant"],
          ["Uptime (30d)",  "99.97%"],
        ].map(([k, v]) => (
          <div key={k as string} className="flex gap-2 py-0.5"
            style={{ borderBottom:"1px solid #d0d0d0" }}>
            <span className="font-mono text-[9px] text-[#555] shrink-0" style={{ width:"130px" }}>
              {k}:
            </span>
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
  api:        "API & Integrations — Keys & Webhooks",
  billing:    "Billing & Subscription",
  appearance: "Appearance — Display Preferences",
  help:       "Help & Legal — Support Resources",
};

export default function SettingsPage() {
  const [activeTab,   setActiveTab]   = useState<SettingsTab>("general");
  const [showSaveBanner, setShowSaveBanner] = useState(false);

  const handleSave = useCallback(() => {
    setShowSaveBanner(true);
    setTimeout(() => setShowSaveBanner(false), 2500);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ ...MONO, background:"#c0c0c0" }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-2 py-1.5 shrink-0"
        style={{ borderBottom:"2px solid #808080", background:"#c0c0c0" }}>
        <W95Button className="!text-[10px]" onClick={handleSave}>💾 Save Changes</W95Button>
        <W95Button className="!text-[10px]">↺ Discard</W95Button>
        <div className="w-px h-4 bg-[#808080] mx-1" />
        <W95Button className="!text-[10px]">📤 Export Config</W95Button>
        <div className="flex-1" />
        <span className="font-mono text-[10px] text-[#444]">
          AEGIS RADAR Settings &nbsp;|&nbsp; CIB Egypt &nbsp;|&nbsp; Professional Plan
        </span>
      </div>

      {/* ── Title bar for the whole settings window ── */}
      <TitleBar title={`Settings — ${TAB_TITLES[activeTab]}`} />

      {/* ── Body: secondary sidebar + content ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Secondary settings sidebar */}
        <SettingsSidebar active={activeTab} onSelect={setActiveTab} />

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto p-3 min-w-0">
          {activeTab === "general"    && <GeneralTab    onSave={handleSave} />}
          {activeTab === "security"   && <SecurityTab   onSave={handleSave} />}
          {activeTab === "api"        && <ApiTab        onSave={handleSave} />}
          {activeTab === "billing"    && <BillingTab />}
          {activeTab === "appearance" && <AppearanceTab onSave={handleSave} />}
          {activeTab === "help"       && <HelpTab />}

          {/* Footer */}
          <div className="font-mono text-[9px] text-[#555] text-center mt-4 pb-1"
            style={{ borderTop:"1px solid #b0b0b0", paddingTop:"6px" }}>
            AEGIS RADAR v2.1 — Settings &nbsp;|&nbsp; Changes saved to account &nbsp;|&nbsp;
            © 2025 AEGIS Systems, Cairo EG
          </div>
        </div>
      </div>

      {/* Save banner */}
      <SaveBanner visible={showSaveBanner} />

      {/* Scrollbar + animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        ::-webkit-scrollbar { width:16px; height:16px; }
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