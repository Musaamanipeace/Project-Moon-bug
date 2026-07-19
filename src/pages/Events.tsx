import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Calendar, Telescope, Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  listEvents,
  submitEvent,
  listCalendarEvents,
  saveCalendarEvent,
  removeCalendarEvent,
} from "@/lib/events";
import type { MoonEvent } from "@/types";

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<MoonEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [rarity, setRarity] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    listEvents()
      .then((d) => setEvents(d.events))
      .catch(() => setError("Could not load the events catalogue."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    listCalendarEvents()
      .then((d) => setSavedIds(new Set(d.events.map((e) => e.id))))
      .catch(() => {});
  }, [user]);

  const toggleSave = async (id: string) => {
    if (!user) return;
    setSavingId(id);
    setCalendarError(null);
    try {
      if (savedIds.has(id)) {
        await removeCalendarEvent(id);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        await saveCalendarEvent(id);
        setSavedIds((prev) => new Set(prev).add(id));
      }
    } catch (e: any) {
      setCalendarError(e?.message ?? "Could not update calendar.");
    } finally {
      setSavingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await submitEvent({ title, eventDate, rarity, synopsis, category, source });
      setSubmitSuccess(true);
      setTitle("");
      setEventDate("");
      setRarity("");
      setSynopsis("");
      setCategory("");
      setSource("");
    } catch (err: any) {
      setSubmitError(err?.message ?? "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

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

      <section className="glass rounded-3xl p-6">
        <h2 className="font-display text-xl font-semibold text-moon">Submit an event</h2>
        <p className="mt-1 text-sm text-moon-dim">
          Community events are reviewed before appearing in the catalogue.
        </p>

        {submitSuccess && (
          <p className="mt-3 text-sm text-aurora">Submitted for review.</p>
        )}
        {submitError && (
          <p className="mt-3 text-sm text-rose-glow">{submitError}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="rounded-xl border border-violet-glow/15 bg-white/[0.02] px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60 focus:border-violet-glow/40 focus:outline-none"
          />
          <input
            required
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="rounded-xl border border-violet-glow/15 bg-white/[0.02] px-3 py-2 text-sm text-moon focus:border-violet-glow/40 focus:outline-none"
          />
          <input
            required
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
            placeholder="Rarity (e.g. Common, Rare, Epic)"
            className="rounded-xl border border-violet-glow/15 bg-white/[0.02] px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60 focus:border-violet-glow/40 focus:outline-none"
          />
          <input
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="rounded-xl border border-violet-glow/15 bg-white/[0.02] px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60 focus:border-violet-glow/40 focus:outline-none"
          />
          <input
            required
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Source"
            className="rounded-xl border border-violet-glow/15 bg-white/[0.02] px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60 focus:border-violet-glow/40 focus:outline-none"
          />
          <textarea
            required
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            placeholder="Synopsis"
            rows={3}
            className="sm:col-span-2 rounded-xl border border-violet-glow/15 bg-white/[0.02] px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60 focus:border-violet-glow/40 focus:outline-none"
          />
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-gradient-to-r from-violet-glow to-indigo-glow px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-glow/30 transition hover:brightness-110 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
          </div>
        </form>
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
                  <div className="flex items-center gap-2">
                    {user && (
                      <button
                        onClick={() => toggleSave(e.id)}
                        disabled={savingId === e.id}
                        aria-label={savedIds.has(e.id) ? "Remove from calendar" : "Save to calendar"}
                        className="grid h-8 w-8 place-items-center rounded-full border border-violet-glow/20 text-moon-dim transition hover:text-aurora disabled:opacity-50"
                      >
                        <Heart
                          className={`h-4 w-4 ${savedIds.has(e.id) ? "fill-aurora text-aurora" : ""}`}
                        />
                      </button>
                    )}
                    <Telescope className="h-4 w-4 text-aurora" />
                  </div>
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
        {calendarError && (
          <p className="mt-3 text-sm text-rose-glow">{calendarError}</p>
        )}
      </section>
    </div>
  );
}

