import { type ReactNode } from "react";
import { motion } from "motion/react";
import { Check, Save, Sparkles } from "lucide-react";
import type { ChallengeDefinition, ChallengeState } from "@/types";

export interface ModuleProps {
  challenge: ChallengeDefinition;
  state: ChallengeState | null;
  onSave: (data: Record<string, unknown>, completed: boolean) => Promise<void>;
}

export function ModuleShell({
  challenge,
  completed,
  saving,
  canComplete,
  onSave,
  lastUpdated,
  children,
}: {
  challenge: ChallengeDefinition;
  completed: boolean;
  saving: boolean;
  canComplete: boolean;
  onSave: () => void;
  lastUpdated?: string;
  children: ReactNode;
}) {
  return (
    <div className="glass-strong rounded-3xl p-6 sm:p-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-glow/15 text-3xl ring-1 ring-violet-glow/30">
            {challenge.icon}
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-moon">{challenge.title}</h1>
            <span className="text-xs uppercase tracking-wide text-violet-glow/80">
              {challenge.moonPhase}
            </span>
          </div>
        </div>
        {completed && (
          <span className="flex items-center gap-1.5 rounded-full bg-aurora/15 px-3 py-1 text-sm text-aurora ring-1 ring-aurora/30">
            <Check className="h-4 w-4" /> Completed
          </span>
        )}
      </div>

      <p className="mb-6 text-moon-dim">{challenge.prompt}</p>

      {children}

      <div className="mt-7 flex items-center justify-between border-t border-white/5 pt-5">
        <span className="text-xs text-moon-dim">
          {lastUpdated
            ? `Last saved ${new Date(lastUpdated).toLocaleString()}`
            : "Not saved yet"}
        </span>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onSave}
          disabled={saving}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition disabled:opacity-60 ${
            canComplete
              ? "bg-gradient-to-r from-violet-glow to-indigo-glow text-white shadow-lg shadow-indigo-glow/30 hover:brightness-110"
              : "border border-violet-glow/25 text-moon-dim hover:text-moon"
          }`}
        >
          {canComplete ? <Sparkles className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : canComplete ? "Save & complete" : "Save progress"}
        </motion.button>
      </div>
    </div>
  );
}
