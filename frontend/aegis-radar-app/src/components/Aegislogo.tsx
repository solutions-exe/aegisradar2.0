/**
 * src/components/AegisLogo.tsx
 *
 * AEGIS RADAR — Pixel-style logo component.
 *
 * The icon is a 32×32 unit grid (viewBox="0 0 32 32") that scales cleanly
 * to any power-of-two size. All shapes are straight lines and rectangles —
 * no bezier curves — so it stays sharp at every pixel density.
 *
 * ─── Props ───────────────────────────────────────────────────────────────────
 *  size        px width/height of the circular icon.  Default: 32
 *  variant     controls how much detail is rendered:
 *                "full"   – meander teeth + Horus teardrops + brow (≥ 32px)
 *                "mid"    – meander + eye, no teardrops         (≥ 18px)
 *                "micro"  – ring + eye outline + iris dot       (≤ 16px)
 *              Defaults to "full". The component does NOT auto-pick by size —
 *              you choose the right variant for each placement.
 *  showText    render "AEGIS / RADAR" wordmark to the right.   Default: false
 *  textSize    px for "AEGIS". Defaults to size × 0.44.
 *  className   extra class on the wrapper (only when showText=true).
 *
 * ─── Usage guide ─────────────────────────────────────────────────────────────
 *  Title bar (18px)    <AegisLogo size={18} variant="micro" />
 *  Sidebar nav (16px)  <AegisLogo size={16} variant="micro" />
 *  Navbar (32px)       <AegisLogo size={32} variant="full" showText />
 *  Auth hero (56px)    <AegisLogo size={56} variant="full" showText textSize={24} />
 *  Landing hero (80px) <AegisLogo size={80} variant="full" showText textSize={34} />
 *  Footer (24px)       <AegisLogo size={24} variant="mid" showText />
 *  Favicon (16px)      <AegisLogo size={16} variant="micro" />
 */

interface AegisLogoProps {
  size?: number;
  variant?: "full" | "mid" | "micro";
  showText?: boolean;
  textSize?: number;
  className?: string;
}

// ─── Meander tooth counts per variant ────────────────────────────────────────
// Fewer teeth at smaller sizes so they don't merge into a blur.
const TEETH: Record<"full" | "mid" | "micro", number> = {
  full:  24,
  mid:   12,
  micro:  8,
};

