"use client";

/**
 * src/app/page.tsx
 *
 * AEGIS RADAR — Public Landing Page (Homepage).
 * Fully self-contained marketing page for unauthenticated visitors.
 *
 * Sections:
 *   Navbar · Hero · Trust Bar · How It Works · Key Features ·
 *   Why Egypt · Testimonials · Final CTA · Footer
 */

import { useState } from "react";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════════
// WIN95 PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════

const MONO: React.CSSProperties = { fontFamily: "'Courier New', Courier, monospace" };

function W95Btn({
  children, href, onClick, variant = "default", style, className = "",
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger" | "ghost";
  style?: React.CSSProperties;
  className?: string;
}) {
  const base: React.CSSProperties = {
    ...MONO, display: "inline-flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", userSelect: "none", fontWeight: "bold",
    borderStyle: "solid", borderWidth: "2px", textDecoration: "none",
    ...style,
  };
  const vs: React.CSSProperties =
    variant === "primary" ? { background:"#000080", color:"white", borderColor:"white white #404080 #404080" } :
    variant === "danger"  ? { background:"#880000", color:"white", borderColor:"white white #440000 #440000" } :
    variant === "ghost"   ? { background:"transparent", color:"black", borderColor:"transparent" } :
    { background:"#c0c0c0", color:"black", borderColor:"white white #808080 #808080" };

  if (href) return (
    <Link href={href} className={className} style={{ ...base, ...vs }}>{children}</Link>
  );
  return (
    <button onClick={onClick} className={className} style={{ ...base, ...vs }}>{children}</button>
  );
}

