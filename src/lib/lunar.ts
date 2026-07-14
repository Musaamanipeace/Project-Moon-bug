// Moonbug lunar calculations (UTC-based), kept in sync with the Go backend.
export const SYNODIC_MONTH = 29.530588853;
const REF_NEW_MOON = 947166000; // Date.UTC(2000, 0, 6, 18, 14, 0) in seconds

export interface MoonStatus {
  age: number;
  illumination: number;
  phase: string;
  phaseCode: string;
  phaseEmoji: string;
  daysUntilFull: number;
  daysUntilNew: number;
}

const PHASES = [
  { name: "New Moon", emoji: "🌑", code: "new-moon" },
  { name: "Waxing Crescent", emoji: "🌒", code: "waxing-crescent" },
  { name: "First Quarter", emoji: "🌓", code: "first-quarter" },
  { name: "Waxing Gibbous", emoji: "🌔", code: "waxing-gibbous" },
  { name: "Full Moon", emoji: "🌕", code: "full-moon" },
  { name: "Waning Gibbous", emoji: "🌖", code: "waning-gibbous" },
  { name: "Last Quarter", emoji: "🌗", code: "last-quarter" },
  { name: "Waning Crescent", emoji: "🌘", code: "waning-crescent" },
];

function ageFor(date: Date): number {
  const days = (date.getTime() / 1000 - REF_NEW_MOON) / 86400;
  let age = days % SYNODIC_MONTH;
  if (age < 0) age += SYNODIC_MONTH;
  return age;
}

export function getMoonStatus(date: Date = new Date()): MoonStatus {
  const age = ageFor(date);
  const pct = age / SYNODIC_MONTH;
  const angle = pct * 2 * Math.PI;
  const illumination = ((1 - Math.cos(angle)) / 2) * 100;

  let idx = 0;
  if (pct < 0.03 || pct >= 0.97) idx = 0;
  else if (pct < 0.22) idx = 1;
  else if (pct < 0.28) idx = 2;
  else if (pct < 0.47) idx = 3;
  else if (pct < 0.53) idx = 4;
  else if (pct < 0.72) idx = 5;
  else if (pct < 0.78) idx = 6;
  else idx = 7;

  const phaseForDate = (d: Date) => {
    const a = ageFor(d);
    const p = a / SYNODIC_MONTH;
    let i = 0;
    if (p < 0.03 || p >= 0.97) i = 0;
    else if (p < 0.22) i = 1;
    else if (p < 0.28) i = 2;
    else if (p < 0.47) i = 3;
    else if (p < 0.53) i = 4;
    else if (p < 0.72) i = 5;
    else if (p < 0.78) i = 6;
    else i = 7;
    return i;
  };

  const daysUntilNext = (target: number) => {
    let delta = target - pct;
    if (delta < 0) delta += 1;
    return delta * SYNODIC_MONTH;
  };

  return {
    age,
    illumination,
    phase: PHASES[idx].name,
    phaseCode: PHASES[idx].code,
    phaseEmoji: PHASES[idx].emoji,
    daysUntilFull: daysUntilNext(0.5),
    daysUntilNew: daysUntilNext(0),
  };
}

export function phaseInfoForDate(date: Date) {
  const a = ageFor(date);
  const p = a / SYNODIC_MONTH;
  const angle = (p) * 2 * Math.PI;
  const illumination = ((1 - Math.cos(angle)) / 2) * 100;
  let idx = 0;
  if (p < 0.03 || p >= 0.97) idx = 0;
  else if (p < 0.22) idx = 1;
  else if (p < 0.28) idx = 2;
  else if (p < 0.47) idx = 3;
  else if (p < 0.53) idx = 4;
  else if (p < 0.72) idx = 5;
  else if (p < 0.78) idx = 6;
  else idx = 7;
  return { ...PHASES[idx], illumination: Math.round(illumination) };
}

export { PHASES };

// Phase fraction 0..1 used to render the lit portion of the moon SVG.
export function phaseFraction(age: number): number {
  return (age % SYNODIC_MONTH) / SYNODIC_MONTH;
}
