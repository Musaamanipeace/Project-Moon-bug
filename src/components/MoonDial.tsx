import { useMemo } from "react";

interface MoonDialProps {
  fraction: number; // 0..1 through the synodic month
  size?: number;
  glow?: boolean;
}

// Builds an SVG path for the lit portion of the moon for a given phase
// fraction (0 = new, 0.5 = full, 1 = new). Mirrors astronomical illumination.
function litPath(cx: number, cy: number, r: number, fraction: number): string {
  const phase = ((fraction % 1) + 1) % 1;
  const a = phase * 2 * Math.PI;
  const x = Math.cos(a) * r;
  const top = `${cx} ${cy - r}`;
  const bottom = `${cx} ${cy + r}`;

  const outer =
    phase < 0.5
      ? `A ${r} ${r} 0 0 1 ${bottom}` // right limb lit (waxing)
      : `A ${r} ${r} 0 0 0 ${bottom}`; // left limb lit (waning)

  const sweep = phase >= 0.25 && phase < 0.75 ? 0 : 1;
  const term = `A ${Math.abs(x).toFixed(2)} ${r} 0 0 ${sweep} ${top}`;

  return `M ${top} ${outer} ${term} Z`;
}

export default function MoonDial({ fraction, size = 220, glow = true }: MoonDialProps) {
  const id = useMemo(() => `moon-${Math.random().toString(36).slice(2)}`, []);
  const cx = 100;
  const cy = 100;
  const r = 92;
  const path = litPath(cx, cy, r, fraction);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className="select-none"
      role="img"
      aria-label="Moon phase"
    >
      <defs>
        <radialGradient id={`${id}-lit`} cx="38%" cy="34%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#dfe3ff" />
          <stop offset="100%" stopColor="#aab2e6" />
        </radialGradient>
        <radialGradient id={`${id}-dark`} cx="38%" cy="34%" r="80%">
          <stop offset="0%" stopColor="#1b1f3d" />
          <stop offset="100%" stopColor="#0a0c1c" />
        </radialGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="rgba(139,123,255,0.0)" />
          <stop offset="100%" stopColor="rgba(139,123,255,0.35)" />
        </radialGradient>
        <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>

      {glow && <circle cx={cx} cy={cy} r={r + 14} fill={`url(#${id}-glow)`} />}

      {/* Unlit base disc */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-dark)`} stroke="rgba(139,123,255,0.35)" strokeWidth={1} />

      {/* Lit portion */}
      <path d={path} fill={`url(#${id}-lit)`} filter={`url(#${id}-soft)`} />

      {/* Faint craters for texture (clipped to lit area visually via low opacity) */}
      <g opacity={0.12} fill="#5b60a0">
        <circle cx={cx - 26} cy={cy - 22} r={9} />
        <circle cx={cx + 18} cy={cy + 14} r={13} />
        <circle cx={cx + 30} cy={cy - 30} r={6} />
        <circle cx={cx - 12} cy={cy + 30} r={7} />
      </g>

      {/* Rim highlight */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
    </svg>
  );
}
