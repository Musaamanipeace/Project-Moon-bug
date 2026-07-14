import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Flame, Check } from "lucide-react";
import { api } from "@/lib/api";
import { phaseInfoForDate } from "@/lib/lunar";
import type { CalendarDay, ChallengeDefinition } from "@/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function LunarCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [challenges, setChallenges] = useState<ChallengeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CalendarDay | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      api.get<{ days: CalendarDay[] }>(`/calendar?year=${year}&month=${month}`),
      api.get<{ challenges: ChallengeDefinition[] }>("/challenges"),
    ])
      .then(([cal, ch]) => {
        if (!active) return;
        setDays(cal.days);
        setChallenges(ch.challenges);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [year, month]);

  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const shift = (delta: number) => {
    setSelected(null);
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const challengeBySlug = (slug: string) => challenges.find((c) => c.slug === slug);

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-moon">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => shift(-1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-violet-glow/20 text-moon-dim transition hover:text-moon"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => shift(1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-violet-glow/20 text-moon-dim transition hover:text-moon"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[11px] uppercase tracking-wide text-moon-dim">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const isToday =
            day.day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
          const completed = (day.completedChallenges?.length ?? 0) > 0;
          return (
            <button
              key={day.date}
              onClick={() => setSelected(day)}
              className={`group relative flex aspect-square flex-col items-center justify-center rounded-xl border text-center transition ${
                selected?.date === day.date
                  ? "border-violet-glow/60 bg-violet-glow/15"
                  : "border-white/5 bg-white/[0.02] hover:border-violet-glow/30 hover:bg-violet-glow/10"
              }`}
            >
              <span
                className={`text-[10px] leading-none ${
                  isToday ? "text-aurora" : "text-moon-dim"
                }`}
              >
                {day.phaseEmoji}
              </span>
              <span
                className={`mt-0.5 font-display text-sm ${
                  isToday ? "text-aurora" : "text-moon"
                }`}
              >
                {day.day}
              </span>
              {completed && (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-aurora shadow-[0_0_8px_2px_rgba(122,240,208,0.6)]" />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected.date}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-4 rounded-2xl border border-violet-glow/20 bg-obsidian-soft/70 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-sm text-moon">
                {new Date(selected.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="text-xs text-moon-dim">
                {selected.phase} · {Math.round(selected.illumination)}% lit
              </span>
            </div>
            {selected.completedChallenges && selected.completedChallenges.length > 0 ? (
              <ul className="space-y-1.5">
                {selected.completedChallenges.map((slug) => {
                  const c = challengeBySlug(slug);
                  return (
                    <li
                      key={slug}
                      className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-sm text-moon"
                    >
                      <span className="text-base">{c?.icon ?? "🌙"}</span>
                      <span className="flex-1">{c?.title ?? slug}</span>
                      <Check className="h-4 w-4 text-aurora" />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="flex items-center gap-2 text-sm text-moon-dim">
                <Flame className="h-4 w-4 text-rose-glow" />
                No challenges logged on this date. A quiet night.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {loading && <p className="mt-3 text-center text-xs text-moon-dim">reading the sky…</p>}
    </div>
  );
}
