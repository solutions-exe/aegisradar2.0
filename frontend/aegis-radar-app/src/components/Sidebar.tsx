"use client";

import { usePathname, useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NavItem =
  | "Live Monitor"
  | "Security Posture"
  | "Transaction History"
  | "Analytics"
  | "Settings"
  | "Team";

export interface SidebarStatusProps {
  /** Small lines rendered inside the inset terminal widget at the bottom */
  lines?: { label: string; value: string; color?: string }[];
}

interface SidebarProps {
  /** Which nav item is currently active (controlled externally or auto-detected from path) */
  activeItem?: NavItem;
  /** Override click handler — defaults to Next.js router push */
  onNavigate?: (item: NavItem) => void;
  /** Optional status widget content rendered at the bottom of the sidebar */
  status?: SidebarStatusProps;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  "Live Monitor",
  "Security Posture",
  "Transaction History",
  "Analytics",
  "Settings",
  "Team",
];

/** Unicode glyphs keep the retro look without any icon library */
const NAV_ICONS: Record<NavItem, string> = {
  "Live Monitor": "◉",
  "Security Posture": "🛡",
  "Transaction History": "≡",
  Analytics: "▤",
  Settings: "⚙",
  Team: "☻",
};

/** Map each nav label to a URL path so the sidebar works across pages */
const NAV_PATHS: Record<NavItem, string> = {
  "Live Monitor": "/dashboard",
  "Security Posture": "/dashboard/posture",
  "Transaction History": "/dashboard/history",
  Analytics: "/dashboard/analytics",
  Settings: "/dashboard/settings",
  Team: "/dashboard/team",
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Win95-style sidebar navigation.
 *
 * Drop this into any layout that needs left-hand navigation.
 * It auto-highlights the active item based on the current Next.js pathname,
 * or you can pass `activeItem` to control it manually.
 *
 * @example
 * // In a layout.tsx
 * <div className="flex flex-1 min-h-0">
 *   <Sidebar status={{ lines: [{ label: "ENV", value: "PROD", color: "#00ff00" }] }} />
 *   <main className="flex-1">{children}</main>
 * </div>
 */
export default function Sidebar({ activeItem, onNavigate, status }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  /** Resolve which item is active: explicit prop → path match → first item */
  const resolveActive = (item: NavItem): boolean => {
    if (activeItem) return item === activeItem;
    return pathname === NAV_PATHS[item];
  };

  const handleClick = (item: NavItem) => {
    if (onNavigate) {
      onNavigate(item);
    } else {
      router.push(NAV_PATHS[item]);
    }
  };

  return (
    <aside
      className="flex flex-col w-44 shrink-0"
      style={{
        background: "#c0c0c0",
        borderRight: "2px solid #808080",
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      {/* ── Section header ── */}
      <div
        className="text-xs font-bold font-mono px-2 py-1 text-white select-none"
        style={{ background: "#000080" }}
      >
        NAVIGATION
      </div>

      {/* ── Nav items ── */}
      <nav className="flex flex-col py-1" role="navigation" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = resolveActive(item);
          return (
            <button
              key={item}
              onClick={() => handleClick(item)}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-left w-full",
                "transition-none focus:outline-dotted focus:outline-1 focus:outline-black",
                isActive
                  ? "bg-[#000080] text-white"
                  : "text-black hover:bg-[#000080] hover:text-white",
              ].join(" ")}
            >
              <span className="text-base leading-none w-4 text-center" aria-hidden="true">
                {NAV_ICONS[item]}
              </span>
              <span className="truncate">{item}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Status widget (optional) ── */}
      {status && (
        <div className="mt-auto p-2">
          {/* Inset / sunken panel */}
          <div
            className="bg-black p-2"
            style={{
              borderStyle: "solid",
              borderWidth: "2px",
              borderColor: "#808080 white white #808080",
            }}
          >
            <div
              className="text-[10px] font-mono leading-relaxed"
              style={{ color: "#00ff00" }}
            >
              <div className="font-bold mb-1" style={{ color: "#ffff00" }}>
                STATUS
              </div>

              {status.lines?.map(({ label, value, color }) => (
                <div key={label} style={{ color: color ?? "#00ff00" }}>
                  {label}: {value}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}