function TitleBar({ title, accent }: { title: string; accent?: "red" | "green" | "dark" }) {
  const bg =
    accent === "red"   ? "linear-gradient(to right,#880000,#cc2200)" :
    accent === "green" ? "linear-gradient(to right,#004400,#007700)" :
    accent === "dark"  ? "linear-gradient(to right,#1a1a2e,#16213e)" :
    "linear-gradient(to right,#000080,#1084d0)";
  return (
    <div className="flex items-center justify-between px-2 select-none shrink-0"
      style={{ background: bg, height: "22px" }}>
      <span className="text-white text-[10px] font-bold tracking-wide truncate mr-2" style={MONO}>
        {title}
      </span>
      <div className="flex gap-px shrink-0">
        {["−","□","×"].map((b) => (
          <button key={b} style={{ fontSize:"8px", width:"14px", height:"12px", cursor:"default",
            borderStyle:"solid", borderWidth:"1px",
            borderColor:"white white #808080 #808080", background:"#c0c0c0",
            display:"flex", alignItems:"center", justifyContent:"center", ...MONO }}>{b}</button>
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

function Section({ title, children, className = "", accent }: {
  title: string; children: React.ReactNode;
  className?: string; accent?: "red"|"green"|"dark";
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      <TitleBar title={title} accent={accent} />
      <Panel className="p-0">{children}</Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAVBAR
// ═══════════════════════════════════════════════════════════════════════════════

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="shrink-0 sticky top-0 z-40"
      style={{ background:"#c0c0c0", borderBottom:"2px solid #808080" }}>
      <div className="flex items-center px-6 py-2 gap-3 max-w-6xl mx-auto">

        {/* Logo */}
        <Link href="/" style={{ textDecoration:"none" }} className="flex items-center gap-2">
          <InsetPanel className="bg-[#000080] flex items-center justify-center shrink-0"
            style={{ width:"32px", height:"32px" }}>
            <span className="font-mono text-white font-bold" style={{ fontSize:"16px" }}>⬡</span>
          </InsetPanel>
          <div>
            <div className="font-mono text-sm font-bold text-black leading-tight">AEGIS RADAR</div>
            <div className="font-mono text-[8px] text-[#555]">AI Fraud Detection · Egypt</div>
          </div>
        </Link>

        {/* Nav */}
        <div className="hidden md:flex items-center gap-0 ml-6">
          {[
            { label:"Product",      href:"#features"  },
            { label:"How It Works", href:"#how"        },
            { label:"Pricing",      href:"/pricing"    },
            { label:"Docs",         href:"#"           },
            { label:"Contact",      href:"#"           },
          ].map((n) => (
            <Link key={n.label} href={n.href}
              className="font-mono text-xs text-black px-2 py-1 hover:bg-[#000080] hover:text-white"
              style={{ textDecoration:"none" }}>
              {n.label}
            </Link>
          ))}
        </div>

        <div className="flex-1" />

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-2">
          <W95Btn href="/auth" style={{ fontSize:"11px", padding:"4px 14px" }}>
            Sign In
          </W95Btn>
          <W95Btn href="/auth" variant="primary" style={{ fontSize:"11px", padding:"4px 14px" }}>
            Get Started Free →
          </W95Btn>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden font-mono text-xl"
          onClick={() => setMenuOpen(v => !v)}
          style={{ background:"none", border:"none", cursor:"pointer" }}>
          {menuOpen ? "×" : "≡"}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-1 px-4 pb-3"
          style={{ borderTop:"1px solid #808080" }}>
          {["Product","How It Works","Pricing","Docs","Contact"].map((l) => (
            <button key={l} className="font-mono text-xs text-black text-left py-1"
              style={{ background:"none", border:"none", cursor:"pointer" }}
              onClick={() => setMenuOpen(false)}>
              {l}
            </button>
          ))}
          <div className="flex gap-2 mt-1">
            <W95Btn href="/auth" style={{ fontSize:"10px", padding:"4px 12px" }}>Sign In</W95Btn>
            <W95Btn href="/auth" variant="primary" style={{ fontSize:"10px", padding:"4px 12px" }}>
              Get Started
            </W95Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HERO
// ═══════════════════════════════════════════════════════════════════════════════

function Hero() {
  return (
    <div className="py-16 px-6 flex flex-col items-center gap-8"
      style={{ background:"#c0c0c0" }}>
      <div className="w-full max-w-4xl flex flex-col gap-0">

        <TitleBar title="AEGIS RADAR v2.1  —  AI-Powered Fraud Detection Platform  [Production]" />
        <Panel className="px-8 py-10 md:py-14">
          <div className="flex flex-col md:flex-row items-center gap-10">

            {/* Left: headline + CTAs */}
            <div className="flex flex-col gap-4 flex-1">

              {/* Live badge */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[8px] font-bold px-2 py-px"
                  style={{ background:"#ddffdd", color:"#006600",
                    border:"1px solid #006600" }}>
                  ● LIVE
                </span>
                <span className="font-mono text-[9px] text-[#555]">
                  Protecting 143+ merchants right now
                </span>
              </div>

              {/* Headline */}
              <h1 style={{ margin:0 }}>
                <div className="font-mono font-bold text-black leading-tight"
                  style={{ fontSize:"clamp(28px,4vw,46px)" }}>
                  AEGIS RADAR
                </div>
                <div className="font-mono font-bold leading-tight mt-1"
                  style={{ fontSize:"clamp(14px,2vw,20px)", color:"#000080" }}>
                  Real-time AI Fraud Detection<br />
                  for Egyptian Businesses
                </div>
              </h1>

              {/* Tagline */}
              <p className="font-mono text-sm text-[#444] leading-relaxed max-w-md" style={{ margin:0 }}>
                Stop fraud before it happens. AEGIS RADAR analyses every transaction
                in milliseconds using a model trained on Egyptian market data —
                protecting your revenue, not just detecting damage after the fact.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mt-2">
                <W95Btn href="/auth" variant="primary"
                  style={{ padding:"10px 24px", fontSize:"13px" }}>
                  ▶ Get Started Free
                </W95Btn>
                <W95Btn href="/pricing"
                  style={{ padding:"10px 24px", fontSize:"13px" }}>
                  📋 View Pricing
                </W95Btn>
                <W95Btn href="#demo"
                  style={{ padding:"10px 24px", fontSize:"13px" }}>
                  ▷ Watch Demo
                </W95Btn>
              </div>

              <div className="font-mono text-[9px] text-[#808080]">
                No credit card · 14-day free trial · Cancel anytime
              </div>

              {/* Trusted by */}
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="font-mono text-[9px] text-[#808080]">Trusted by:</span>
                {["CIB Egypt","Jumia EG","Noon.com","Talabat","B.TECH"].map((b) => (
                  <span key={b} className="font-mono text-[9px] font-bold text-black px-2 py-px"
                    style={{ background:"#d8d8d8", borderStyle:"solid", borderWidth:"1px",
                      borderColor:"white white #808080 #808080" }}>
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: terminal preview window */}
            <div className="flex-1 max-w-sm w-full">
              <TitleBar title="monitor.exe — Live Feed" />
              <InsetPanel className="bg-black p-3" style={{ minHeight:"200px" }}>
                <div className="font-mono text-[9px] text-[#007700] mb-1">
                  C:\AEGIS&gt; monitor --live
                </div>
                {[
                  { t:"09:14:02", tx:"TX-A3F2K",  m:"Jumia EG",     a:"1,240", r:"✓ NORMAL", c:"#00ff00" },
                  { t:"09:14:05", tx:"TX-B7X9Q",  m:"B.TECH",       a:"4,800", r:"⚠ FRAUD",  c:"#ff4444" },
                  { t:"09:14:08", tx:"TX-C2M5R",  m:"Noon.com",     a:"  340", r:"✓ NORMAL", c:"#00ff00" },
                  { t:"09:14:11", tx:"TX-D9K3P",  m:"Vodafone EG",  a:"  150", r:"⚑ REVIEW", c:"#ffaa00" },
                  { t:"09:14:14", tx:"TX-E4H8W",  m:"Carrefour EG", a:"2,100", r:"⚠ FRAUD",  c:"#ff4444" },
                  { t:"09:14:17", tx:"TX-F1L6N",  m:"Amazon EG",    a:"  890", r:"✓ NORMAL", c:"#00ff00" },
                ].map((r, i) => (
                  <div key={i} className="font-mono leading-relaxed whitespace-pre"
                    style={{ fontSize:"9px", color:r.c,
                      textShadow:`0 0 4px ${r.c}`, opacity:1 - i*0.07 }}>
                    {`[${r.t}] ${r.tx} | ${r.m.padEnd(12)} | EGP ${r.a} | ${r.r}`}
                  </div>
                ))}
                <div className="font-mono text-[9px] text-[#00ff00] mt-1">
                  C:\AEGIS&gt;<span style={{ display:"inline-block", width:"7px", height:"12px",
                    background:"#00ff00", verticalAlign:"middle", marginLeft:"3px",
                    animation:"blink 1.1s step-end infinite" }} />
                </div>
              </InsetPanel>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRUST BAR
// ═══════════════════════════════════════════════════════════════════════════════

function TrustBar() {
  const stats = [
    { metric:"62M+",     label:"Transactions analysed"      },
    { metric:"EGP 4.2B", label:"Fraud value blocked"        },
    { metric:"97.3%",    label:"Detection accuracy"         },
    { metric:"38ms",     label:"Avg. response time"         },
    { metric:"99.97%",   label:"Platform uptime (30d)"      },
    { metric:"143+",     label:"Active merchants"           },
  ];
  return (
    <div style={{ background:"#000080", borderTop:"2px solid #404080",
      borderBottom:"2px solid #404080" }}>
      <div className="max-w-5xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-0.5 min-w-[80px]">
            <div className="font-mono font-bold text-white"
              style={{ fontSize:"20px", textShadow:"0 0 8px rgba(136,170,255,0.5)" }}>
              {s.metric}
            </div>
            <div className="font-mono text-[8px] text-[#88aaff] text-center">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOW IT WORKS
// ═══════════════════════════════════════════════════════════════════════════════

function HowItWorks() {
  const steps = [
    {
      n:"01", icon:"🔌", title:"Connect Your Gateway",
      body:"Integrate AEGIS RADAR with your payment system in under 24 hours. Supports Fawry, Paymob, ValU, Stripe, and custom REST APIs. No card data ever touches our servers.",
      detail:"Avg. integration time: 4 hours",
    },
    {
      n:"02", icon:"🧠", title:"AI Analyses Every Transaction",
      body:"Our Egypt-trained model evaluates 120+ signals per transaction in real-time — device fingerprint, behaviour pattern, BIN data, velocity, geolocation, and more.",
      detail:"38ms average analysis time",
    },
    {
      n:"03", icon:"⚡", title:"Instant Risk Score & Alert",
      body:"Every transaction receives a 0–100 risk score. Scores above your threshold trigger instant alerts via email, SMS, or in-app notification before the transaction completes.",
      detail:"Alerts delivered in < 200ms",
    },
    {
      n:"04", icon:"🛡", title:"Block Fraud Automatically",
      body:"Configure auto-block rules, step-up authentication triggers, and manual review queues. Your team sees everything in the live dashboard and acts with one click.",
      detail:"91.8% fraud recall rate",
    },
  ];

  return (
    <div id="how" className="py-12 px-6" style={{ background:"#d8d8d8",
      borderTop:"2px solid #808080", borderBottom:"2px solid #808080" }}>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        <div className="text-center">
          <div className="font-mono text-[9px] font-bold text-[#808080] tracking-widest mb-1">
            SIMPLE INTEGRATION
          </div>
          <h2 className="font-mono text-2xl font-bold text-black">How AEGIS RADAR Works</h2>
          <p className="font-mono text-[10px] text-[#555] mt-1">
            From connection to protection in four straightforward steps
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {steps.map((s, i) => (
            <div key={s.n} className="flex flex-col relative">
              {/* Connector arrow */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 -right-3 font-mono text-[#808080]"
                  style={{ fontSize:"18px", zIndex:1 }}>→</div>
              )}
              <TitleBar title={`Step ${s.n} — ${s.title}`} />
              <Panel className="flex-1 p-3 flex flex-col gap-2">
                <div className="text-3xl">{s.icon}</div>
                <div className="font-mono text-[10px] font-bold text-black">{s.title}</div>
                <div className="font-mono text-[9px] text-[#444] leading-relaxed flex-1">{s.body}</div>
                <InsetPanel className="bg-[#000080] px-2 py-1 mt-auto">
                  <span className="font-mono text-[8px] text-[#88aaff]">{s.detail}</span>
                </InsetPanel>
              </Panel>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KEY FEATURES
// ═══════════════════════════════════════════════════════════════════════════════

function Features() {
  const [active, setActive] = useState(0);

  const features = [
    {
      icon:"📡", title:"Live Transaction Radar",
      tagline:"See every transaction the moment it happens",
      body:"The Live Monitor streams every transaction in real-time with colour-coded risk indicators. Filter by status, drill into any transaction for full details, and take action in one click — block IPs, flag for review, or contact the merchant directly from the feed.",
      bullets:["Real-time WebSocket feed","Colour-coded FRAUD / REVIEW / NORMAL","Expandable row details","One-click action buttons"],
      preview:"monitor",
    },
    {
      icon:"🧬", title:"Behavioural Analysis",
      tagline:"Detect fraud that rules can't catch",
      body:"AEGIS RADAR builds a behavioural fingerprint for every customer — typical transaction times, device patterns, spending ranges, and navigation behaviour. Deviations trigger silent step-up authentication before fraud completes.",
      bullets:["Device fingerprinting (canvas + audio)","Velocity & pattern analysis","Session behaviour scoring","SIM-swap & ATO detection"],
      preview:"behaviour",
    },
    {
      icon:"💡", title:"Smart Recommendations",
      tagline:"AI-powered advice, not just alerts",
      body:"The Security Posture dashboard doesn't just show you problems — it tells you exactly what to fix and how. Personalised, priority-ranked recommendations updated daily based on your own transaction history and the latest Egypt fraud trends.",
      bullets:["Daily risk posture score","Prioritised action items","Merchant-specific rules","Trend-based pattern alerts"],
      preview:"posture",
    },
    {
      icon:"👥", title:"Team & Role Management",
      tagline:"The right access for every team member",
      body:"Assign granular roles — Admin, Analyst, or Viewer — so each team member sees exactly what they need. Full audit log of every action taken, with email notifications for critical events.",
      bullets:["Admin / Analyst / Viewer roles","Full audit trail","Invite by email","AEGIS SSO (Enterprise)"],
      preview:"team",
    },
    {
      icon:"📊", title:"Audit & Analytics",
      tagline:"Business intelligence built for fraud ops",
      body:"The Analytics dashboard gives decision-makers a complete picture: fraud rate trends, risk score distributions, top risky merchants, and a 24×7 fraud heatmap. Export any view as CSV or schedule automated PDF reports.",
      bullets:["30-day trend charts","Fraud heatmap by hour / day","Top merchant & country risk","CSV export & scheduled reports"],
      preview:"analytics",
    },
  ];

  const f = features[active];

  return (
    <div id="features" className="py-12 px-6" style={{ background:"#c0c0c0" }}>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        <div className="text-center">
          <div className="font-mono text-[9px] font-bold text-[#808080] tracking-widest mb-1">
            PLATFORM CAPABILITIES
          </div>
          <h2 className="font-mono text-2xl font-bold text-black">Everything You Need to Stop Fraud</h2>
        </div>

        <div className="flex gap-3">
          {/* Feature tabs (vertical) */}
          <div className="flex flex-col gap-1 shrink-0" style={{ width:"180px" }}>
            {features.map((feat, i) => (
              <button key={i} onClick={() => setActive(i)}
                className="flex items-center gap-2 px-2 py-2 text-left w-full"
                style={{
                  ...MONO, cursor:"pointer", fontSize:"10px", fontWeight:"bold",
                  background: active === i ? "#000080" : "#d8d8d8",
                  color:      active === i ? "white"   : "black",
                  borderStyle:"solid", borderWidth:"2px",
                  borderColor: active === i
                    ? "#404080 #404080 white white"
                    : "white white #808080 #808080",
                }}>
                <span style={{ fontSize:"14px" }}>{feat.icon}</span>
                <span className="leading-tight">{feat.title}</span>
              </button>
            ))}
          </div>

          {/* Feature detail */}
          <div className="flex-1 min-w-0 flex flex-col">
            <TitleBar title={`${f.icon} ${f.title} — ${f.tagline}`} />
            <Panel className="flex-1 p-4 flex flex-col md:flex-row gap-4">

              {/* Left: description */}
              <div className="flex-1 flex flex-col gap-3">
                <p className="font-mono text-sm text-[#333] leading-relaxed" style={{ margin:0 }}>
                  {f.body}
                </p>
                <div className="flex flex-col gap-1">
                  {f.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="font-mono text-[11px] text-[#006600] shrink-0">✓</span>
                      <span className="font-mono text-[10px] text-black">{b}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-auto">
                  <W95Btn href="/auth" variant="primary"
                    style={{ fontSize:"11px", padding:"6px 18px" }}>
                    Try {f.title} Free →
                  </W95Btn>
                </div>
              </div>

              {/* Right: mini terminal mockup */}
              <div className="shrink-0" style={{ width:"200px" }}>
                <TitleBar title={`${f.preview}.exe`} />
                <InsetPanel className="bg-black p-2" style={{ minHeight:"120px" }}>
                  <div className="font-mono text-[8px] text-[#007700] mb-1">
                    C:\AEGIS\{f.preview}&gt;
                  </div>
                  {f.bullets.map((b, i) => (
                    <div key={i} className="font-mono text-[8px] leading-relaxed"
                      style={{ color:"#00cc00", textShadow:"0 0 3px #00aa00" }}>
                      ✓ {b.toLowerCase()}
                    </div>
                  ))}
                  <div className="font-mono text-[8px] text-[#00ff00] mt-1">
                    STATUS: ACTIVE
                  </div>
                </InsetPanel>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WHY EGYPT
// ═══════════════════════════════════════════════════════════════════════════════

function WhyEgypt() {
  const reasons = [
    {
      icon:"🇪🇬", title:"Built for the Egyptian Market",
      body:"Our fraud model is trained exclusively on Egyptian transaction patterns — Fawry, Paymob, ValU, CIB, NBE. We understand local MCC codes, EGP transaction ranges, and Egypt-specific fraud vectors like SIM-swap abuse and friendly fraud on COD orders.",
    },
    {
      icon:"🏦", title:"Integrates with Local Payment Rails",
      body:"Native integrations with Fawry, Paymob, ValU, Vodafone Cash, and Orange Money — not just international gateways. No custom middleware required.",
    },
    {
      icon:"🌐", title:"Arabic & English Interface",
      body:"The full dashboard, alerts, and reports are available in both Arabic (RTL) and English. Team members can use their preferred language without any configuration.",
    },
    {
      icon:"⚖️", title:"CBE & GDPR Compliance",
      body:"AEGIS RADAR meets Central Bank of Egypt cybersecurity guidelines and GDPR data handling requirements. Enterprise customers can opt for Egypt-local data residency.",
    },
    {
      icon:"📞", title:"Local Support Team in Cairo",
      body:"Business-hours support from our Cairo team — same timezone, same language, same understanding of your market. Enterprise plans include a dedicated account manager.",
    },
    {
      icon:"⚡", title:"38ms Median Latency",
      body:"Our inference infrastructure is hosted in EU-West (Ireland) with CDN edge nodes, delivering sub-50ms response times for every Egyptian transaction, even at peak load.",
    },
  ];

  return (
    <div className="py-12 px-6" style={{ background:"#d8d8d8",
      borderTop:"2px solid #808080", borderBottom:"2px solid #808080" }}>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        <div className="text-center">
          <div className="font-mono text-[9px] font-bold text-[#808080] tracking-widest mb-1">
            LOCALISED FOR EGYPT
          </div>
          <h2 className="font-mono text-2xl font-bold text-black">
            Why Egyptian Businesses Choose AEGIS RADAR
          </h2>
          <p className="font-mono text-[10px] text-[#555] mt-1">
            Generic fraud tools miss Egypt-specific patterns. We don&apos;t.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {reasons.map((r) => (
            <div key={r.title} className="flex flex-col">
              <Panel className="flex-1 p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize:"20px" }}>{r.icon}</span>
                  <span className="font-mono text-[10px] font-bold text-black leading-tight">
                    {r.title}
                  </span>
                </div>
                <div className="font-mono text-[9px] text-[#444] leading-relaxed">{r.body}</div>
              </Panel>
            </div>
          ))}
        </div>

        {/* Egypt stat callout */}
        <InsetPanel className="bg-[#000080] p-4 flex flex-wrap items-center justify-between gap-4">
          {[
            { n:"EGP 4.2B+", l:"fraud blocked for Egyptian merchants" },
            { n:"2.9%",       l:"average fraud rate in Egypt e-commerce" },
            { n:"<24hrs",     l:"average time to go live with AEGIS" },
            { n:"🇪🇬 Cairo",  l:"headquartered & supported locally" },
          ].map((s) => (
            <div key={s.l} className="flex flex-col items-center gap-0.5">
              <div className="font-mono font-bold text-white" style={{ fontSize:"18px" }}>{s.n}</div>
              <div className="font-mono text-[8px] text-[#88aaff] text-center">{s.l}</div>
            </div>
          ))}
        </InsetPanel>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTIMONIALS
// ═══════════════════════════════════════════════════════════════════════════════

function Testimonials() {
  const reviews = [
    {
      name:"Ahmed Kamal",     role:"Head of Risk & Fraud",   org:"CIB Egypt",
      avatar:"AK", rating:5,
      quote:"We deployed AEGIS RADAR across our e-commerce portfolio in three days. Within the first week it had blocked EGP 280,000 in card-testing attacks that our previous system missed entirely. The Egypt-specific tuning makes a real difference.",
    },
    {
      name:"Sara El-Masry",   role:"VP of Operations",        org:"Jumia Egypt",
      avatar:"SE", rating:5,
      quote:"The live monitor and posture dashboard give our fraud team full situational awareness for the first time. Chargeback rate is down 34% in two months. The Fawry integration worked out of the box — no custom code.",
    },
    {
      name:"Omar Abdel-Aziz", role:"CTO",                     org:"Noon.com EG",
      avatar:"OA", rating:5,
      quote:"We evaluated four fraud platforms. AEGIS was the only one that understood Egyptian-specific fraud patterns — COD abuse, SIM-swap OTP bypass, referral farming on WhatsApp. The model accuracy on our data was genuinely impressive.",
    },
    {
      name:"Nour Hassan",     role:"Fraud Operations Manager", org:"Talabat Egypt",
      avatar:"NH", rating:4,
      quote:"Setup was fast, the team in Cairo is responsive, and the weekly model retraining keeps precision high as fraud patterns shift. The alert customisation is granular enough for our volume without drowning analysts in noise.",
    },
  ];

  return (
    <div className="py-12 px-6" style={{ background:"#c0c0c0" }}>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        <div className="text-center">
          <div className="font-mono text-[9px] font-bold text-[#808080] tracking-widest mb-1">
            CUSTOMER STORIES
          </div>
          <h2 className="font-mono text-2xl font-bold text-black">
            Trusted by Egypt&apos;s Leading Businesses
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reviews.map((r) => (
            <div key={r.name} className="flex flex-col">
              <TitleBar title={`${r.org} — Customer Review`} />
              <Panel className="flex-1 p-3 flex flex-col gap-2">
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{ color: i < r.rating ? "#cc8800" : "#d0d0d0",
                      fontSize:"12px" }}>★</span>
                  ))}
                </div>

                {/* Quote */}
                <InsetPanel className="bg-white p-2 flex-1">
                  <p className="font-mono text-[10px] text-[#333] leading-relaxed" style={{ margin:0 }}>
                    &ldquo;{r.quote}&rdquo;
                  </p>
                </InsetPanel>

                {/* Attribution */}
                <div className="flex items-center gap-2 mt-1">
                  <InsetPanel className="bg-[#000080] flex items-center justify-center shrink-0"
                    style={{ width:"28px", height:"28px" }}>
                    <span className="font-mono text-white text-[9px] font-bold">{r.avatar}</span>
                  </InsetPanel>
                  <div>
                    <div className="font-mono text-[10px] font-bold text-black">{r.name}</div>
                    <div className="font-mono text-[8px] text-[#555]">{r.role} · {r.org}</div>
                  </div>
                </div>
              </Panel>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function DemoSection() {
  return (
    <div id="demo" className="py-12 px-6" style={{ background:"#1a1a2e",
      borderTop:"2px solid #808080", borderBottom:"2px solid #808080" }}>
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <TitleBar title="C:\AEGIS\dashboard.exe — Interactive Demo Preview" accent="dark" />
        <Panel className="p-4 flex flex-col md:flex-row gap-6 items-start">

          {/* Left: description */}
          <div className="flex flex-col gap-3 flex-1">
            <h2 className="font-mono text-xl font-bold text-black" style={{ margin:0 }}>
              See AEGIS RADAR in Action
            </h2>
            <p className="font-mono text-sm text-[#444] leading-relaxed" style={{ margin:0 }}>
              Log in with demo credentials and explore the full dashboard — live transaction
              monitor, analytics, security posture, team management, and more.
              No setup required.
            </p>
            <div className="flex flex-col gap-1.5">
              {[
                "Live transaction feed with simulated fraud events",
                "Real-time analytics and fraud heatmap",
                "Security posture scoring and recommendations",
                "Full team & role management demo",
                "API key management and webhook configuration",
              ].map((b, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="font-mono text-[11px] text-[#006600] shrink-0">✓</span>
                  <span className="font-mono text-[10px] text-black">{b}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <W95Btn href="/auth" variant="primary"
                style={{ fontSize:"12px", padding:"8px 20px" }}>
                ⚡ Launch Demo Dashboard
              </W95Btn>
              <W95Btn href="/pricing"
                style={{ fontSize:"12px", padding:"8px 20px" }}>
                📋 See Pricing
              </W95Btn>
            </div>
          </div>

          {/* Right: demo credentials box */}
          <div className="shrink-0" style={{ width:"220px" }}>
            <TitleBar title="demo_login.txt" />
            <InsetPanel className="bg-black p-3">
              <div className="font-mono text-[9px] text-[#007700] mb-2">
                ▶ DEMO CREDENTIALS
              </div>
              {[
                ["Email",    "demo@demo.com"],
                ["Password", "demo"],
                ["Role",     "Admin"],
                ["Org",      "Demo Corp EG"],
              ].map(([k,v]) => (
                <div key={k} className="flex gap-1 py-px"
                  style={{ borderBottom:"1px solid #002200" }}>
                  <span className="font-mono text-[8px] text-[#007700]" style={{ width:"60px" }}>{k}:</span>
                  <span className="font-mono text-[8px] text-[#00ff00] font-bold">{v}</span>
                </div>
              ))}
              <div className="font-mono text-[8px] text-[#005500] mt-2 leading-snug">
                Full read-write access.<br />No real data — safe to explore.
              </div>
            </InsetPanel>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINAL CTA
// ═══════════════════════════════════════════════════════════════════════════════

function FinalCTA() {
  return (
    <div style={{ background:"#000080", borderTop:"2px solid #404080" }}>
      <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center gap-4 text-center">
        <TitleBar title="AEGIS RADAR — Protect Your Business Today" />
        <Panel className="w-full px-8 py-10 flex flex-col items-center gap-4">

          <div className="font-mono text-[9px] font-bold text-[#808080] tracking-widest">
            JOIN 143+ MERCHANTS ACROSS EGYPT
          </div>

          <h2 className="font-mono text-3xl font-bold text-black leading-tight" style={{ margin:0 }}>
            Stop fraud before it costs you.
          </h2>
          <p className="font-mono text-sm font-bold leading-tight" style={{ color:"#000080", margin:0 }}>
            Start your free 14-day trial today — no credit card required.
          </p>

          <p className="font-mono text-sm text-[#444] max-w-lg leading-relaxed" style={{ margin:0 }}>
            AEGIS RADAR is live in under 24 hours. Our Cairo team will help you
            integrate, configure your first fraud rules, and run your first reports —
            at no extra cost.
          </p>

          <div className="flex gap-3 flex-wrap justify-center mt-2">
            <W95Btn href="/auth" variant="primary"
              style={{ padding:"12px 32px", fontSize:"14px" }}>
              ▶ Create Free Account
            </W95Btn>
            <W95Btn href="mailto:sales@aegisradar.io"
              style={{ padding:"12px 32px", fontSize:"14px" }}>
              ✉ Talk to Sales
            </W95Btn>
            <W95Btn href="/pricing"
              style={{ padding:"12px 32px", fontSize:"14px" }}>
              📋 View Pricing
            </W95Btn>
          </div>

          <div className="font-mono text-[9px] text-[#808080]">
            14-day free trial · No credit card · Cancel anytime · EGP pricing · CBE compliant
          </div>

          {/* Mini trust row */}
          <div className="flex flex-wrap gap-3 justify-center mt-2 pt-3"
            style={{ borderTop:"1px solid #b0b0b0" }}>
            {[
              "🔒 TLS 1.3 Encrypted",
              "🇪🇬 Hosted locally",
              "✓ CBE Compliant",
              "✓ GDPR Compliant",
              "⬡ 99.97% Uptime SLA",
            ].map((t) => (
              <span key={t} className="font-mono text-[9px] text-[#555]">{t}</span>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════════════════════

function Footer() {
  const cols = [
    { title:"PRODUCT",  links:["Features","Pricing","API Docs","Integrations","Changelog","Status"] },
    { title:"SOLUTIONS",links:["E-Commerce","Banking","Fintech","Telecom","Government","PSPs"] },
    { title:"COMPANY",  links:["About Us","Blog","Careers","Press Kit","Contact","Partners"] },
    { title:"LEGAL",    links:["Privacy Policy","Terms of Service","Security","Cookie Policy","DPA","Licenses"] },
  ];

  return (
    <div style={{ background:"#c0c0c0", borderTop:"2px solid #808080" }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <InsetPanel className="bg-[#000080] flex items-center justify-center shrink-0"
                style={{ width:"28px", height:"28px" }}>
                <span className="font-mono text-white font-bold" style={{ fontSize:"13px" }}>⬡</span>
              </InsetPanel>
              <span className="font-mono text-sm font-bold text-black">AEGIS RADAR</span>
            </div>
            <p className="font-mono text-[9px] text-[#555] leading-relaxed">
              AI-powered fraud detection built for Egyptian businesses. Protecting
              e-commerce, payments, and financial platforms since 2023.
            </p>
            <div className="font-mono text-[8px] px-2 py-px inline-block"
              style={{ background:"#ddffdd", color:"#006600", border:"1px solid #006600",
                width:"fit-content" }}>
              ● All systems operational
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <div className="font-mono text-[10px] font-bold text-black mb-2">{col.title}</div>
              {col.links.map((l) => (
                <div key={l}>
                  <a href="#" className="font-mono text-[9px] text-[#555] hover:text-[#000080]"
                    style={{ textDecoration:"none", display:"block", lineHeight:"1.9" }}>
                    {l}
                  </a>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3"
          style={{ borderTop:"1px solid #b0b0b0" }}>
          <span className="font-mono text-[9px] text-[#808080]">
            © 2025 AEGIS Systems Ltd. · Cairo, Egypt · All rights reserved
          </span>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-[9px] text-[#808080]">
              🇪🇬 Made in Egypt for Egyptian businesses
            </span>
            <span className="font-mono text-[9px] text-[#808080]">
              Build 20250517
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE ROOT
// ═══════════════════════════════════════════════════════════════════════════════

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden"
      style={{ background:"#008080", ...MONO }}>

      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50"
        style={{ backgroundImage:
          "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.02) 2px,rgba(0,0,0,0.02) 4px)" }} />

      <Navbar />

      {/* Page content — gray desktop surface */}
      <div className="flex-1" style={{ background:"#c0c0c0" }}>
        <Hero />
        <TrustBar />
        <HowItWorks />
        <Features />
        <WhyEgypt />
        <Testimonials />
        <DemoSection />
        <FinalCTA />
        <Footer />
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity:1; }
          50%       { opacity:0; }
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}