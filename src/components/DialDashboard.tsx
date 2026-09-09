import React, { useEffect, useState, useRef } from "react";
import {
  Moon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Play,
  Pause,
  Clock,
  Eye,
  EyeOff,
  Compass,
  Globe2,
  CalendarDays,
  Trophy,
  Megaphone,
} from "lucide-react";
import { getLunarStatus, SYNODIC_MONTH, getLunarAge } from "../lib/lunar";
import { AstroEvent, Challenge } from "../types";

interface DialDashboardProps {
  locationText: string;
  birthDate: string;
  nickname: string;
}

const PANEL = "rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md";

const FEATURED_ADS = [
  {
    title: "Celestial Grind Coffee",
    brand: "AstroVibe Espresso",
    tagline: "Micro-roasted beans brewed for long observation nights.",
  },
  {
    title: "Quantum Nebula Telescope",
    brand: "Stellar Optics Ltd",
    tagline: "Deep-sky clarity with solar-wind shielded optics.",
  },
  {
    title: "Dome-Grown Matcha",
    brand: "Orion Matcha Tea",
    tagline: "Clean caffeine, zero jitters, grown under glass.",
  },
];

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function fromDateInputValue(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function formatHourMinute(hours: number): string {
  const h = Math.floor(hours) % 24;
  const m = Math.floor((hours - Math.floor(hours)) * 60);
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

function format24h(hours: number): string {
  const h = Math.floor(hours) % 24;
  const m = Math.floor((hours - Math.floor(hours)) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Lit-limb path of the moon sphere: the outer limb plus an elliptical
 * terminator, calculating the 3D illuminated lunar phase shape.
 */
function getLitLimbPath(age: number, cx: number, cy: number, r: number): string {
  if (age < 0.35 || age > SYNODIC_MONTH - 0.35) return ""; // fully dark near New Moon
  const phi = (age / SYNODIC_MONTH) * 2 * Math.PI;
  const illum = (1 - Math.cos(phi)) / 2; // 0 -> 1
  const isWaxing = age < SYNODIC_MONTH / 2;

  let termRx = r * Math.abs(1 - 2 * illum);
  if (termRx < 2) termRx = 2;

  const outerSweep = isWaxing ? 1 : 0;
  const termSweep = isWaxing ? (illum > 0.5 ? 1 : 0) : (illum > 0.5 ? 0 : 1);

  return `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${outerSweep} ${cx} ${cy + r} A ${termRx} ${r} 0 0 ${termSweep} ${cx} ${cy - r} Z`;
}

export default function DialDashboard({ locationText, birthDate, nickname }: DialDashboardProps) {
  // Active date & diurnal time (hours 0.00 to 23.99)
  const [activeDateStr, setActiveDateStr] = useState(() => toDateInputValue(new Date()));
  const [timeOfDay, setTimeOfDay] = useState(() => {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const lastAnimTimeRef = useRef<number | null>(null);

  // Flanking panel data
  const [events, setEvents] = useState<AstroEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setEvents(Array.isArray(data) ? data.slice(0, 4) : []);
      })
      .catch((err) => console.error("Moondial events fetch failed:", err))
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });

    fetch("/api/challenges")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setChallenges(Array.isArray(data) ? data.slice(0, 4) : []);
      })
      .catch((err) => console.error("Moondial challenges fetch failed:", err))
      .finally(() => {
        if (!cancelled) setChallengesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Animation loop when playing diurnal rotation
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastAnimTimeRef.current = null;
      return;
    }

    const speedHoursPerSec = 2.5; // 2.5 hours per second of real time

    const animate = (timestamp: number) => {
      if (lastAnimTimeRef.current != null) {
        const deltaSec = (timestamp - lastAnimTimeRef.current) / 1000;
        setTimeOfDay((prev) => (prev + deltaSec * speedHoursPerSec) % 24);
      }
      lastAnimTimeRef.current = timestamp;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Derived lunar status for the selected date
  const activeDate = fromDateInputValue(activeDateStr);
  const lunarStatus = getLunarStatus(activeDate);
  const illuminationPct = Math.round(lunarStatus.illumination);
  const isToday = activeDateStr === toDateInputValue(new Date());

  const shiftDays = (delta: number) => {
    const next = fromDateInputValue(activeDateStr);
    next.setDate(next.getDate() + delta);
    setActiveDateStr(toDateInputValue(next));
  };

  const handleResetToNow = () => {
    setActiveDateStr(toDateInputValue(new Date()));
    const now = new Date();
    setTimeOfDay(now.getHours() + now.getMinutes() / 60);
    setIsPlaying(false);
  };

  // --- Astronomical Orbit & Horizon Calculations ---
  // Moon culmination hour: when the Moon crosses the observer's meridian
  const culminationHour = ((lunarStatus.age / SYNODIC_MONTH) * 24 + 12) % 24;
  const estimatedMoonriseHour = (culminationHour - 6 + 24) % 24;
  const estimatedMoonsetHour = (culminationHour + 6) % 24;

  // Hour difference between active time and culmination (-12 to +12)
  let deltaHours = timeOfDay - culminationHour;
  while (deltaHours > 12) deltaHours -= 24;
  while (deltaHours < -12) deltaHours += 24;

  // Apparent altitude above/below the observer's horizon (-90° to +90°)
  const altitudeDeg = Math.round(90 * Math.cos((deltaHours / 12) * Math.PI));

  // The Moon is strictly visible in the sky when altitude >= 0°
  const isVisibleInSky = altitudeDeg >= 0;

  // Orbit Geometry in SVG coordinates
  const CX = 270;
  const CY = 195;
  const EARTH_R = 52;
  const ORBIT_RX = 195;
  const ORBIT_RY = 115;
  const ORBIT_TILT_DEG = -12;
  const ORBIT_TILT_RAD = (ORBIT_TILT_DEG * Math.PI) / 180;

  // Position on tilted orbital ellipse
  const orbitAngle = (deltaHours / 12) * Math.PI - Math.PI / 2;
  const rawX = ORBIT_RX * Math.cos(orbitAngle);
  const rawY = ORBIT_RY * Math.sin(orbitAngle);

  const moonX = CX + rawX * Math.cos(ORBIT_TILT_RAD) - rawY * Math.sin(ORBIT_TILT_RAD);
  const moonY = CY + rawX * Math.sin(ORBIT_TILT_RAD) + rawY * Math.cos(ORBIT_TILT_RAD);

  const MOON_R = 24;
  const litPath = getLitLimbPath(lunarStatus.age, moonX, moonY, MOON_R);

  // Horizon Plane Y coordinate across the central scene
  const HORIZON_Y = CY - 4;

  return (
    <div
      className="relative min-h-screen"
      style={{ background: "linear-gradient(160deg, #101226, #07080f 60%, #05060b)" }}
    >
      {/* Background ambient starlight glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-28 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(79,209,197,0.12), rgba(56,189,248,0.05) 55%, transparent 75%)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(63,187,187,0.06), transparent 70%)" }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-6 space-y-6 text-slate-200">
        {/* HEADER SECTION */}
        <section className={`${PANEL} p-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em] block">
                Astronomical Timetable &amp; 3D Diurnal Orbit
              </span>
              <h2 className="text-xl font-bold font-mono text-turquoise flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-turquoise" />
                <span>3D Earth &amp; Moon Orbit Clock</span>
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Simulating lunar orbital path relative to Earth&apos;s horizon for{" "}
                <span className="text-slate-200 font-semibold">{nickname}</span> · {locationText}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${
                  isVisibleInSky
                    ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                    : "border-slate-800 bg-slate-950/60 text-slate-400"
                }`}
              >
                {isVisibleInSky ? (
                  <Eye className="w-4 h-4 text-emerald-400 animate-pulse" />
                ) : (
                  <EyeOff className="w-4 h-4 text-slate-500" />
                )}
                <div className="leading-tight">
                  <span className="text-[8.5px] font-mono uppercase tracking-wider block opacity-75">
                    Horizon Status
                  </span>
                  <span className="text-xs font-bold font-mono">
                    {isVisibleInSky
                      ? `Visible in Sky (+${altitudeDeg}°)`
                      : `Below Horizon (${altitudeDeg}°)`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-slate-950/50">
                <span className="text-2xl leading-none">{lunarStatus.phase.emoji}</span>
                <div className="leading-tight">
                  <span className="text-[8.5px] font-mono text-slate-500 uppercase block">
                    Phase
                  </span>
                  <span className="text-xs font-bold font-mono text-slate-200">
                    {lunarStatus.phase.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CENTREPIECE: 3D EARTH WITH MOON ORBIT AND HORIZON CLOCK */}
        <section className={`${PANEL} p-5 space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-xs font-bold font-mono text-turquoise uppercase tracking-wider flex items-center gap-2">
                <span>Celestial 3D Orbit: Earth, Moon &amp; Local Horizon</span>
              </h3>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                Moon appears crisp in true phase shape when above the horizon; blurred and occluded
                when below.
              </p>
            </div>

            {/* Date and simulation controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => shiftDays(-1)}
                title="Previous Day"
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-turquoise hover:border-turquoise-500/40 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950/60">
                <CalendarDays className="w-3.5 h-3.5 text-turquoise" />
                <input
                  type="date"
                  value={activeDateStr}
                  onChange={(e) => setActiveDateStr(e.target.value || toDateInputValue(new Date()))}
                  className="bg-transparent text-xs font-mono text-turquoise focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={() => shiftDays(1)}
                title="Next Day"
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-turquoise hover:border-turquoise-500/40 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleResetToNow}
                title="Reset to Real-Time"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-colors ${
                  isToday
                    ? "border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200"
                    : "bg-turquoise-500 text-slate-950 hover:bg-turquoise-400"
                }`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Live Now</span>
              </button>
            </div>
          </div>

          {/* 3D INTERACTIVE SVG CANVAS */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[440px] flex items-center justify-center select-none overflow-hidden rounded-xl border border-slate-800/80 bg-[#060810]">
            <svg
              viewBox="0 0 540 390"
              className="w-full h-full"
              role="img"
              aria-label="3D Earth with Moon Orbit and Local Horizon"
            >
              <defs>
                {/* Space & Earth gradients */}
                <radialGradient id="space-vignette" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#0d1124" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#070913" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#030408" stopOpacity="1" />
                </radialGradient>

                <radialGradient id="sky-dome-glow" cx="50%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#1e294b" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#0e1424" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#07080f" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="subhorizon-depth" cx="50%" cy="75%" r="65%">
                  <stop offset="0%" stopColor="#020305" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#07080f" stopOpacity="0.2" />
                </radialGradient>

                {/* Earth 3D Shading */}
                <radialGradient id="earth-ocean-grad" cx="38%" cy="32%" r="68%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="35%" stopColor="#1d4ed8" />
                  <stop offset="70%" stopColor="#0f2663" />
                  <stop offset="100%" stopColor="#071233" />
                </radialGradient>

                <radialGradient id="earth-atmo-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="85%" stopColor="#60a5fa" stopOpacity="0" />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.8" />
                </radialGradient>

                <linearGradient id="earth-night-terminator" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="35%" stopColor="#000000" stopOpacity="0" />
                  <stop offset="75%" stopColor="#000000" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.92" />
                </linearGradient>

                {/* Moon Shading & Glow */}
                <radialGradient id="moon-lit-grad" cx="36%" cy="30%" r="76%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
                  <stop offset="60%" stopColor="#f1f5f9" stopOpacity="0.92" />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.88" />
                </radialGradient>

                <radialGradient id="moon-visible-corona" cx="50%" cy="50%" r="50%">
                  <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </radialGradient>

                {/* SVG BLUR FILTER for the Moon when below the horizon */}
                <filter id="moon-subhorizon-blur" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4.5" result="blur" />
                  <feColorMatrix
                    type="matrix"
                    values="1 0 0 0 0
                            0 1 0 0 0
                            0 0 1 0 0
                            0 0 0 0.55 0"
                  />
                </filter>

                {/* Clip paths */}
                <clipPath id="earth-clip">
                  <circle cx={CX} cy={CY} r={EARTH_R} />
                </clipPath>
              </defs>

              {/* Background space canvas */}
              <rect width="540" height="390" fill="url(#space-vignette)" />

              {/* Sky hemisphere (Above Horizon) background tint */}
              <rect x="0" y="0" width="540" height={HORIZON_Y} fill="url(#sky-dome-glow)" />

              {/* Sub-horizon hemisphere (Below Horizon / Occluded) shading */}
              <rect
                x="0"
                y={HORIZON_Y}
                width="540"
                height={390 - HORIZON_Y}
                fill="url(#subhorizon-depth)"
              />

              {/* Stars in upper visible sky */}
              <g opacity="0.6">
                <circle cx="60" cy="50" r="1" fill="#fff" />
                <circle cx="120" cy="30" r="1.2" fill="#bae6fd" />
                <circle cx="180" cy="70" r="0.8" fill="#fff" />
                <circle cx="240" cy="40" r="1.4" fill="#f8fafc" />
                <circle cx="340" cy="35" r="1" fill="#38bdf8" />
                <circle cx="410" cy="65" r="1.3" fill="#fff" />
                <circle cx="480" cy="45" r="0.9" fill="#bae6fd" />
                <circle cx="90" cy="110" r="0.7" fill="#fff" />
                <circle cx="450" cy="115" r="1.1" fill="#fff" />
              </g>

              {/* LOCAL HORIZON LINE ACROSS THE CANOPY */}
              <line
                x1="20"
                y1={HORIZON_Y}
                x2="520"
                y2={HORIZON_Y}
                stroke="#334155"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <rect
                x="22"
                y={HORIZON_Y - 14}
                width="125"
                height="13"
                rx="3"
                fill="#090d1a"
                opacity="0.85"
              />
              <text
                x="26"
                y={HORIZON_Y - 4}
                fill="#64748b"
                fontSize="8"
                fontFamily="monospace"
                letterSpacing="0.08em"
              >
                EASTERN HORIZON · RISE
              </text>

              <rect
                x="392"
                y={HORIZON_Y - 14}
                width="125"
                height="13"
                rx="3"
                fill="#090d1a"
                opacity="0.85"
              />
              <text
                x="396"
                y={HORIZON_Y - 4}
                fill="#64748b"
                fontSize="8"
                fontFamily="monospace"
                letterSpacing="0.08em"
              >
                WESTERN HORIZON · SET
              </text>

              {/* 3D MOON ORBIT PATH */}
              {/* Lower sector (Sub-horizon track - dashed and muted) */}
              <g transform={`rotate(${ORBIT_TILT_DEG} ${CX} ${CY})`}>
                <ellipse
                  cx={CX}
                  cy={CY}
                  rx={ORBIT_RX}
                  ry={ORBIT_RY}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                  opacity="0.5"
                />
              </g>

              {/* Upper sector (Visible sky track - glowing solid turquoise) */}
              <g transform={`rotate(${ORBIT_TILT_DEG} ${CX} ${CY})`}>
                <path
                  d={`M ${CX - ORBIT_RX} ${CY} A ${ORBIT_RX} ${ORBIT_RY} 0 0 1 ${CX + ORBIT_RX} ${CY}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  opacity="0.75"
                  style={{ filter: "drop-shadow(0 0 5px rgba(56, 189, 248, 0.45))" }}
                />
              </g>

              {/* CENTRAL 3D EARTH GLOBE */}
              <g>
                {/* Atmosphere outer halo */}
                <circle cx={CX} cy={CY} r={EARTH_R + 8} fill="url(#earth-atmo-glow)" />

                {/* Ocean sphere */}
                <circle cx={CX} cy={CY} r={EARTH_R} fill="url(#earth-ocean-grad)" />

                {/* Continents & Land masses (clipped to Earth) */}
                <g clipPath="url(#earth-clip)" opacity="0.88">
                  {/* North & Central America */}
                  <path
                    d="M 235 165 Q 242 160 250 166 Q 255 178 248 185 Q 242 195 246 205 Q 238 200 234 190 Q 230 180 235 165 Z"
                    fill="#15803d"
                  />
                  {/* South America */}
                  <path
                    d="M 248 205 Q 256 210 254 225 Q 250 240 242 245 Q 240 235 244 220 Z"
                    fill="#166534"
                  />
                  {/* Eurasia & Europe */}
                  <path
                    d="M 265 158 Q 280 152 295 160 Q 305 170 300 185 Q 285 190 275 180 Q 268 170 265 158 Z"
                    fill="#15803d"
                  />
                  {/* Africa */}
                  <path
                    d="M 270 182 Q 286 185 288 205 Q 284 225 275 232 Q 268 220 268 200 Z"
                    fill="#ca8a04"
                    opacity="0.8"
                  />
                  {/* Australia */}
                  <path
                    d="M 302 215 Q 312 212 316 220 Q 314 228 305 226 Z"
                    fill="#15803d"
                  />
                  {/* Polar Ice Caps */}
                  <ellipse cx={CX} cy={CY - EARTH_R + 6} rx="26" ry="7" fill="#e0f2fe" opacity="0.9" />
                  <ellipse cx={CX} cy={CY + EARTH_R - 5} rx="28" ry="8" fill="#e0f2fe" opacity="0.85" />

                  {/* Grid Lines (Latitude / Longitude) */}
                  <ellipse cx={CX} cy={CY} rx={EARTH_R} ry="14" fill="none" stroke="#bae6fd" strokeWidth="0.5" opacity="0.3" />
                  <ellipse cx={CX} cy={CY} rx={EARTH_R} ry="32" fill="none" stroke="#bae6fd" strokeWidth="0.5" opacity="0.3" />
                  <line x1={CX} y1={CY - EARTH_R} x2={CX} y2={CY + EARTH_R} stroke="#bae6fd" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.4" />
                </g>

                {/* Day / Night Terminator Shading across Earth */}
                <circle cx={CX} cy={CY} r={EARTH_R} fill="url(#earth-night-terminator)" pointerEvents="none" />

                {/* Local Observer Beacon on Earth (top towards Zenith) */}
                <g>
                  {/* Observer Pin */}
                  <circle cx={CX} cy={CY - EARTH_R + 2} r="4.5" fill="#38bdf8" />
                  <circle cx={CX} cy={CY - EARTH_R + 2} r="8" fill="#38bdf8" opacity="0.25" />
                  <line
                    x1={CX}
                    y1={CY - EARTH_R}
                    x2={CX}
                    y2={CY - EARTH_R - 22}
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />
                  {/* Zenith tag */}
                  <rect
                    x={CX - 38}
                    y={CY - EARTH_R - 36}
                    width="76"
                    height="14"
                    rx="3"
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth="0.8"
                  />
                  <text
                    x={CX}
                    y={CY - EARTH_R - 26}
                    textAnchor="middle"
                    fill="#38bdf8"
                    fontSize="7.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    OBSERVER ZENITH ↑
                  </text>
                </g>
              </g>

              {/* RENDER THE MOON ALONG ITS 3D ORBIT */}
              {/* Link line connecting Earth to Moon */}
              <line
                x1={CX}
                y1={CY}
                x2={moonX}
                y2={moonY}
                stroke={isVisibleInSky ? "#38bdf8" : "#475569"}
                strokeWidth={isVisibleInSky ? "1.2" : "0.8"}
                strokeDasharray={isVisibleInSky ? "3 3" : "2 2"}
                opacity={isVisibleInSky ? 0.6 : 0.3}
              />

              {/* THE MOON SPHERE */}
              {isVisibleInSky ? (
                /* === VISIBLE IN SKY (ABOVE HORIZON): CRISP TRUE PHASE SHAPE & AURA === */
                <g className="cursor-pointer transition-all duration-300">
                  {/* Corona glow */}
                  <circle
                    cx={moonX}
                    cy={moonY}
                    r={MOON_R + 10}
                    fill="url(#moon-visible-corona)"
                  />

                  {/* Dark side base disc */}
                  <circle
                    cx={moonX}
                    cy={moonY}
                    r={MOON_R}
                    fill="#111526"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                  />

                  {/* Lit limb rendering exact calculated lunar phase shape */}
                  {litPath && (
                    <path
                      d={litPath}
                      fill="url(#moon-lit-grad)"
                      style={{
                        filter: "drop-shadow(0px 0px 6px rgba(255,255,255,0.75))",
                      }}
                    />
                  )}

                  {/* Surface craters (crisp relief) */}
                  <g opacity="0.3" pointerEvents="none">
                    <circle cx={moonX - 7} cy={moonY - 6} r="4" fill="#0f172a" />
                    <circle cx={moonX + 6} cy={moonY - 5} r="3.5" fill="#0f172a" />
                    <circle cx={moonX - 2} cy={moonY + 8} r="5" fill="#0f172a" />
                    <circle cx={moonX + 9} cy={moonY + 7} r="3" fill="#0f172a" />
                  </g>

                  {/* Visible Sky Telemetry Badge */}
                  <g>
                    <rect
                      x={moonX - 64}
                      y={moonY - MOON_R - 26}
                      width="128"
                      height="20"
                      rx="5"
                      fill="#091124"
                      stroke="#38bdf8"
                      strokeWidth="1"
                    />
                    <text
                      x={moonX}
                      y={moonY - MOON_R - 12}
                      textAnchor="middle"
                      fill="#38bdf8"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      VISIBLE IN SKY (+{altitudeDeg}°)
                    </text>
                  </g>
                </g>
              ) : (
                /* === INVISIBLE / BELOW THE HORIZON: BLURRED MOON OCCLUDED BY EARTH === */
                <g
                  filter="url(#moon-subhorizon-blur)"
                  className="transition-all duration-300"
                  style={{ filter: "blur(3.5px)" }}
                >
                  {/* Blurred ghost halo */}
                  <circle cx={moonX} cy={moonY} r={MOON_R + 6} fill="#1e293b" opacity="0.6" />

                  {/* Blurred dark disc */}
                  <circle
                    cx={moonX}
                    cy={moonY}
                    r={MOON_R}
                    fill="#0a0e1c"
                    stroke="#475569"
                    strokeWidth="1.2"
                  />

                  {/* Blurred phase terminator */}
                  {litPath && (
                    <path
                      d={litPath}
                      fill="#94a3b8"
                      opacity="0.6"
                    />
                  )}

                  {/* Below Horizon Indicator Label (blurred ghost reflection) */}
                  <g opacity="0.8">
                    <rect
                      x={moonX - 74}
                      y={moonY + MOON_R + 8}
                      width="148"
                      height="20"
                      rx="5"
                      fill="#030712"
                      stroke="#475569"
                      strokeWidth="0.8"
                    />
                    <text
                      x={moonX}
                      y={moonY + MOON_R + 22}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="8.5"
                      fontFamily="monospace"
                      fontStyle="italic"
                    >
                      BELOW HORIZON · OCCLUDED ({altitudeDeg}°)
                    </text>
                  </g>
                </g>
              )}
            </svg>
          </div>

          {/* INTERACTIVE 24-HOUR DIURNAL TIME SCRUBBER */}
          <div className="space-y-2 p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-turquoise" />
                <span className="text-slate-300 font-bold">Observer Time:</span>
                <span className="text-turquoise font-extrabold text-sm px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {formatHourMinute(timeOfDay)}
                </span>
                <span className="text-[10px] text-slate-500">({format24h(timeOfDay)} UTC/Local)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying((p) => !p)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                    isPlaying
                      ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                      : "bg-turquoise-500 hover:bg-turquoise-400 text-slate-950"
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Play 24h Cycle</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Range Slider */}
            <input
              type="range"
              min="0"
              max="24"
              step="0.05"
              value={timeOfDay}
              onChange={(e) => {
                setIsPlaying(false);
                setTimeOfDay(parseFloat(e.target.value));
              }}
              className="w-full accent-teal-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-0.5">
              <span>00:00 (Midnight)</span>
              <span>06:00 (Dawn)</span>
              <span>12:00 (Noon)</span>
              <span>18:00 (Dusk)</span>
              <span>24:00 (Midnight)</span>
            </div>
          </div>

          {/* TELEMETRY READOUT CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-center">
              <span className="text-[8.5px] font-mono text-slate-500 uppercase block">
                Visibility
              </span>
              <span
                className={`text-xs font-bold font-mono block mt-0.5 ${
                  isVisibleInSky ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                {isVisibleInSky ? "Visible in Sky" : "Below Horizon"}
              </span>
              <span className="text-[9.5px] font-mono text-slate-500 block mt-0.5">
                Alt: {altitudeDeg}°
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-center">
              <span className="text-[8.5px] font-mono text-slate-500 uppercase block">
                Est. Moonrise
              </span>
              <span className="text-xs font-bold font-mono text-turquoise block mt-0.5">
                {formatHourMinute(estimatedMoonriseHour)}
              </span>
              <span className="text-[9.5px] font-mono text-slate-500 block mt-0.5">
                Crosses East Horizon
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-center">
              <span className="text-[8.5px] font-mono text-slate-500 uppercase block">
                Est. Moonset
              </span>
              <span className="text-xs font-bold font-mono text-turquoise block mt-0.5">
                {formatHourMinute(estimatedMoonsetHour)}
              </span>
              <span className="text-[9.5px] font-mono text-slate-500 block mt-0.5">
                Crosses West Horizon
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-center">
              <span className="text-[8.5px] font-mono text-slate-500 uppercase block">
                Illumination
              </span>
              <span className="text-xs font-bold font-mono text-slate-200 block mt-0.5">
                {illuminationPct}% Lit
              </span>
              <span className="text-[9.5px] font-mono text-slate-500 block mt-0.5">
                Age {lunarStatus.age.toFixed(1)}d
              </span>
            </div>
          </div>
        </section>

        {/* FLANKING PANELS: UPCOMING EVENTS + COMMUNITY CHALLENGES + ADS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* UPCOMING EVENTS */}
          <section className={`${PANEL} p-5 space-y-3`}>
            <h3 className="text-[11px] font-bold font-mono text-turquoise uppercase tracking-widest border-b border-slate-800/80 pb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-turquoise" />
              Upcoming Sky Events
            </h3>

            {eventsLoading ? (
              <span className="text-[10px] font-mono text-slate-500 block">Syncing sky calendar…</span>
            ) : events.length === 0 ? (
              <span className="text-[10px] font-mono text-slate-500 block">No upcoming events listed.</span>
            ) : (
              <div className="space-y-2">
                {events.map((ev) => (
                  <div key={ev.id} className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[9px] font-mono text-turquoise">{ev.date}</span>
                      <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900 text-slate-400 uppercase shrink-0">
                        {ev.rarity}
                      </span>
                    </div>
                    <h4 className="text-[11px] font-bold text-slate-200 leading-snug">{ev.title}</h4>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* COMMUNITY CHALLENGES */}
          <section className={`${PANEL} p-5 space-y-3`}>
            <h3 className="text-[11px] font-bold font-mono text-turquoise uppercase tracking-widest border-b border-slate-800/80 pb-2 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-turquoise" />
              Circadian Quests
            </h3>

            {challengesLoading ? (
              <span className="text-[10px] font-mono text-slate-500 block">Loading challenge board…</span>
            ) : challenges.length === 0 ? (
              <span className="text-[10px] font-mono text-slate-500 block">No active quests yet.</span>
            ) : (
              <div className="space-y-2">
                {challenges.map((ch) => (
                  <div
                    key={ch.id}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-between gap-3"
                  >
                    <h4 className="text-[11px] font-bold text-slate-200 leading-snug">{ch.title}</h4>
                    <span className="text-[8.5px] font-mono text-slate-400 border border-slate-800 px-2 py-0.5 rounded shrink-0">
                      {ch.scope}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ETHICAL COMMUNITY AD SHOWCASE */}
          <section className={`${PANEL} p-5 space-y-3`}>
            <h3 className="text-[11px] font-bold font-mono text-turquoise uppercase tracking-widest border-b border-slate-800/80 pb-2 flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-turquoise" />
              Ethical Awareness
            </h3>

            <div className="space-y-2">
              {FEATURED_ADS.map((ad) => (
                <div key={ad.title} className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1">
                  <span className="text-[8.5px] font-mono text-turquoise uppercase block">{ad.brand}</span>
                  <h4 className="text-[11px] font-bold text-slate-200 leading-snug">{ad.title}</h4>
                  <p className="text-[9.5px] font-sans text-slate-400 leading-relaxed">{ad.tagline}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
