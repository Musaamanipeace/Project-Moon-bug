import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Compass, Check, CalendarDays, MoonStar } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { SYNODIC_MONTH } from "@/lib/lunar";
import { listEvents } from "@/lib/events";
import type { ChallengeWithState, MoonEvent } from "@/types";
import MoonDial from "@/components/MoonDial";
import LunarCalendar from "@/components/LunarCalendar";

interface LunarNow {
  age: number;
  illumination: number;
  phase: string;
  phaseCode: string;
  phaseEmoji: string;
  daysUntilFull: number;
  daysUntilNew: number;
}

export default function Home() {
  const { user } = useAuth();
  const [lunar, setLunar] = useState<LunarNow | null>(null);
  const [challenges, setChallenges] = useState<ChallengeWithState[]>([]);
  const [astroEvents, setAstroEvents] = useState<MoonEvent[]>([]);
  const [astroLoading, setAstroLoading] = useState(true);

  useEffect(() => {
    api.get<LunarNow>("/lunar/now").then(setLunar).catch(() => {});
    if (user) {
      api
        .get<{ challenges: ChallengeWithState[] }>("/challenges")
        .then((d) => setChallenges(d.challenges))
        .catch(() => {});
    }
    listEvents("astronomical")
      .then((d) => {
        const sorted = d.events
          .slice()
          .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
        setAstroEvents(sorted.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setAstroLoading(false));
  }, [user]);

  const fraction = lunar ? lunar.age / SYNODIC_MONTH : 0;
  const completedCount = challenges.filter((c) => c.userState?.completed).length;

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="grid items-center gap-8 rounded-[2rem] border border-violet-glow/15 bg-obsidian-soft/40 p-6 sm:grid-cols-[auto,1fr] sm:p-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mx-auto"
        >
          {lunar && <MoonDial fraction={fraction} size={240} />}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="mb-2 flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-aurora">
            <MoonStar className="h-4 w-4" /> Tonight's sky
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-gradient sm:text-5xl">
            {lunar ? lunar.phase : "Reading the moon…"}
          </h1>
          <p className="mt-3 max-w-md text-moon-dim">
            The moon is{" "}
            <span className="text-moon">{lunar ? Math.round(lunar.illumination) : 0}% illuminated</span>.
            {lunar && (
              <>
                {" "}
                <span className="text-moon">{lunar.daysUntilFull.toFixed(1)} days</span> until the next
                Full Moon, and <span className="text-moon">{lunar.daysUntilNew.toFixed(1)} days</span> until
                the next New Moon.
              </>
            )}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {user ? (
              <Link
                to="/challenges"
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-glow to-indigo-glow px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-glow/30 transition hover:brightness-110"
              >
                <Compass className="h-4 w-4" /> Open your challenges
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-glow to-indigo-glow px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-glow/30 transition hover:brightness-110"
              >
                Begin your lunar journey
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </motion.div>
      </section>

      {/* Challenges overview */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-moon">The Five Lunar Challenges</h2>
          {user && (
            <span className="text-sm text-moon-dim">
              <span className="text-aurora">{completedCount}</span> / 5 completed
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challengeSeed.map((c, i) => {
            const state = challenges.find((x) => x.slug === c.slug);
            const done = state?.userState?.completed;
            return (
              <motion.div
                key={c.slug}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={user ? `/challenges/${c.slug}` : "/login"}
                  className="group relative block overflow-hidden rounded-2xl border border-violet-glow/15 bg-white/[0.02] p-5 transition hover:border-violet-glow/40 hover:bg-violet-glow/5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-3xl">{c.icon}</span>
                    {done && (
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-aurora/20 text-aurora ring-1 ring-aurora/40">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-moon">{c.title}</h3>
                  <p className="mt-1 text-sm text-moon-dim">{c.desc}</p>
                  <span className="mt-3 inline-block text-xs uppercase tracking-wide text-violet-glow/80">
                    {c.phase}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Calendar */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-aurora" />
          <h2 className="font-display text-2xl font-semibold text-moon">Lunar Calendar</h2>
        </div>
        <LunarCalendar />
      </section>

      {/* Upcoming astronomical events */}
      <section className="glass rounded-3xl p-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-moon">Upcoming astronomical events</h2>
          <Link
            to="/events"
            className="flex items-center gap-1 text-sm text-aurora transition hover:text-moon"
          >
            View all events <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {astroLoading ? (
          <p className="text-sm text-moon-dim">Scanning the sky…</p>
        ) : astroEvents.length === 0 ? (
          <p className="text-sm text-moon-dim">No upcoming astronomical events found.</p>
        ) : (
          <ul className="space-y-3">
            {astroEvents.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center justify-between rounded-2xl border border-violet-glow/15 bg-white/[0.02] px-4 py-3"
              >
                <div>
                  <p className="font-display text-sm font-semibold text-moon">{ev.title}</p>
                  <p className="text-xs text-aurora">{ev.eventDate}</p>
                </div>
                <span className="text-xs uppercase tracking-wide text-violet-glow/80">
                  {ev.rarity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const challengeSeed = [
  { slug: "new-moon-reflection", title: "New Moon Reflection", icon: "🌑", phase: "New Moon", desc: "Set three intentions for the cycle ahead." },
  { slug: "waxing-crescent-focus", title: "Waxing Crescent Focus", icon: "🌒", phase: "Waxing Crescent", desc: "Allocate your rising energy with intent." },
  { slug: "full-moon-release", title: "Full Moon Release", icon: "🌕", phase: "Full Moon", desc: "Let go of what no longer serves you." },
  { slug: "waning-gratitude", title: "Waning Gibbous Gratitude", icon: "🌖", phase: "Waning Gibbous", desc: "Note three things you are grateful for." },
  { slug: "balsamic-rest", title: "Balsamic Moon Rest", icon: "🌘", phase: "Balsamic", desc: "Wind down with a 4-7-8 breathing session." },
];