export default function AegisLogo({
  size = 32,
  variant = "full",
  showText = false,
  textSize,
  className = "",
}: AegisLogoProps) {
  const ts  = textSize ?? Math.round(size * 0.44);
  const gap = Math.round(size * 0.28);
  const n   = TEETH[variant];

  // Build meander teeth: alternating tall (3u) / short (2u) rotated rects
  const teeth = Array.from({ length: n }, (_, i) => ({
    angle: (i / n) * 360,
    tall:  i % 2 === 0,
  }));

  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      {/* ── 1. Outer dark disc ── */}
      <circle cx="16" cy="16" r="15.5" fill="#FFDD00" />

      {/* ── 2. Outer gold ring ── */}
      <circle cx="16" cy="16" r="15.5" fill="none" stroke="#0a0303" strokeWidth="0.6" />
      <circle cx="16" cy="16" r="13.5" fill="none" stroke="#FFDD00" strokeWidth="0.4" />

      {/* ── 3. Meander border teeth ── */}
      {teeth.map(({ angle, tall }) => (
        <g key={angle} transform={`rotate(${angle} 16 16)`}>
          <rect
            x="15"
            y="0.5"
            width="2"
            height={tall ? 3 : 2}
            fill="#000080"
          />
        </g>
      ))}

      {/* ── 4. Shield face (inner disc) ── */}
      <circle cx="16" cy="16" r="12" fill="#000080" />
      <circle cx="16" cy="16" r="12" fill="none" stroke="#0a0303" strokeWidth="0.5" />

      {/* ── 5. Eye almond fill ── */}
      {variant !== "micro" && (
        <polygon
          points="4,16 7,12 16,11 25,12 28,16 25,20 16,21 7,20"
          fill="#330303"
        />
      )}

      {/* ── 6. Upper eyelid ── */}
      {variant !== "micro" ? (
        <polyline
          points="4,16 7,12 16,11 25,12 28,16"
          fill="none"
          stroke="#FFDD00"
          strokeWidth="0.75"
          strokeLinejoin="round"
        />
      ) : (
        /* micro: simplified almond — just two arcs as polylines */
        <>
          <polyline
            points="6,16 11,13 16,12 21,13 26,16"
            fill="none" stroke="#FFDD00" strokeWidth="0.7" strokeLinejoin="round"
          />
          <polyline
            points="6,16 11,19 16,20 21,19 26,16"
            fill="none" stroke="#FFDD00" strokeWidth="0.5" strokeLinejoin="round"
          />
        </>
      )}

      {/* ── 7. Lower eyelid ── */}
      {variant !== "micro" && (
        <polyline
          points="4,16 7,20 16,21 25,20 28,16"
          fill="none"
          stroke="#FFDD00"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      )}

      {/* ── 8. Corner diamonds (eye corners) ── */}
      {variant !== "micro" && (
        <>
          <polygon points="4,16 5,15 6,16 5,17"  fill="#000080" />
          <polygon points="28,16 27,15 26,16 27,17" fill="#000080" />
        </>
      )}

      {/* ── 9. Horus teardrop markings (full only) ── */}
      {variant === "full" && (
        <>
          {/* right */}
          <rect x="25" y="17" width="1" height="1" fill="#FFDD00" />
          <rect x="26" y="18" width="1" height="1" fill="#FFDD00" />
          <rect x="27" y="19" width="1" height="2" fill="#FFDD00" />
          <rect x="26" y="21" width="1" height="1" fill="#FFDD00" />
          {/* left */}
          <rect x="6"  y="17" width="1" height="1" fill="#FFDD00" />
          <rect x="5"  y="18" width="1" height="1" fill="#FFDD00" />
          <rect x="4"  y="19" width="1" height="2" fill="#FFDD00" />
          <rect x="5"  y="21" width="1" height="1" fill="#FFDD00" />
        </>
      )}

      {/* ── 10. Brow ticks + line (full only) ── */}
      {variant !== "micro" && (
        <>
          <polyline
            points="8,10.5 11,9.5 16,9 21,9.5 24,10.5"
            fill="none" stroke="#FFDD00" strokeWidth="0.5"
          />
          {[10, 13, 16, 19, 22].map((x, i) => {
            const y = i === 2 ? 8.5 : i === 1 || i === 3 ? 9 : 10;
            return (
              <line key={x} x1={x} y1={y} x2={x} y2={y - 1.5}
                stroke="#FFDD00" strokeWidth="0.6" />
            );
          })}
        </>
      )}

      {/* ── 11. Iris ── */}
      <circle cx="16" cy="16" r={variant === "micro" ? 3.5 : 4.5}
        fill="#330303" />
      <circle cx="16" cy="16" r={variant === "micro" ? 3.5 : 4.5}
        fill="none" stroke="#FFDD00"
        strokeWidth={variant === "micro" ? "0.4" : "0.6"} />

      {/* Dashed inner iris ring (full + mid) */}
      {variant !== "micro" && (
        <circle cx="16" cy="16" r="3.2"
          fill="none" stroke="#600000"
          strokeWidth="0.4" strokeDasharray="1 1" />
      )}

      {/* ── 12. Pupil ── */}
      <circle cx="16" cy="16" r={variant === "micro" ? 2 : 2.5}
        fill="#B61915" />
      <circle cx="16" cy="16" r={variant === "micro" ? 2 : 2.5}
        fill="none" stroke="#600000"
        strokeWidth={variant === "micro" ? "0.35" : "0.5"} />

      {/* ── 13. Pupil glow core ── */}
      <circle cx="16" cy="16" r={variant === "micro" ? 1.1 : 1.5}
        fill="#7C0E18" />
      <circle cx="16" cy="16" r={variant === "micro" ? 0.5 : 0.8}
        fill="#330303" />

      {/* ── 14. Specular highlight pixel ── */}
      {variant !== "micro" && (
        <>
          <rect x="17"   y="15"   width="1"   height="1"   fill="#ffffff" opacity="0.65" />
          <rect x="15.2" y="17.2" width="0.7" height="0.7" fill="#ffffff" opacity="0.25" />
        </>
      )}

      {/* ── 15. Cardinal gold diamond pixels ── */}
      <rect x="15" y="3.5" width="2" height="2" fill="#000080" />
      <rect x="27" y="15"  width="2" height="2" fill="#000080" />
      <rect x="15" y="26.5" width="2" height="2" fill="#000080" />
      <rect x="3"  y="15"  width="2" height="2" fill="#000080" />*\
    </svg>
  );

  if (!showText) return icon;

  return (
    <div
      className={`flex items-center ${className}`}
      style={{ gap: `${gap}px`, display: "inline-flex", alignItems: "center" }}
    >
      {icon}
      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        <span style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize:   `${ts}px`,
          fontWeight: "bold",
          color:      "#0a0303",
          lineHeight: 1,
          letterSpacing: "0.12em",
          userSelect: "none",
        }}>
          AEGIS
        </span>
        <span style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize:   `${Math.round(ts * 0.58)}px`,
          fontWeight: "bold",
          color:      "#000080",
          lineHeight: 1,
          letterSpacing: "0.38em",
          userSelect: "none",
        }}>
          RADAR
        </span>
      </div>
    </div>
  );
}