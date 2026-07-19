import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Calendar, Telescope } from "lucide-react";
import { api } from "@/lib/api";
import type { MoonEvent } from "@/types";

export default function Events() {
  const [events, setEvents] = useState<MoonEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ events: MoonEvent[] }>("/events")
      .then((d) => setEvents(d.events))
      .catch(() => setError("Could not load the events catalogue."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="flex items-center gap-2 font-display text-3xl font-semibold text-moon">
          <Calendar className="h-7 w-7 text-aurora" /> Events Catalogue
        </h1>
        <p className="mt-2 text-moon-dim">
          Upcoming astronomical happenings, available offline from our curated catalogue.
        </p>
      </section>

      <section>
        {loading ? (
          <p className="text-moon-dim">Charting the sky…</p>
        ) : error ? (
          <p className="text-sm text-rose-glow">{error}</p>
        ) : events.length === 0 ? (
          <p className="text-moon-dim">No upcoming events in the catalogue.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl border border-violet-glow/15 bg-white/[0.02] p-5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-violet-glow/80">
                    {e.rarity}
                  </span>
                  <Telescope className="h-4 w-4 text-aurora" />
                </div>
                <h3 className="font-display text-lg font-semibold text-moon">{e.title}</h3>
                <p className="mt-1 text-sm text-aurora">{e.eventDate}</p>
                <p className="mt-2 text-sm text-moon-dim">{e.synopsis}</p>
                {e.source && (
                  <p className="mt-3 text-xs text-moon-dim/70">Source: {e.source}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
