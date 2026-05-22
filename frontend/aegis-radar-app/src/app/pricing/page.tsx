"use client";

/**
 * src/app/pricing/page.tsx
 *
 * AEGIS RADAR — Public Pricing & Marketing Page.
 * Standalone page for unauthenticated visitors.
 * Sections: Navbar · Hero · Stats bar · Pricing cards ·
 *           Feature comparison table · FAQ · CTA banner · Footer
 *
 * No layout.tsx wrapper — fully self-contained with its own shell.
 */

import { useState } from "react";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & DATA
// ═══════════════════════════════════════════════════════════════════════════════

interface Plan {
  id:        string;
  name:      string;
  price:     number | null; // null = custom
  cycle:     string;
  tagline:   string;
  badge?:    string;
  popular:   boolean;
  cta:       string;
  ctaLink:   string;
  features:  string[];
  color:     string;        // accent colour for the card
}

const PLANS: Plan[] = [
  {
    id: "starter", name: "Starter", price: 900, cycle: "/month",
    tagline: "Perfect for small e-commerce shops and new merchants",
    popular: false, cta: "Get Started Free", ctaLink: "/auth",
    color: "#000080",
    features: [
      "50,000 transactions / month",
      "3 team seats",
      "100,000 API calls / month",
      "Live transaction monitor",
      "Basic fraud rules engine",
      "Email alerts",
      "7-day data retention",
      "Community support",
    ],
  },
  {
    id: "professional", name: "Professional", price: 3900, cycle: "/month",
    tagline: "For growing e-commerce platforms and payment operators",
    badge: "★ MOST POPULAR", popular: true,
    cta: "Start Free Trial", ctaLink: "/auth",
    color: "#880000",
    features: [
      "500,000 transactions / month",
      "10 team seats",
      "1,000,000 API calls / month",
      "Live transaction monitor",
      "Advanced fraud rules engine",
      "Email, SMS & in-app alerts",
      "Full analytics & posture scores",
      "Custom rule builder",
      "API & webhook integrations",
      "Weekly model retraining",
      "18-month data retention",
      "Business hours support (Egypt)",
    ],
  },
  {
    id: "enterprise", name: "Enterprise", price: null, cycle: "annual contract",
    tagline: "For banks, PSPs, and large-scale financial platforms",
    popular: false, cta: "Contact Sales", ctaLink: "/auth",
    color: "#005500",
    features: [
      "Unlimited transactions",
      "Unlimited team seats",
      "Unlimited API calls",
      "Live transaction monitor",
      "Custom Egypt-tuned ML model",
      "All channels + PagerDuty",
      "Full analytics & posture scores",
      "Custom rule builder + AI assist",
      "API, webhook & SIEM integrations",
      "On-demand model retraining",
      "Custom data retention policy",
      "24/7 dedicated support",
    ],
  },
];

// Full comparison table rows
interface CompareRow {
  feature:      string;
  category:     string;
  starter:      string | boolean;
  professional: string | boolean;
  enterprise:   string | boolean;
}

