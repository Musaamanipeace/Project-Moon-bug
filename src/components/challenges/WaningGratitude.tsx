import { useState } from "react";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { ModuleShell, type ModuleProps } from "./shared";

export default function WaningGratitude({ challenge, state, onSave }: ModuleProps) {
  const initial = ((state?.data?.gratitudes as string[]) || ["", "", ""]).slice(0, 3);
  const [items, setItems] = useState<string[]>(
    [...initial, ...Array(3 - initial.length).fill("")].slice(0, 3),
  );
  const [saving, setSaving] = useState(false);

  const setItem = (i: number, v: string) => {
    setItems((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  };

  const filled = items.filter((x) => x.trim().length > 0).length;
  const completed = filled === 3;

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ gratitudes: items.map((x) => x.trim()) }, completed);
    } finally {
      setSaving(false);
    }
  };

  const prompts = [
    "A person who lifted you recently…",
    "A small moment of beauty today…",
    "Something about yourself you appreciate…",
  ];

  return (
    <ModuleShell
      challenge={challenge}
      completed={!!state?.completed}
      saving={saving}
      canComplete={completed}
      onSave={save}
      lastUpdated={state?.updatedAt}
    >
      <div className="space-y-3">
        {items.map((val, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 rounded-2xl border border-violet-glow/15 bg-obsidian-soft/50 px-4 py-3"
          >
            <Heart className="h-4 w-4 shrink-0 text-rose-glow" />
            <input
              value={val}
              onChange={(e) => setItem(i, e.target.value)}
              placeholder={prompts[i]}
              className="w-full bg-transparent text-moon outline-none placeholder:text-moon-dim/50"
            />
          </motion.div>
        ))}
        <p className="pt-1 text-sm text-moon-dim">
          {filled}/3 saved. {completed ? "Gratitude logged for the cycle." : "Add all three to complete."}
        </p>
      </div>
    </ModuleShell>
  );
}
