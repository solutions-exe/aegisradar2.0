"use client";

/**
 * src/app/auth/page.tsx
 *
 * AEGIS RADAR — Authentication Page.
 * Single Win95 application window centered on teal desktop.
 * Left column: Login · Right column: Register
 * Fully self-contained — no dependency on layout.tsx or dashboard components.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type ActivePanel = "login" | "register";
type Role        = "Admin" | "Analyst" | "Viewer";

interface LoginForm {
  email:      string;
  password:   string;
  remember:   boolean;
}

interface RegisterForm {
  fullName:    string;
  email:       string;
  password:    string;
  confirm:     string;
  role:        Role;
  orgName:     string;
  industry:    string;
  agreeTerms:  boolean;
}

interface FieldError { [key: string]: string }

// ═══════════════════════════════════════════════════════════════════════════════
// WIN95 PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════

const MONO: React.CSSProperties = { fontFamily: "'Courier New', Courier, monospace" };

function TitleBar({ title }: { title: string }) {
  return (
    <div
      className="flex items-center justify-between px-2 select-none shrink-0"
      style={{ background: "linear-gradient(to right,#000080,#1084d0)", height: "22px" }}
    >
      <span className="text-white text-[10px] font-bold tracking-wide truncate mr-2" style={MONO}>
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
      style={{
        borderStyle: "solid", borderWidth: "2px",
        borderColor: "white white #808080 #808080", ...style,
      }}
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
      style={{
        borderStyle: "solid", borderWidth: "2px",
        borderColor: "#808080 white white #808080", ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Standard Win95 beveled button */
function W95Button({
  children, onClick, variant = "default", disabled, loading, className = "", style, type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger" | "success";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  type?: "button" | "submit";
}) {
  const variantStyle: React.CSSProperties =
    variant === "primary" ? { background: "#000080", color: "white", borderColor: "white white #404080 #404080" } :
    variant === "danger"  ? { background: "#880000", color: "white", borderColor: "white white #440000 #440000" } :
    variant === "success" ? { background: "#005500", color: "white", borderColor: "white white #002200 #002200" } :
    { background: "#c0c0c0", color: "black", borderColor: "white white #808080 #808080" };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`select-none px-4 py-1.5 font-mono text-xs font-bold
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-dotted focus:outline-1 focus:outline-black ${className}`}
      style={{
        ...MONO, cursor: disabled || loading ? "not-allowed" : "pointer",
        borderStyle: "solid", borderWidth: "2px",
        ...variantStyle, ...style,
      }}
    >
      {loading ? "⏳ Please wait…" : children}
    </button>
  );
}

/** Win95 text / email / password input */
function W95Input({
  id, type = "text", value, onChange, placeholder = "", disabled, hasError,
}: {
  id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  disabled?: boolean; hasError?: boolean;
}) {
  return (
    <input
      id={id} type={type} value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full bg-white text-black text-xs px-2 py-1.5"
      style={{
        ...MONO,
        borderStyle: "solid", borderWidth: "2px",
        borderColor: hasError
          ? "#cc0000 #cc0000 #cc0000 #cc0000"
          : "#808080 white white #808080",
        outline: "none",
        opacity: disabled ? 0.6 : 1,
      }}
    />
  );
}

