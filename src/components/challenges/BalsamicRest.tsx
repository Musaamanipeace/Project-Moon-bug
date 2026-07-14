import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Play, Square, Moon } from "lucide-react";
import { ModuleShell, type ModuleProps } from "./shared";

type Phase = "idle" | "inhale" | "hold" | "exhale";

const PHASE_TEXT: Record<Phase, string> = {
  idle: "Press start to begin a 4-7-8 breathing cycle",
  inhale: "Breathe in…",
  hold: "Hold…",
  exhale: "Breathe out…",
};

export default function BalsamicRest({ challenge, state, onSave }: ModuleProps) {
  const initialSessions = Number(state?.data?.sessionsCompleted ?? 0);
  const [sessions, setSessions] = useState(initialSessions);
  const [phase, setPhase] = useState<Phase>("idle");
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);

  const runningRef = useRef(false);
  const countRef = useRef(initialSessions);

  const wait = (ms: number) =>
    new Promise<void>((res) => {
      const t = setTimeout(res, ms);
      timers.push(t);
    });
  const timers: ReturnType<typeof setTimeout>[] = [];

  const persist = async (count: number) => {
    setSaving(true);
    try {
      await onSave({ sessionsCompleted: count }, count > 0);
    } finally {
      setSaving(false);
    }
  };

  const stop = () => {
    runningRef.current = false;
    setRunning(false);
    setPhase("idle");
    timers.forEach(clearTimeout);
    timers.length = 0;
  };

  const start = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    while (runningRef.current) {
      setPhase("inhale");
      await wait(4000);
      if (!runningRef.current) break;
      setPhase("hold");
      await wait(7000);
      if (!runningRef.current) break;
      setPhase("exhale");
      await wait(8000);
      if (!runningRef.current) break;
      countRef.current += 1;
      setSessions(countRef.current);
      persist(countRef.current);
    }
  };

  useEffect(() => () => timers.forEach(clearTimeout), []);

  const scale = phase === "inhale" ? 1 : phase === "exhale" ? 0.5 : phase === "hold" ? 1 : 0.6;

  return (
    <ModuleShell
      challenge={challenge}
      completed={!!state?.completed}
      saving={saving}
      canComplete={sessions > 0}
      onSave={() => persist(sessions)}
      lastUpdated={state?.updatedAt}
    >
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="relative grid h-56 w-56 place-items-center">
          {phase === "inhale" && (
            <>
              <motion.span
                className="absolute h-40 w-40 rounded-full border border-aurora/40"
                animate={{ scale: [0.5, 2.4], opacity: [0.5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.span
                className="absolute h-40 w-40 rounded-full border border-aurora/30"
                animate={{ scale: [0.5, 2.4], opacity: [0.5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeOut", delay: 1.3 }}
              />
            </>
          )}
          <motion.div
            className="grid h-40 w-40 place-items-center rounded-full bg-gradient-to-br from-violet-glow/40 to-indigo-glow/20 ring-1 ring-violet-glow/40"
            animate={{ scale }}
            transition={{ duration: phase === "exhale" ? 8 : 4, ease: "easeInOut" }}
          >
            <Moon className="h-10 w-10 text-moon" />
          </motion.div>
        </div>

        <p className="font-display text-lg text-moon">{PHASE_TEXT[phase]}</p>

        <div className="flex items-center gap-4">
          {!running ? (
            <button
              onClick={start}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-glow to-indigo-glow px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-glow/30 transition hover:brightness-110"
            >
              <Play className="h-4 w-4" /> Start breathing
            </button>
          ) : (
            <button
              onClick={stop}
              className="flex items-center gap-2 rounded-full border border-rose-glow/40 px-6 py-2.5 text-sm font-medium text-rose-glow transition hover:bg-rose-glow/10"
            >
              <Square className="h-4 w-4" /> Stop
            </button>
          )}
        </div>

        <p className="text-sm text-moon-dim">
          Sessions completed: <span className="text-aurora">{sessions}</span>
        </p>
      </div>
    </ModuleShell>
  );
}
