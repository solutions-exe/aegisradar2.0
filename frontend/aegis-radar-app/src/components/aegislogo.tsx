/**
 * src/components/AegisLogo.tsx
 *
 * AEGIS RADAR — Reusable logo component.
 * Option A: Egyptian Eye of Horus inside a gold Greek-meander circular shield.
 *
 * Usage:
 *   <AegisLogo size={32} />                    — icon only (navbar, favicon)
 *   <AegisLogo size={32} showText />           — icon + "AEGIS RADAR" wordmark
 *   <AegisLogo size={64} showText textSize={18} /> — large variant
 *
 * SVG viewBox is 0 0 120 120 so `size` maps 1:1 to rendered px.
 * showText renders the wordmark inline-right of the icon (not inside the SVG)
 * so the circular icon is always perfectly round at every size.
 */

interface AegisLogoProps {
  /** Width & height of the circular icon in px. Default 32. */
  size?: number;
  /** Render "AEGIS / RADAR" wordmark to the right of the icon. */
  showText?: boolean;
  /** Font size for "AEGIS". Defaults to size * 0.44. */
  textSize?: number;
  /** Extra className on the wrapper div (only used when showText=true). */
  className?: string;
}

export default function AegisLogo({
  size = 32,
  showText = false,
  textSize,
  className = "",
}: AegisLogoProps) {
  const ts  = textSize ?? Math.round(size * 0.44);
  const gap = Math.round(size * 0.25);

  // 45 alternating tall/short meander teeth rotated around the ring
  const teeth = Array.from({ length: 45 }, (_, i) => ({
    angle: (i / 45) * 360,
    tall:  i % 2 === 0,
  }));

  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      {/* Dark background */}
      <circle cx="60" cy="60" r="59" fill="#080e1a" />

      {/* Outer gold rings */}
      <circle cx="60" cy="60" r="58" fill="none" stroke="#c9a84c" strokeWidth="1.2" />
      <circle cx="60" cy="60" r="53" fill="none" stroke="#c9a84c" strokeWidth="0.8" />

      {/* Meander teeth */}
      {teeth.map(({ angle, tall }) => (
        <g key={angle} transform={`rotate(${angle} 60 60)`}>
          <rect x="56.5" y="4" width="3.5" height={tall ? 7 : 4} fill="#c9a84c" />
        </g>
      ))}

      {/* Shield face */}
      <circle cx="60" cy="60" r="46" fill="#0a1628" />
      <circle cx="60" cy="60" r="46" fill="none" stroke="#c9a84c" strokeWidth="1" />

      {/* Eye almond */}
      <path
        d="M14,60 Q37,32 60,31 Q83,32 106,60 Q83,88 60,89 Q37,88 14,60 Z"
        fill="#08192a" stroke="#c9a84c" strokeWidth="1.2"
      />

      {/* Upper eyelid */}
      <path
        d="M14,60 Q37,33 60,32 Q83,33 106,60"
        fill="none" stroke="#00e5cc" strokeWidth="1.6" strokeLinecap="round"
      />

      {/* Lower eyelid */}
      <path
        d="M14,60 Q37,86 60,87 Q83,86 106,60"
        fill="none" stroke="#00e5cc" strokeWidth="1" strokeLinecap="round"
      />

      {/* Horus right teardrop */}
      <path d="M104,62 L114,74 L109,79 L100,70 Z" fill="#c9a84c" />
      <path
        d="M109,79 Q112,87 107,90 Q101,89 103,83 Q106,81 107,85"
        fill="none" stroke="#c9a84c" strokeWidth="1.1" strokeLinecap="round"
      />

      {/* Horus left teardrop */}
      <path d="M16,62 L6,74 L11,79 L20,70 Z" fill="#c9a84c" />
      <path
        d="M11,79 Q8,87 13,90 Q19,89 17,83 Q14,81 13,85"
        fill="none" stroke="#c9a84c" strokeWidth="1.1" strokeLinecap="round"
      />

      {/* Brow line */}
      <path
        d="M22,44 Q41,36 60,35 Q79,36 98,44"
        fill="none" stroke="#c9a84c" strokeWidth="0.9" strokeLinecap="round"
      />
      {/* Brow ticks */}
      {[
        { x: 40, y: 38 },
        { x: 50, y: 35.5 },
        { x: 60, y: 34 },
        { x: 70, y: 35.5 },
        { x: 80, y: 38 },
      ].map(({ x, y }) => (
        <line key={x} x1={x} y1={y} x2={x} y2={y - 4}
          stroke="#c9a84c" strokeWidth="0.8" />
      ))}

      {/* Iris */}
      <circle cx="60" cy="60" r="18" fill="#003d50" />
      <circle cx="60" cy="60" r="18" fill="none" stroke="#00e5cc" strokeWidth="1.2" />
      <circle cx="60" cy="60" r="14" fill="none" stroke="#006678"
        strokeWidth="0.7" strokeDasharray="2 2" />

      {/* Pupil */}
      <circle cx="60" cy="60" r="10" fill="#001820" />
      <circle cx="60" cy="60" r="10" fill="none" stroke="#00f0d8" strokeWidth="1" />

      {/* Pupil glow core */}
      <circle cx="60" cy="60" r="6" fill="#00c8b4" />
      <circle cx="60" cy="60" r="3" fill="#00ffee" />

      {/* Specular highlights */}
      <circle cx="64" cy="57" r="2.5" fill="#ffffff" opacity="0.65" />
      <circle cx="57" cy="64" r="1.4" fill="#ffffff" opacity="0.25" />

      {/* Cardinal gold diamonds */}
      <polygon points="60,8  63,13 60,16 57,13"   fill="#c9a84c" />
      <polygon points="112,60 107,63 104,60 107,57" fill="#c9a84c" />
      <polygon points="60,112 57,107 60,104 63,107" fill="#c9a84c" />
      <polygon points="8,60  13,57  16,60  13,63"   fill="#c9a84c" />
    </svg>
  );

  if (!showText) return icon;

  return (
    <div className={`flex items-center ${className}`} style={{ gap: `${gap}px` }}>
      {icon}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: `${ts}px`,
          fontWeight: "bold",
          color: "#c9a84c",
          lineHeight: 1,
          letterSpacing: "0.12em",
        }}>
          AEGIS
        </span>
        <span style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: `${Math.round(ts * 0.6)}px`,
          fontWeight: "400",
          color: "#7ecfc0",
          lineHeight: 1,
          letterSpacing: "0.35em",
        }}>
          RADAR
        </span>
      </div>
    </div>
  );
}