/** Win95 select dropdown */
function W95Select({
  id, value, onChange, options, disabled,
}: {
  id: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; disabled?: boolean;
}) {
  return (
    <select
      id={id} value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full bg-white text-black text-xs px-2 py-1.5"
      style={{
        ...MONO,
        borderStyle: "solid", borderWidth: "2px",
        borderColor: "#808080 white white #808080",
        outline: "none",
      }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/** Win95 checkbox */
function W95Checkbox({
  id, checked, onChange, label, small,
}: {
  id: string; checked: boolean; onChange: (v: boolean) => void;
  label: React.ReactNode; small?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-2 cursor-pointer select-none"
    >
      <div
        id={id}
        onClick={() => onChange(!checked)}
        className="flex items-center justify-center shrink-0 mt-px"
        style={{
          width: "13px", height: "13px",
          borderStyle: "solid", borderWidth: "2px",
          borderColor: "#808080 white white #808080",
          background: "white", cursor: "pointer",
        }}
      >
        {checked && (
          <span style={{ fontSize: "10px", fontWeight: "bold", lineHeight: 1, color: "#000" }}>
            ✓
          </span>
        )}
      </div>
      <span className={`font-mono text-black leading-snug ${small ? "text-[9px]" : "text-[10px]"}`}>
        {label}
      </span>
    </label>
  );
}

/** Inline field error message */
function FieldErr({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1 mt-0.5">
      <span style={{ color: "#cc0000", fontSize: "10px" }}>⚠</span>
      <span className="font-mono text-[9px]" style={{ color: "#cc0000" }}>{message}</span>
    </div>
  );
}

/** Win95-style alert banner (error or success) */
function AlertBanner({
  message, type = "error", onClose,
}: {
  message: string; type?: "error" | "success" | "info"; onClose?: () => void;
}) {
  const colors = {
    error:   { bg: "#ffdddd", border: "#cc0000", text: "#880000", icon: "⚠" },
    success: { bg: "#ddffdd", border: "#006600", text: "#004400", icon: "✓" },
    info:    { bg: "#dde8ff", border: "#000080", text: "#000060", icon: "ℹ" },
  }[type];

  return (
    <div
      className="flex items-start gap-2 p-2"
      style={{
        background: colors.bg,
        borderStyle: "solid", borderWidth: "2px",
        borderColor: `${colors.border} ${colors.border} ${colors.border} ${colors.border}`,
      }}
    >
      <span className="font-mono text-sm shrink-0" style={{ color: colors.text }}>{colors.icon}</span>
      <span className="font-mono text-[10px] flex-1 leading-snug" style={{ color: colors.text }}>
        {message}
      </span>
      {onClose && (
        <button
          onClick={onClose}
          className="font-mono text-[10px] shrink-0"
          style={{ color: colors.text, cursor: "pointer", background: "none", border: "none" }}
        >
          ×
        </button>
      )}
    </div>
  );
}

/** Form section label (gray separator with text) */
function FormSection({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 my-1">
      <div className="flex-1 h-px" style={{ background: "#808080" }} />
      <span className="font-mono text-[9px] text-[#808080] px-1 tracking-wider">{label}</span>
      <div className="flex-1 h-px" style={{ background: "#808080" }} />
    </div>
  );
}

/** Labeled input row */
function Field({
  label, id, required, children, error,
}: {
  label: string; id: string; required?: boolean;
  children: React.ReactNode; error?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label
        htmlFor={id}
        className="font-mono text-[10px] font-bold text-black"
      >
        {label}{required && <span style={{ color: "#cc0000" }}> *</span>}
      </label>
      {children}
      <FieldErr message={error} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const isEmail   = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isStrong  = (v: string) => v.length >= 8;

function validateLogin(f: LoginForm): FieldError {
  const e: FieldError = {};
  if (!f.email)            e.email    = "Email address is required.";
  else if (!isEmail(f.email)) e.email = "Please enter a valid email address.";
  if (!f.password)         e.password = "Password is required.";
  return e;
}

function validateRegister(f: RegisterForm): FieldError {
  const e: FieldError = {};
  if (!f.fullName.trim())  e.fullName  = "Full name is required.";
  if (!f.email)            e.email     = "Email address is required.";
  else if (!isEmail(f.email)) e.email  = "Please enter a valid email address.";
  if (!f.orgName.trim())   e.orgName   = "Organisation name is required.";
  if (!f.password)         e.password  = "Password is required.";
  else if (!isStrong(f.password)) e.password = "Password must be at least 8 characters.";
  if (!f.confirm)          e.confirm   = "Please confirm your password.";
  else if (f.confirm !== f.password) e.confirm = "Passwords do not match.";
  if (!f.agreeTerms)       e.agreeTerms = "You must accept the Terms & Privacy Policy.";
  return e;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN COLUMN
// ═══════════════════════════════════════════════════════════════════════════════

function LoginColumn({
  active, onSwitchToRegister,
}: {
  active: boolean;
  onSwitchToRegister: () => void;
}) {
  const router = useRouter();

  const [form,    setForm]    = useState<LoginForm>({ email:"", password:"", remember:false });
  const [errors,  setErrors]  = useState<FieldError>({});
  const [alert,   setAlert]   = useState<{ msg: string; type: "error"|"success"|"info" } | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof LoginForm) => (val: string | boolean) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = useCallback(async () => {
    const errs = validateLogin(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setAlert(null);

    // Simulate API call
    await new Promise((r) => setTimeout(r, 900));

    // Demo credentials
    if (form.email === "demo@demo.com" && form.password === "demo") {
      setAlert({ msg: "Login successful. Redirecting to dashboard…", type: "success" });
      setTimeout(() => router.push("/dashboard"), 1200);
      return;
    }

    // Simulate real auth check — treat anything with valid format as success for demo
    if (isEmail(form.email) && form.password.length >= 1) {
      setAlert({ msg: "Login successful. Redirecting to dashboard…", type: "success" });
      setTimeout(() => router.push("/dashboard"), 1200);
    } else {
      setAlert({ msg: "Invalid email or password. Please try again.", type: "error" });
      setLoading(false);
    }
  }, [form, router]);

  const handleDemo = useCallback(async () => {
    setForm({ email: "demo@demo.com", password: "demo", remember: false });
    setErrors({});
    setLoading(true);
    setAlert({ msg: "Signing in with demo credentials…", type: "info" });
    await new Promise((r) => setTimeout(r, 800));
    setAlert({ msg: "Demo login successful. Redirecting…", type: "success" });
    setTimeout(() => router.push("/dashboard"), 1000);
  }, [router]);

  return (
    <div
      className="flex flex-col h-full"
      style={{
        opacity: active ? 1 : 0.45,
        transition: "opacity 0.2s ease",
        pointerEvents: active ? "auto" : "none",
      }}
    >
      <TitleBar title="Login — Existing Account" />
      <Panel className="flex-1 p-4 flex flex-col gap-3">

        {/* Welcome text */}
        <div className="font-mono text-[10px] text-[#555] leading-relaxed">
          Sign in to your AEGIS RADAR account to access your fraud detection dashboard.
        </div>

        {/* Alert */}
        {alert && (
          <AlertBanner
            message={alert.msg}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Fields */}
        <div className="flex flex-col gap-2.5">
          <Field label="Email Address" id="login-email" required error={errors.email}>
            <W95Input
              id="login-email" type="email"
              value={form.email} onChange={set("email")}
              placeholder="you@company.com"
              hasError={!!errors.email} disabled={loading}
            />
          </Field>

          <Field label="Password" id="login-password" required error={errors.password}>
            <W95Input
              id="login-password" type="password"
              value={form.password} onChange={set("password")}
              placeholder="Enter your password"
              hasError={!!errors.password} disabled={loading}
            />
          </Field>

          {/* Remember me + Forgot */}
          <div className="flex items-center justify-between">
            <W95Checkbox
              id="remember"
              checked={form.remember}
              onChange={set("remember")}
              label="Remember me"
              small
            />
            <button
              onClick={() => setAlert({ msg: "Password reset link will be sent to your email address (demo — not implemented).", type: "info" })}
              className="font-mono text-[9px] text-[#000080] hover:underline focus:outline-none"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              Forgot Password?
            </button>
          </div>
        </div>

        {/* Login button */}
        <div className="flex flex-col gap-2 mt-1">
          <W95Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            className="w-full !py-2 !text-[11px]"
          >
            ▶ Sign In
          </W95Button>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px" style={{ background: "#b0b0b0" }} />
            <span className="font-mono text-[9px] text-[#808080]">or</span>
            <div className="flex-1 h-px" style={{ background: "#b0b0b0" }} />
          </div>

          <W95Button
            variant="success"
            onClick={handleDemo}
            loading={loading}
            className="w-full !py-2 !text-[11px]"
          >
            ⚡ Quick Demo Login
          </W95Button>
        </div>

        {/* Demo credentials hint */}
        <InsetPanel className="bg-black px-3 py-2">
          <div className="font-mono text-[9px] text-[#00cc00] leading-relaxed">
            <span style={{ color:"#007700" }}>▶ DEMO CREDENTIALS</span><br />
            Email:    demo@demo.com<br />
            Password: demo
          </div>
        </InsetPanel>

        {/* Switch to register */}
        <div className="mt-auto pt-2" style={{ borderTop: "1px solid #b0b0b0" }}>
          <div className="font-mono text-[9px] text-[#555] text-center">
            Don&apos;t have an account?{" "}
            <button
              onClick={onSwitchToRegister}
              className="font-mono text-[9px] text-[#000080] font-bold hover:underline focus:outline-none"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              Create one here →
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTER COLUMN
// ═══════════════════════════════════════════════════════════════════════════════

function RegisterColumn({
  active, onSwitchToLogin,
}: {
  active: boolean;
  onSwitchToLogin: () => void;
}) {
  const router = useRouter();

  const [form, setForm] = useState<RegisterForm>({
    fullName: "", email: "", password: "", confirm: "",
    role: "Analyst", orgName: "", industry: "ecommerce", agreeTerms: false,
  });
  const [errors,   setErrors]   = useState<FieldError>({});
  const [alert,    setAlert]    = useState<{ msg: string; type: "error"|"success"|"info" } | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (key: keyof RegisterForm) => (val: string | boolean) =>
    setForm((p) => ({ ...p, [key]: val }));

  // Password strength indicator
  const passStrength = form.password.length === 0 ? null :
    form.password.length < 6  ? "weak" :
    form.password.length < 10 ? "fair" : "strong";

  const strengthColor = { weak:"#cc0000", fair:"#cc7700", strong:"#006600" };
  const strengthLabel = { weak:"WEAK", fair:"FAIR", strong:"STRONG" };

  const handleSubmit = useCallback(async () => {
    const errs = validateRegister(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setAlert(null);
    await new Promise((r) => setTimeout(r, 1100));

    setAlert({ msg: "Account created successfully! Redirecting to your dashboard…", type: "success" });
    setTimeout(() => router.push("/dashboard"), 1400);
  }, [form, router]);

  return (
    <div
      className="flex flex-col h-full"
      style={{
        opacity: active ? 1 : 0.45,
        transition: "opacity 0.2s ease",
        pointerEvents: active ? "auto" : "none",
      }}
    >
      <TitleBar title="Register — Create New Account" />
      <Panel className="flex-1 p-4 flex flex-col gap-2.5 overflow-y-auto">

        {/* Intro */}
        <div className="font-mono text-[10px] text-[#555] leading-relaxed">
          Set up your organisation&apos;s AEGIS RADAR account. Your 14-day free trial starts immediately.
        </div>

        {/* Alert */}
        {alert && (
          <AlertBanner
            message={alert.msg}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}

        {/* ── PERSONAL DETAILS ── */}
        <FormSection label="PERSONAL DETAILS" />

        <Field label="Full Name" id="reg-name" required error={errors.fullName}>
          <W95Input
            id="reg-name" value={form.fullName} onChange={set("fullName")}
            placeholder="Ahmed Mostafa" hasError={!!errors.fullName} disabled={loading}
          />
        </Field>

        <Field label="Work Email Address" id="reg-email" required error={errors.email}>
          <W95Input
            id="reg-email" type="email" value={form.email} onChange={set("email")}
            placeholder="ahmed@company.com.eg"
            hasError={!!errors.email} disabled={loading}
          />
        </Field>

        {/* ── SECURITY ── */}
        <FormSection label="SECURITY" />

        <Field label="Password" id="reg-password" required error={errors.password}>
          <div className="flex gap-1">
            <W95Input
              id="reg-password" type={showPass ? "text" : "password"}
              value={form.password} onChange={set("password")}
              placeholder="Min. 8 characters"
              hasError={!!errors.password} disabled={loading}
            />
            <button
              onClick={() => setShowPass((v) => !v)}
              className="font-mono text-[10px] px-2 shrink-0"
              style={{ background:"#c0c0c0", borderStyle:"solid", borderWidth:"2px",
                borderColor:"white white #808080 #808080", cursor:"pointer" }}
            >
              {showPass ? "🙈" : "👁"}
            </button>
          </div>
          {/* Strength indicator */}
          {passStrength && (
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex gap-0.5">
                {["weak","fair","strong"].map((level, i) => {
                  const filled =
                    passStrength === "strong" ? true :
                    passStrength === "fair"   ? i < 2 :
                    i < 1;
                  const col = strengthColor[passStrength];
                  return (
                    <div key={level}
                      style={{ width:"24px", height:"4px",
                        background: filled ? col : "#d0d0d0",
                        border: "1px solid #b0b0b0" }}
                    />
                  );
                })}
              </div>
              <span className="font-mono text-[8px] font-bold"
                style={{ color: strengthColor[passStrength] }}>
                {strengthLabel[passStrength]}
              </span>
            </div>
          )}
        </Field>

        <Field label="Confirm Password" id="reg-confirm" required error={errors.confirm}>
          <W95Input
            id="reg-confirm" type="password"
            value={form.confirm} onChange={set("confirm")}
            placeholder="Re-enter your password"
            hasError={!!errors.confirm} disabled={loading}
          />
        </Field>

        {/* ── ORGANISATION ── */}
        <FormSection label="ORGANISATION" />

        <Field label="Organisation / Company Name" id="reg-org" required error={errors.orgName}>
          <W95Input
            id="reg-org" value={form.orgName} onChange={set("orgName")}
            placeholder="CIB Egypt, Jumia EG, etc."
            hasError={!!errors.orgName} disabled={loading}
          />
        </Field>

        <Field label="Industry" id="reg-industry">
          <W95Select
            id="reg-industry" value={form.industry}
            onChange={set("industry")} disabled={loading}
            options={[
              { value:"ecommerce",  label:"E-Commerce / Online Retail" },
              { value:"banking",    label:"Banking & Finance" },
              { value:"telecom",    label:"Telecommunications" },
              { value:"fintech",    label:"Fintech / Digital Payments" },
              { value:"insurance",  label:"Insurance" },
              { value:"government", label:"Government / Public Sector" },
              { value:"other",      label:"Other" },
            ]}
          />
        </Field>

        {/* Role selector */}
        <Field label="Your Role" id="reg-role">
          <W95Select
            id="reg-role" value={form.role}
            onChange={set("role")} disabled={loading}
            options={[
              { value:"Admin",   label:"Admin — Full access & team management" },
              { value:"Analyst", label:"Analyst — Fraud review & investigation" },
              { value:"Viewer",  label:"Viewer — Read-only access" },
            ]}
          />
          <span className="font-mono text-[8px] text-[#808080] mt-0.5">
            You can change roles for yourself and teammates later in Settings.
          </span>
        </Field>

        {/* ── AGREEMENT ── */}
        <FormSection label="AGREEMENT" />

        <div className="flex flex-col gap-1.5">
          <W95Checkbox
            id="reg-terms"
            checked={form.agreeTerms}
            onChange={set("agreeTerms")}
            label={
              <span>
                I agree to the{" "}
                <Link href="/terms" className="text-[#000080] font-bold underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-[#000080] font-bold underline">Privacy Policy</Link>
              </span>
            }
          />
          {errors.agreeTerms && <FieldErr message={errors.agreeTerms} />}
        </div>

        {/* Register button */}
        <W95Button
          variant="primary"
          onClick={handleSubmit}
          loading={loading}
          className="w-full !py-2 !text-[11px] mt-1"
        >
          ⬡ Create Account — Start Free Trial
        </W95Button>

        <div className="font-mono text-[8px] text-[#808080] text-center">
          No credit card required · 14-day free trial · Cancel anytime
        </div>

        {/* Switch to login */}
        <div className="mt-auto pt-2" style={{ borderTop: "1px solid #b0b0b0" }}>
          <div className="font-mono text-[9px] text-[#555] text-center">
            Already have an account?{" "}
            <button
              onClick={onSwitchToLogin}
              className="font-mono text-[9px] text-[#000080] font-bold hover:underline focus:outline-none"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              ← Sign in here
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE ROOT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AuthPage() {
  const [active, setActive] = useState<ActivePanel>("login");

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 overflow-y-auto"
      style={{ background: "#008080", ...MONO }}
    >
      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px)",
        }}
      />

      {/* Outer application window */}
      <div
        className="w-full flex flex-col"
        style={{
          maxWidth: "860px",
          background: "#c0c0c0",
          borderStyle: "solid", borderWidth: "2px",
          borderColor: "white white #808080 #808080",
          boxShadow: "4px 4px 0 rgba(0,0,0,0.5)",
        }}
      >
        {/* Window title bar */}
        <TitleBar title="AEGIS RADAR v2.1 — Authentication  [Secure Login]" />

        {/* Menu bar */}
        <div
          className="flex items-center px-2 py-0.5 gap-0 shrink-0"
          style={{ borderBottom: "1px solid #808080" }}
        >
          {["File", "Help"].map((m) => (
            <button
              key={m}
              className="px-2 py-0.5 font-mono text-[11px] text-black hover:bg-[#000080] hover:text-white focus:outline-none"
            >
              <u>{m[0]}</u>{m.slice(1)}
            </button>
          ))}
          <div className="flex-1" />
          <Link
            href="/pricing"
            className="font-mono text-[10px] text-[#000080] px-2 py-0.5 hover:bg-[#000080] hover:text-white"
            style={{ textDecoration: "none" }}
          >
            View Pricing →
          </Link>
        </div>

        {/* Logo / branding strip */}
        <div
          className="flex items-center justify-center gap-4 py-5 px-6"
          style={{ borderBottom: "2px solid #808080", background: "#d8d8d8" }}
        >
          {/* Logo mark */}
          <InsetPanel
            className="bg-[#000080] flex items-center justify-center shrink-0"
            style={{ width: "52px", height: "52px" }}
          >
            <span className="font-mono text-white font-bold" style={{ fontSize: "22px" }}>⬡</span>
          </InsetPanel>

          {/* Title + tagline */}
          <div className="flex flex-col">
            <div className="font-mono font-bold text-black leading-tight" style={{ fontSize: "22px" }}>
              AEGIS RADAR
            </div>
            <div className="font-mono text-[10px] text-[#555]">
              AI-Powered Fraud Detection Platform · Egypt &amp; MENA
            </div>
          </div>

          <div className="flex-1" />

          {/* Active panel indicator tabs */}
          <div className="flex gap-1">
            {(["login", "register"] as ActivePanel[]).map((panel) => (
              <button
                key={panel}
                onClick={() => setActive(panel)}
                className="font-mono text-[10px] font-bold px-3 py-1"
                style={{
                  cursor: "pointer",
                  background: active === panel ? "#000080" : "#c0c0c0",
                  color:      active === panel ? "white"   : "black",
                  borderStyle: "solid", borderWidth: "2px",
                  borderColor: active === panel
                    ? "#808080 #808080 white white"
                    : "white white #808080 #808080",
                }}
              >
                {panel === "login" ? "🔑 Login" : "✎ Register"}
              </button>
            ))}
          </div>
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-2 gap-0">

          {/* Login column */}
          <div
            className="p-4 flex flex-col"
            style={{
              borderRight: "2px solid #808080",
              background: active === "login" ? "#c0c0c0" : "#b8b8b8",
              transition: "background 0.2s ease",
            }}
          >
            <LoginColumn
              active={active === "login"}
              onSwitchToRegister={() => setActive("register")}
            />
          </div>

          {/* Register column */}
          <div
            className="p-4 flex flex-col"
            style={{
              background: active === "register" ? "#c0c0c0" : "#b8b8b8",
              transition: "background 0.2s ease",
            }}
          >
            <RegisterColumn
              active={active === "register"}
              onSwitchToLogin={() => setActive("login")}
            />
          </div>
        </div>

        {/* Status bar footer */}
        <div
          className="flex items-center gap-4 px-3 py-1 shrink-0"
          style={{ borderTop: "2px solid #808080", background: "#d8d8d8" }}
        >
          <div
            className="font-mono text-[9px] text-black px-2 py-px"
            style={{ borderStyle: "solid", borderWidth: "1px",
              borderColor: "#808080 white white #808080" }}
          >
            🔒 TLS 1.3 Encrypted
          </div>
          <div
            className="font-mono text-[9px] text-black px-2 py-px"
            style={{ borderStyle: "solid", borderWidth: "1px",
              borderColor: "#808080 white white #808080" }}
          >
            ● AEGIS Auth Server — Online
          </div>
          <div className="flex-1" />
          <span className="font-mono text-[9px] text-[#555]">
            © 2025 AEGIS Systems Ltd. · Cairo, Egypt
          </span>
        </div>
      </div>

      {/* Below-window note */}
      <div className="font-mono text-[9px] text-[#004040] mt-3 text-center">
        By using AEGIS RADAR you agree to our{" "}
        <Link href="/terms"   className="text-[#002080] underline">Terms of Service</Link>
        {" "}and{" "}
        <Link href="/privacy" className="text-[#002080] underline">Privacy Policy</Link>
      </div>

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