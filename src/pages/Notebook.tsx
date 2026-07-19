import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { BookOpen, Plus, Trash2, Save } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { NotebookEntry, NotebookType } from "@/types";

const TYPES: { value: NotebookType; label: string }[] = [
  { value: "journal", label: "Daily Journal" },
  { value: "dream", label: "Dream Journal" },
  { value: "logbook", label: "Logbook" },
  { value: "goal", label: "Life Goals" },
  { value: "schedule", label: "Scheduler" },
  { value: "idea", label: "Ideas" },
];

export default function Notebook() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<NotebookType>("journal");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await api.get<{ entries: NotebookEntry[] }>("/notebook");
      setEntries(data.entries);
    } catch {
      setError("Could not load your notebook.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post<{ entry: NotebookEntry }>("/notebook", {
        entryType: type,
        title,
        body,
        dueDate: dueDate || null,
      });
      setTitle("");
      setBody("");
      setDueDate("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save entry.");
    }
  }

  async function remove(id: string) {
    try {
      await api.del(`/notebook/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError("Could not delete entry.");
    }
  }

  if (!user) {
    return <p className="text-moon-dim">Sign in to open your notebook.</p>;
  }

  return (
    <div className="space-y-10">
      <section>
        <h1 className="flex items-center gap-2 font-display text-3xl font-semibold text-moon">
          <BookOpen className="h-7 w-7 text-aurora" /> The Notebook
        </h1>
        <p className="mt-2 text-moon-dim">
          A quiet place for daily journals, dreams, challenge logs, goals, schedules, and ideas.
        </p>
      </section>

      <section className="rounded-2xl border border-violet-glow/15 bg-white/[0.02] p-5">
        <form onSubmit={submit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  type === t.value
                    ? "bg-violet-glow/25 text-moon ring-1 ring-violet-glow/40"
                    : "text-moon-dim hover:text-moon"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-xl border border-violet-glow/15 bg-obsidian-soft/60 px-4 py-2.5 text-moon placeholder:text-moon-dim/60 outline-none focus:ring-1 focus:ring-violet-glow/40"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write here…"
            rows={4}
            className="w-full resize-y rounded-xl border border-violet-glow/15 bg-obsidian-soft/60 px-4 py-2.5 text-moon placeholder:text-moon-dim/60 outline-none focus:ring-1 focus:ring-violet-glow/40"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-moon-dim">
              Due
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-lg border border-violet-glow/15 bg-obsidian-soft/60 px-3 py-1.5 text-moon outline-none"
              />
            </label>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-glow to-indigo-glow px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-glow/30 transition hover:brightness-110"
            >
              <Save className="h-4 w-4" /> Save entry
            </button>
          </div>
          {error && <p className="text-sm text-rose-glow">{error}</p>}
        </form>
      </section>

      <section>
        {loading ? (
          <p className="text-moon-dim">Summoning your entries…</p>
        ) : entries.length === 0 ? (
          <p className="text-moon-dim">No entries yet. Capture your first thought above.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group relative rounded-2xl border border-violet-glow/15 bg-white/[0.02] p-5"
              >
                <span className="text-xs uppercase tracking-wide text-violet-glow/80">
                  {TYPES.find((t) => t.value === e.entryType)?.label ?? e.entryType}
                </span>
                <h3 className="mt-1 font-display text-lg font-semibold text-moon">{e.title || "Untitled"}</h3>
                {e.body && <p className="mt-2 whitespace-pre-wrap text-sm text-moon-dim">{e.body}</p>}
                {e.dueDate && (
                  <p className="mt-3 text-xs text-aurora">Due {e.dueDate}</p>
                )}
                <button
                  onClick={() => remove(e.id)}
                  className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-moon-dim opacity-0 transition hover:text-rose-glow group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