const COMPARE_ROWS: CompareRow[] = [
  // Transactions
  { feature:"Monthly transactions",    category:"Core",       starter:"50,000",       professional:"500,000",     enterprise:"Unlimited"     },
  { feature:"API calls / month",       category:"Core",       starter:"100,000",      professional:"1,000,000",     enterprise:"Unlimited"     },
  { feature:"Team seats",              category:"Core",       starter:"3",            professional:"10",          enterprise:"Unlimited"     },
  // Detection
  { feature:"Fraud rules engine",      category:"Detection",  starter:"Basic",        professional:"Advanced",    enterprise:"Custom ML"     },
  { feature:"Risk scoring model",      category:"Detection",  starter:"Standard",     professional:"Egypt-tuned", enterprise:"Bespoke"       },
  { feature:"Model retraining",        category:"Detection",  starter:false,          professional:"Weekly",      enterprise:"On-demand"     },
  { feature:"Card testing detection",  category:"Detection",  starter:true,           professional:true,          enterprise:true            },
  { feature:"ATO prevention",          category:"Detection",  starter:false,          professional:true,          enterprise:true            },
  { feature:"SIM-swap detection",      category:"Detection",  starter:false,          professional:true,          enterprise:true            },
  // Alerts
  { feature:"Email alerts",            category:"Alerts",     starter:true,           professional:true,          enterprise:true            },
  { feature:"In-app notifications",    category:"Alerts",     starter:false,          professional:true,          enterprise:true            },
  { feature:"SMS alerts",              category:"Alerts",     starter:false,          professional:true,          enterprise:true            },
  { feature:"PagerDuty / Slack",       category:"Alerts",     starter:false,          professional:false,         enterprise:true            },
  // Analytics
  { feature:"Transaction history",     category:"Analytics",  starter:"30 days",       professional:"18 months",   enterprise:"Custom"        },
  { feature:"Analytics dashboard",     category:"Analytics",  starter:"Basic",        professional:"Full",        enterprise:"Full + custom"  },
  { feature:"Security posture score",  category:"Analytics",  starter:false,          professional:true,          enterprise:true            },
  { feature:"CSV / report export",     category:"Analytics",  starter:false,          professional:true,          enterprise:true            },
  // Integrations
  { feature:"REST API access",         category:"Integrations",starter:true,          professional:true,          enterprise:true            },
  { feature:"Webhooks",                category:"Integrations",starter:false,         professional:true,          enterprise:true            },
  { feature:"Fawry / Paymob",         category:"Integrations",starter:false,         professional:true,          enterprise:true            },
  { feature:"SIEM integration",       category:"Integrations",starter:false,         professional:false,         enterprise:true            },
  // Support
  { feature:"Support tier",           category:"Support",    starter:"Community",    professional:"Business hrs", enterprise:"24/7 dedicated"},
  { feature:"SLA guarantee",          category:"Support",    starter:false,          professional:"99.9%",       enterprise:"99.99%"        },
  { feature:"Onboarding assistance",  category:"Support",    starter:false,          professional:false,         enterprise:true            },
];

const FAQ_ITEMS = [
  {
    q: "Is AEGIS RADAR suitable for my Egyptian e-commerce shop?",
    a: "Absolutely. AEGIS RADAR was built specifically for the Egyptian market — our fraud detection model is trained on Egyptian transaction patterns, supports EGP natively, and integrates with local payment gateways like Fawry, Paymob, and ValU.",
  },
  {
    q: "Do I need a technical team to integrate AEGIS RADAR?",
    a: "No. The dashboard is fully functional out of the box with zero integration required for manual review. For automated detection, our REST API takes under a day to integrate and we provide SDKs for common platforms (WooCommerce, Magento, custom PHP/Node).",
  },
  {
    q: "What happens if I exceed my transaction limit?",
    a: "We never drop transactions silently. If you approach your limit you'll receive alerts at 70%, 90%, and 100%. Overage transactions are processed at EGP 0.04 per transaction until your next billing cycle or until you upgrade.",
  },
  {
    q: "Can I cancel or downgrade at any time?",
    a: "Yes. Monthly plans can be cancelled or downgraded at any time effective from the next billing date. There are no lock-in fees. Annual plans include a 30-day money-back guarantee.",
  },
  {
    q: "Is my transaction data stored securely and within Egypt?",
    a: "Transaction data is encrypted at rest (AES-256) and in transit (TLS 1.3). Enterprise customers can request Egypt-local data residency. We are compliant with CBE cybersecurity guidelines and GDPR.",
  },
  {
    q: "What is the difference between Starter and Professional fraud detection?",
    a: "Starter includes our standard rules engine (velocity checks, BIN analysis, country blocking). Professional adds our Egypt-tuned ML model, behavioural biometrics, device fingerprinting, SIM-swap detection, and weekly model retraining on your own transaction history.",
  },
];

const SOCIAL_PROOF = [
  { metric: "62M+",    label: "Transactions analysed"       },
  { metric: "EGP 4.2B",label: "Fraud value blocked"         },
  { metric: "97.3%",   label: "Model accuracy"              },
  { metric: "143",     label: "Active merchants in Egypt"   },
  { metric: "38ms",    label: "Avg. detection latency"      },
];

// ═══════════════════════════════════════════════════════════════════════════════
// WIN95 PRIMITIVES  (standalone — no dependency on dashboard components)
// ═══════════════════════════════════════════════════════════════════════════════

const MONO: React.CSSProperties = { fontFamily: "'Courier New', Courier, monospace" };

