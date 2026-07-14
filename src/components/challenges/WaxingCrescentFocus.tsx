import { useState } from "react";
import { motion } from "motion/react";
import { ModuleShell, type ModuleProps } from "./shared";

const FIELDS = [
  { key: "mental", label: "Mind", color: "#8b7bff" },
  { key: "physical", label: "Body", color: "#7af0d0" },
  { key: "social", label: "Spirit", color: "#ff8fb1" },
] as const;

export default function WaxingCrescentFocus({ challenge, state, onSave }: ModuleProps) {
  const d = (state?.data ?? {}) as Record<string, number>;
  const init: [number, number, number] = [
    Math.round(d.mental ?? 33),
    Math.round(d.physical ?? 33),
    Math.round(d.social ?? 34),
  ];
  const [vals, setVals] = useState<[number, number, number]>(init);
  const [saving, setSaving] = useState(false);

  const change = (i: number, v: number) => {
    v = Math.max(0, Math.min(100, Math.round(v)));
    const others = ([0, 1, 2] as const).filter((j) => j !== i);
    const remaining = 100 - v;
    const oldSum = vals[others[0]] + vals[others[1]];
    let a: number;
    let b: number;
    if (oldSum === 0) {
      a = Math.round(remaining / 2);
      b = remaining - a;
    } else {
      a = Math.round((remaining * vals[others[0]]) / oldSum);
      b = remaining - a;
    }
    const next: [number, number, number] = [...vals] as [number, number, number];
    next[i] = v;
    next[others[0]] = a;
    next[others[1]] = b;
    setVals(next);
  };

  const completed = vals.every((v) => v > 0);
  const total = vals[0] + vals[1] + vals[2];

  const save = async () => {
    setSaving(true);
    try {
      await onSave(
        { mental: vals[0], physical: vals[1], social: vals[2] },
        completed,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModuleShell
      challenge={challenge}
      completed={!!state?.completed}
      saving={saving}
      canComplete={completed}
      onSave={save}
      lastUpdated={state?.updatedAt}
    >
      <div className="space-y-5">
        <div className="flex h-4 w-full overflow-hidden rounded-full bg-white/5">
          {FIELDS.map((f, i) => (
            <motion.div
              key={f.key}
              animate={{ width: `${vals[i]}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ background: f.color }}
            />
          ))}
        </div>

        <div className="space-y-4">
          {FIELDS.map((f, i) => (
            <div key={f.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-moon">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: f.color }} />
                  {f.label}
                </span>
                <span className="font-display text-moon">{vals[i]}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={vals[i]}
                onChange={(e) => change(i, Number(e.target.value))}
                className="w-full accent-violet-glow"
                style={{ accentColor: f.color }}
              />
            </div>
          ))}
        </div>
        <p className="text-sm text-moon-dim">
          Allocate your daily energy. Total must stay at 100% — the remaining flows to your other
          focuses automatically. {completed ? "Balanced and ready." : "Give each focus some energy."}
        </p>
      </div>
    </ModuleShell>
  );
}
