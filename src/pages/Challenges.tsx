import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Check, ArrowRight, Compass } from "lucide-react";
import { api } from "@/lib/api";
import type { ChallengeWithState } from "@/types";

export default function Challenges() {
  const [challenges, setChallenges] = useState<ChallengeWithState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ challenges: ChallengeWithState[] }>("/challenges")
      .then((d) => setChallenges(d.challenges))
      .finally(() => setLoading(false));
  }, []);

  const completed = challenges.filter((c) => c.userState?.completed).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-gradient">Lunar Challenges</h1>
        <p className="mt-1 text-moon-dim">
          Five practices mapped to the moon's quarters. Complete all five to earn your lunar badges.
        </p>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-moon-dim">Cycle progress</span>
          <span className="text-aurora">
            {completed} / {challenges.length || 5}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-glow to-aurora"
            initial={{ width: 0 }}
            animate={{ width: `${challenges.length ? (completed / challenges.length) * 100 : 0}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-moon-dim">summoning your challenges…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {challenges.map((c, i) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/challenges/${c.slug}`}
                className="group flex h-full flex-col justify-between rounded-2xl border border-violet-glow/15 bg-white/[0.02] p-5 transition hover:border-violet-glow/40 hover:bg-violet-glow/5"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-3xl">{c.icon}</span>
                    {c.userState?.completed ? (
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-aurora/20 text-aurora ring-1 ring-aurora/40">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : (
                      <Compass className="h-5 w-5 text-moon-dim group-hover:text-violet-glow" />
                    )}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-moon">{c.title}</h3>
                  <p className="mt-1 text-sm text-moon-dim">{c.description}</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-violet-glow">
                  Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