function W95Btn({
  children, onClick, href, variant = "default", className = "", style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "primary" | "danger";
  className?: string;
  style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    ...MONO,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", userSelect: "none",
    borderStyle: "solid", borderWidth: "2px",
    borderColor: "white white #808080 #808080",
    padding: "6px 16px", fontSize: "11px", fontWeight: "bold",
    textDecoration: "none",
    ...style,
  };
  const variantStyles: React.CSSProperties =
    variant === "primary" ? { background: "#000080", color: "white",
      borderColor: "white white #404080 #404080" } :
    variant === "danger"  ? { background: "#880000", color: "white",
      borderColor: "white white #440000 #440000" } :
    { background: "#c0c0c0", color: "black" };

  if (href) {
    return (
      <Link href={href} className={className}
        style={{ ...base, ...variantStyles }}>
        {children}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={className}
      style={{ ...base, ...variantStyles }}>
      {children}
    </button>
  );
}

function TitleBar({ title, accent = false }: { title: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between px-2 select-none"
      style={{ background: accent
        ? "linear-gradient(to right,#880000,#cc2200)"
        : "linear-gradient(to right,#000080,#1084d0)",
        height: "22px" }}>
      <span className="text-white text-[10px] font-bold tracking-wide truncate" style={MONO}>
        {title}
      </span>
      <div className="flex gap-px">
        {["−","□","×"].map((b) => (
          <button key={b} style={{ fontSize:"8px", width:"14px", height:"12px",
            borderStyle:"solid", borderWidth:"1px", cursor:"default",
            borderColor:"white white #808080 #808080", background:"#c0c0c0",
            display:"flex", alignItems:"center", justifyContent:"center", ...MONO }}>
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

// ═══════════════════════════════════════════════════════════════════════════════
// NAVBAR
// ═══════════════════════════════════════════════════════════════════════════════

function Navbar() {
  return (
    <div className="shrink-0"
      style={{ background:"#c0c0c0", borderBottom:"2px solid #808080" }}>
      {/* Win95 taskbar-style top strip */}
      <div className="flex items-center px-6 py-2 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <InsetPanel className="bg-[#000080] flex items-center justify-center"
            style={{ width:"32px", height:"32px" }}>
            <span className="font-mono text-white text-xs font-bold">⬡</span>
          </InsetPanel>
          <div>
            <div className="font-mono text-sm font-bold text-black leading-tight">AEGIS RADAR</div>
            <div className="font-mono text-[8px] text-[#555]">AI Fraud Detection Platform</div>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1 ml-4">
          {[
            { label:"Product",  href:"#" },
            { label:"Pricing",  href:"/pricing" },
            { label:"Docs",     href:"#" },
            { label:"About",    href:"#" },
            { label:"Contact",  href:"#" },
          ].map((item) => (
            <Link key={item.label} href={item.href}
              className="font-mono text-xs text-black px-2 py-1 hover:bg-[#000080] hover:text-white"
              style={{ textDecoration:"none" }}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex-1" />

        {/* Auth buttons */}
        <div className="flex items-center gap-2">
          <W95Btn href="/auth">Sign In</W95Btn>
          <W95Btn href="/auth" variant="primary">Get Started →</W95Btn>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HERO
// ═══════════════════════════════════════════════════════════════════════════════

function Hero() {
  return (
    <div className="py-12 px-6 flex flex-col items-center text-center gap-6">

      {/* Window chrome wrapper for the hero headline */}
      <div className="w-full max-w-3xl">
        <TitleBar title="AEGIS RADAR v2.1 — AI-Powered Fraud Detection for Egyptian Businesses" />
        <Panel className="px-8 py-10 flex flex-col items-center gap-4">

          {/* Badge */}
          <div className="font-mono text-[9px] font-bold px-3 py-1"
            style={{ background:"#000080", color:"white",
              borderStyle:"solid", borderWidth:"1px",
              borderColor:"white white #808080 #808080" }}>
            ⬡ NOW SERVING 143+ MERCHANTS ACROSS EGYPT
          </div>

          {/* Headline */}
          <h1 className="font-mono font-bold leading-tight text-black"
            style={{ fontSize:"clamp(22px, 3vw, 34px)" }}>
            Protect Your Business with<br />
            <span style={{ color:"#000080" }}>AI-Powered Fraud Detection</span>
          </h1>

          {/* Sub-headline */}
          <p className="font-mono text-sm text-[#444] max-w-xl leading-relaxed">
            AEGIS RADAR analyses every transaction in real-time using a model trained
            on Egyptian e-commerce data — blocking fraud before it reaches your customers,
            not after your chargeback deadline.
          </p>

          {/* CTAs */}
          <div className="flex gap-3 flex-wrap justify-center mt-2">
            <W95Btn href="/auth" variant="primary" style={{ padding:"10px 28px", fontSize:"13px" }}>
              ▶ Start Free Trial
            </W95Btn>
            <W95Btn href="#pricing" style={{ padding:"10px 28px", fontSize:"13px" }}>
              📋 View Pricing
            </W95Btn>
          </div>

          {/* Trust note */}
          <div className="font-mono text-[9px] text-[#808080] mt-1">
            No credit card required · 14-day free trial · Cancel anytime
          </div>
        </Panel>
      </div>

      {/* Terminal demo window */}
      <div className="w-full max-w-3xl">
        <TitleBar title="C:\AEGIS\monitor.exe — Live Transaction Feed (Demo)" />
        <InsetPanel className="bg-black px-4 py-3" style={{ fontFamily:"'Courier New',monospace" }}>
          {[
            { t:"09:14:02", tx:"TX-A3F2K1", m:"Jumia EG",        amt:"EGP  1,240.00", r:"RISK: LOW  → ✓ NORMAL", c:"#00ff00" },
            { t:"09:14:05", tx:"TX-B7X9Q4", m:"B.TECH",          amt:"EGP  4,800.00", r:"RISK: HIGH → ⚠ FRAUD",  c:"#ff4444" },
            { t:"09:14:08", tx:"TX-C2M5R8", m:"Noon Electronics", amt:"EGP    340.00", r:"RISK: LOW  → ✓ NORMAL", c:"#00ff00" },
            { t:"09:14:11", tx:"TX-D9K3P2", m:"Vodafone Recharge",amt:"EGP    150.00", r:"RISK: MED  → ⚑ REVIEW", c:"#ffaa00" },
            { t:"09:14:14", tx:"TX-E4H8W6", m:"Carrefour Cairo",  amt:"EGP  2,100.00", r:"RISK: HIGH → ⚠ FRAUD",  c:"#ff4444" },
          ].map((row, i) => (
            <div key={i} className="font-mono text-[11px] leading-relaxed whitespace-pre"
              style={{ color:row.c, textShadow:`0 0 4px ${row.c}`,
                opacity: 1 - i * 0.08 }}>
              {`[${row.t}] ${row.tx} | ${row.m.padEnd(18)} | ${row.amt.padStart(14)} | ${row.r}`}
            </div>
          ))}
          <div className="font-mono text-[11px] text-[#00ff00] mt-1">
            C:\AEGIS&gt; <span style={{ display:"inline-block", width:"8px", height:"13px",
              background:"#00ff00", verticalAlign:"middle",
              animation:"blink 1.1s step-end infinite" }} />
          </div>
        </InsetPanel>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL PROOF STATS BAR
// ═══════════════════════════════════════════════════════════════════════════════

function StatsBar() {
  return (
    <div style={{ background:"#000080", borderTop:"2px solid #808080",
      borderBottom:"2px solid #808080" }}>
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-4">
        {SOCIAL_PROOF.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-0.5">
            <div className="font-mono font-bold text-white"
              style={{ fontSize:"22px", textShadow:"0 0 8px rgba(255,255,255,0.3)" }}>
              {s.metric}
            </div>
            <div className="font-mono text-[9px] text-[#88aaff] text-center">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRICING CARDS
// ═══════════════════════════════════════════════════════════════════════════════

function PricingSection() {
  return (
    <div id="pricing" className="py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
 
        {/* Section heading */}
        <div className="text-center">
          <div className="font-mono text-xs font-bold text-[#808080] tracking-widest mb-1">
            TRANSPARENT PRICING
          </div>
          <h2 className="font-mono text-2xl font-bold text-black">
            Choose the right plan for your business
          </h2>
          <p className="font-mono text-sm text-[#555] mt-1">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
        </div>
 
        {/* Cards grid */}
        <div className="grid grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div key={plan.id} className="flex flex-col relative"
              style={{
                borderStyle:"solid", borderWidth:"2px",
                borderColor: plan.popular
                  ? "#000080 #000080 #000080 #000080"
                  : "white white #808080 #808080",
                background: plan.popular ? "#f0f4ff" : "#e8e8e8",
              }}>
 
              {/* Popular badge — floats above the card */}
              {plan.badge && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <span className="font-mono text-[9px] font-bold px-3 py-0.5"
                    style={{ background:"#cc8800", color:"white",
                      borderStyle:"solid", borderWidth:"1px",
                      borderColor:"white white #884400 #884400" }}>
                    {plan.badge}
                  </span>
                </div>
              )}
 
              {/* Card title bar */}
              <div className="flex items-center justify-between px-2 py-1 mt-2"
                style={{ background:`linear-gradient(to right,${plan.color},${plan.color}cc)`,
                  height:"24px" }}>
                <span className="font-mono text-[11px] font-bold text-white">{plan.name}</span>
              </div>
 
              {/* Price */}
              <div className="px-4 pt-4 pb-3" style={{ borderBottom:"1px solid #b0b0b0" }}>
                {plan.price !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-sm text-[#555]">EGP</span>
                    <span className="font-mono font-bold leading-none"
                      style={{ fontSize:"36px",
                        color: plan.popular ? "#000080" : "#222" }}>
                      {plan.price.toLocaleString()}
                    </span>
                    <span className="font-mono text-[10px] text-[#555]">{plan.cycle}</span>
                  </div>
                ) : (
                  <div>
                    <div className="font-mono font-bold text-2xl text-[#550000]">Custom</div>
                    <div className="font-mono text-[9px] text-[#555]">Annual contract · volume pricing</div>
                  </div>
                )}
                <div className="font-mono text-[9px] text-[#808080] mt-1">{plan.tagline}</div>
              </div>
 
              {/* Features */}
              <div className="px-4 py-3 flex-1 flex flex-col gap-1.5">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-mono text-[11px] shrink-0 mt-px text-[#006600]">✓</span>
                    <span className="font-mono text-[10px] text-[#222] leading-snug">{f}</span>
                  </div>
                ))}
              </div>
 
              {/* CTA */}
              <div className="px-4 pb-4 mt-2">
                <W95Btn
                  href={plan.ctaLink}
                  variant={plan.popular ? "primary" : "default"}
                  style={{ width:"100%", padding:"8px 0", fontSize:"11px" }}
                >
                  {plan.id === "starter"      ? "▶ " + plan.cta :
                   plan.id === "professional" ? "▶ " + plan.cta :
                  "✉ " + plan.cta }
                </W95Btn>
                {plan.id !== "enterprise" && (
                  <div className="font-mono text-[8px] text-[#808080] text-center mt1">
                    14-day free trial included
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
 
        {/* Annual discount note */}
        <div className="flex justify-center">
          <Panel className="px-4 py-2 flex items-center gap-3">
            <span className="font-mono text-sm">💡</span>
            <span className="font-mono text-[10px] text-black">
              <b>Save 2 months</b> with annual billing — pay for 10 months, get 12.
              Switch any time.
            </span>
            <W95Btn href="/auth" style={{ fontSize:"10px", padding:"3px 12px" }}>
              View Annual Plans
            </W95Btn>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPARISON TABLE
// ═══════════════════════════════════════════════════════════════════════════════

function CompareTable() {
  const categories = [...new Set(COMPARE_ROWS.map((r) => r.category))];

  const renderCell = (val: string | boolean) => {
    if (val === true)  return <span style={{ color:"#006600", fontSize:"14px" }}>✓</span>;
    if (val === false) return <span style={{ color:"#c0c0c0", fontSize:"12px" }}>—</span>;
    return <span className="font-mono text-[10px] text-black">{val}</span>;
  };

  return (
    <div className="py-10 px-6" style={{ background:"#d8d8d8",
      borderTop:"2px solid #808080", borderBottom:"2px solid #808080" }}>
      <div className="max-w-5xl mx-auto flex flex-col gap-4">

        <div className="text-center mb-2">
          <h2 className="font-mono text-xl font-bold text-black">Full Feature Comparison</h2>
          <p className="font-mono text-[10px] text-[#555] mt-1">
            Every feature across every plan — no hidden limitations
          </p>
        </div>

        <div>
          <TitleBar title="AEGIS RADAR — Feature Matrix" />
          <Panel className="p-0 overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left font-mono text-[10px] font-bold text-black bg-[#c0c0c0]"
                    style={{ borderStyle:"solid", borderWidth:"1px",
                      borderColor:"white white #808080 #808080", width:"40%" }}>
                    FEATURE
                  </th>
                  {PLANS.map((p) => (
                    <th key={p.id}
                      className="px-3 py-2 text-center font-mono text-[10px] font-bold text-black"
                      style={{ borderStyle:"solid", borderWidth:"1px",
                        borderColor:"white white #808080 #808080",
                        background: p.popular ? "#dde8ff" : "#c0c0c0",
                        width:"20%" }}>
                      {p.popular && <span style={{ color:"#000080" }}>★ </span>}
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <>
                    {/* Category separator row */}
                    <tr key={`cat-${cat}`}>
                      <td colSpan={4} className="px-3 py-1 font-mono text-[9px] font-bold"
                        style={{ background:"#000080", color:"#88aaff",
                          borderBottom:"1px solid #000060",
                          letterSpacing:"0.1em" }}>
                        {cat.toUpperCase()}
                      </td>
                    </tr>
                    {COMPARE_ROWS.filter((r) => r.category === cat).map((row, i) => (
                      <tr key={row.feature}
                        style={{ background: i % 2 === 0 ? "#ffffff" : "#f4f4f4" }}>
                        <td className="px-3 py-1.5 font-mono text-[10px] text-black"
                          style={{ borderBottom:"1px solid #e0e0e0" }}>
                          {row.feature}
                        </td>
                        <td className="px-3 py-1.5 text-center"
                          style={{ borderBottom:"1px solid #e0e0e0" }}>
                          {renderCell(row.starter)}
                        </td>
                        <td className="px-3 py-1.5 text-center"
                          style={{ borderBottom:"1px solid #e0e0e0",
                            background: i % 2 === 0 ? "#eef2ff" : "#e8eeff" }}>
                          {renderCell(row.professional)}
                        </td>
                        <td className="px-3 py-1.5 text-center"
                          style={{ borderBottom:"1px solid #e0e0e0" }}>
                          {renderCell(row.enterprise)}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ
// ═══════════════════════════════════════════════════════════════════════════════

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="py-10 px-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <div className="text-center mb-2">
          <h2 className="font-mono text-xl font-bold text-black">
            Frequently Asked Questions
          </h2>
          <p className="font-mono text-[10px] text-[#555] mt-1">
            Everything Egyptian businesses ask before getting started
          </p>
        </div>

        <div>
          <TitleBar title="FAQ — AEGIS RADAR Pricing & Features" />
          <Panel className="p-0">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={i} style={{ borderBottom: i < FAQ_ITEMS.length-1 ? "1px solid #b0b0b0" : "none" }}>
                  {/* Question row */}
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex items-center justify-between w-full px-4 py-3 text-left
                      hover:bg-[#d8d8d8] focus:outline-none"
                    style={{ background: isOpen ? "#dde8ff" : "transparent" }}>
                    <span className="font-mono text-[11px] font-bold text-black pr-4">
                      {item.q}
                    </span>
                    <span className="font-mono text-xs text-[#808080] shrink-0">
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </button>
                  {/* Answer */}
                  {isOpen && (
                    <div className="px-4 pb-3 pt-1"
                      style={{ background:"#f0f4ff",
                        borderTop:"1px solid #b0b0b0" }}>
                      <p className="font-mono text-[10px] text-[#333] leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </Panel>
        </div>

        <div className="text-center font-mono text-[10px] text-[#555]">
          Still have questions?{" "}
          <a href="mailto:support@aegisradar.io"
            className="text-[#000080] font-bold" style={{ textDecoration:"underline" }}>
            Email our team
          </a>
          {" "}or{" "}
          <a href="#" className="text-[#000080] font-bold" style={{ textDecoration:"underline" }}>
            book a demo call
          </a>
          .
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINAL CTA BANNER
// ═══════════════════════════════════════════════════════════════════════════════

function CTABanner() {
  return (
    <div style={{ background:"#000080", borderTop:"2px solid #808080" }}>
      <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col items-center gap-4 text-center">
        <TitleBar title="AEGIS RADAR — Start Protecting Your Business Today" />
        <Panel className="w-full px-8 py-8 flex flex-col items-center gap-4">
          <div className="font-mono text-[9px] font-bold text-[#808080] tracking-widest">
            JOIN 143+ MERCHANTS ALREADY PROTECTED
          </div>
          <h2 className="font-mono text-2xl font-bold text-black leading-tight">
            Stop fraud before it costs you.<br />
            <span style={{ color:"#000080" }}>Start your free trial today.</span>
          </h2>
          <p className="font-mono text-sm text-[#444] max-w-lg leading-relaxed">
            No setup fees. No long contracts. Just real-time fraud detection trained
            on Egyptian transaction data — live in under 24 hours.
          </p>
          <div className="flex gap-3 flex-wrap justify-center mt-2">
            <W95Btn href="/auth" variant="primary"
              style={{ padding:"12px 32px", fontSize:"13px" }}>
              ▶ Create Free Account
            </W95Btn>
            <W95Btn href="mailto:sales@aegisradar.io"
              style={{ padding:"12px 32px", fontSize:"13px" }}>
              ✉ Talk to Sales
            </W95Btn>
          </div>
          <div className="font-mono text-[9px] text-[#808080]">
            14-day free trial · No credit card · Cancel anytime · EGP pricing · VAT incl.
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
  return (
    <div style={{ background:"#c0c0c0", borderTop:"2px solid #808080" }}>
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-6 mb-4">
          {/* Brand */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <InsetPanel className="bg-[#000080] flex items-center justify-center"
                style={{ width:"24px", height:"24px" }}>
                <span className="font-mono text-white text-[9px] font-bold">⬡</span>
              </InsetPanel>
              <span className="font-mono text-sm font-bold text-black">AEGIS RADAR</span>
            </div>
            <p className="font-mono text-[9px] text-[#555] leading-relaxed">
              AI-powered fraud detection built for Egyptian businesses. Protecting
              e-commerce, payments, and financial platforms since 2023.
            </p>
          </div>

          {/* Product */}
          <div>
            <div className="font-mono text-[10px] font-bold text-black mb-2">PRODUCT</div>
            {["Features","Pricing","API Docs","Integrations","Changelog"].map((l) => (
              <div key={l}>
                <a href="#" className="font-mono text-[9px] text-[#555] hover:text-[#000080]"
                  style={{ textDecoration:"none", display:"block", lineHeight:"1.8" }}>
                  {l}
                </a>
              </div>
            ))}
          </div>

          {/* Company */}
          <div>
            <div className="font-mono text-[10px] font-bold text-black mb-2">COMPANY</div>
            {["About Us","Blog","Careers","Press","Contact"].map((l) => (
              <div key={l}>
                <a href="#" className="font-mono text-[9px] text-[#555] hover:text-[#000080]"
                  style={{ textDecoration:"none", display:"block", lineHeight:"1.8" }}>
                  {l}
                </a>
              </div>
            ))}
          </div>

          {/* Legal */}
          <div>
            <div className="font-mono text-[10px] font-bold text-black mb-2">LEGAL</div>
            {["Privacy Policy","Terms of Service","Security","Cookie Policy","DPA"].map((l) => (
              <div key={l}>
                <a href="#" className="font-mono text-[9px] text-[#555] hover:text-[#000080]"
                  style={{ textDecoration:"none", display:"block", lineHeight:"1.8" }}>
                  {l}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between pt-3"
          style={{ borderTop:"1px solid #b0b0b0" }}>
          <span className="font-mono text-[9px] text-[#808080]">
            © 2025 AEGIS Systems Ltd. · Cairo, Egypt · All rights reserved
          </span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] text-[#808080]">
              🇪🇬 Made in Egypt for Egyptian businesses
            </span>
            <span className="font-mono text-[8px] px-2 py-px"
              style={{ background:"#ddffdd", color:"#006600",
                border:"1px solid #006600" }}>
              ● All systems operational
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

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-y-auto"
      style={{ background:"#008080", ...MONO }}>

      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50"
        style={{ backgroundImage:
          "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px)" }} />

      <Navbar />

      <div style={{ background:"#c0c0c0" }} className="flex-1">
        <Hero />
        <StatsBar />
        <PricingSection />
        <CompareTable />
        <FAQ />
        <CTABanner />
        <Footer />
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