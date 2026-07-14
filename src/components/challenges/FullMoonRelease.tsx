import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Plus, Wind } from "lucide-react";
import { ModuleShell, type ModuleProps } from "./shared";

export default function FullMoonRelease({ challenge, state, onSave }: ModuleProps) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [released, setReleased] = useState<string[]>((state?.data?.releases as string[]) || []);
  const [burning, setBurning] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const addPending = () => {
    const v = draft.trim();
    if (!v) return;
    setPending((p) => [...p, v]);
    setDraft("");
  };

  const release = (index: number) => {
    if (burning !== null) return;
    setBurning(index);
    setTimeout(() => {
      const item = pending[index];
      const nextReleased = [...released, item];
      const nextPending = pending.filter((_, i) => i !== index);
      setReleased(nextReleased);
      setPending(nextPending);
      setBurning(null);
      persist(nextReleased);
    }, 1400);
  };

  const releaseAll = () => {
    if (pending.length === 0 || burning !== null) return;
    const nextReleased = [...released, ...pending];
    setReleased(nextReleased);
    setPending([]);
    persist(nextReleased);
  };

  const persist = async (list: string[]) => {
    setSaving(true);
    try {
      await onSave({ releases: list }, list.length > 0);
    } finally {
      setSaving(false);
    }
  };

  const completed = released.length > 0;

  return (
    <ModuleShell
      challenge={challenge}
      completed={!!state?.completed}
      saving={saving}
      canComplete={completed}
      onSave={() => persist(released)}
      lastUpdated={state?.updatedAt}
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2 rounded-2xl border border-violet-glow/15 bg-obsidian-soft/50 px-4 py-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPending()}
            placeholder="Something you are ready to let go of…"
            className="w-full bg-transparent text-moon outline-none placeholder:text-moon-dim/50"
          />
          <button
            onClick={addPending}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-glow/20 text-violet-glow transition hover:bg-violet-glow/30"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {pending.length > 0 && (
          <div className="space-y-2">
            <AnimatePresence>
              {pending.map((item, i) => (
                <motion.div
                  key={`${item}-${i}`}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={
                    burning === i
                      ? { opacity: 0, y: -60, scale: 0.7, filter: "blur(6px)" }
                      : { opacity: 1, y: 0 }
                  }
                  exit={{ opacity: 0 }}
                  transition={{ duration: burning === i ? 1.4 : 0.25 }}
                  className={`flex items-center justify-between rounded-xl border border-rose-glow/20 bg-rose-glow/5 px-4 py-2.5 text-moon ${
                    burning === i ? "burn-anim" : ""
                  }`}
                >
                  <span>{item}</span>
                  <button
                    onClick={() => release(i)}
                    disabled={burning !== null}
                    className="flex items-center gap-1 text-xs text-rose-glow transition hover:brightness-125 disabled:opacity-50"
                  >
                    <Flame className="h-4 w-4" /> Release
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            <button
              onClick={releaseAll}
              disabled={burning !== null}
              className="text-xs text-moon-dim underline-offset-2 hover:text-rose-glow hover:underline disabled:opacity-50"
            >
              Release everything at once
            </button>
          </div>
        )}

        {released.length > 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <p className="mb-2 flex items-center gap-2 text-sm text-aurora">
              <Wind className="h-4 w-4" /> Released into the dark
            </p>
            <ul className="space-y-1">
              {released.map((item, i) => (
                <li key={i} className="text-sm text-moon-dim/70 line-through decoration-rose-glow/50">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ModuleShell>
  );
}
