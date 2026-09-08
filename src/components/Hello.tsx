import React from "react";
import { User, Trophy, Calendar, Sparkles, ArrowUpRight, MessageSquare, HelpCircle } from "lucide-react";
import { getLunarStatus } from "../lib/lunar";
import { getNextActiveEvent } from "../lib/events";

interface HelloProps {
  nickname: string;
  xp: number;
  onNavigateToView?: (view: string) => void;
}

export default function Hello({ nickname, xp, onNavigateToView }: HelloProps) {
  const displayName = nickname || "astral_traveler";
  const lunar = getLunarStatus(new Date());
  const nextEvent = getNextActiveEvent(new Date());

  const rankLabels = [
    { floor: 0, label: "Moon Muncher", color: "text-slate-400" },
    { floor: 100, label: "Crescent Nibbler", color: "text-turquoise" },
    { floor: 300, label: "Lunar Explorer", color: "text-turquoise" },
    { floor: 600, label: "Cosmic Oracle", color: "text-turquoise-bright" },
  ];

  const currentRank = [...rankLabels].reverse().find(r => xp >= r.floor) || rankLabels[0];
  const nextRank = rankLabels.find(r => r.floor > xp);

  return (
    <div className="space-y-6 p-4 max-w-6xl mx-auto text-slate-200">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-turquoise-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl border border-turquoise-500/30 bg-turquoise-500/10 text-turquoise">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono text-turquoise flex items-center gap-2">
              Hello, {displayName}!
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              Level {currentRank ? rankLabels.findIndex(r => r.label === currentRank.label) + 1 : 1} · {currentRank?.label} · {xp} Cheese
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-5 space-y-4">
          <h2 className="text-xs font-bold font-mono text-turquoise uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Tonight's Sky
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-4xl">{lunar.phase.emoji}</span>
            <div>
              <span className="text-sm font-bold font-mono text-slate-100 block">{lunar.phase.name}</span>
              <span className="text-[10px] font-mono text-slate-500">{Math.round(lunar.illumination)}% illuminated</span>
            </div>
          </div>
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40">
            <span className="text-[9px] font-mono text-slate-500 uppercase block">Upcoming Event</span>
            <span className="text-xs font-bold font-mono text-slate-200 block mt-0.5">{nextEvent.title}</span>
            <span className="text-[10px] font-mono text-turquoise-dim">{nextEvent.date}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-5 space-y-3">
          <h2 className="text-xs font-bold font-mono text-turquoise uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" /> Rank Progress
          </h2>
          <div className="space-y-2">
            <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
              <div
                className="h-full bg-turquoise-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (xp / 600) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-slate-500">Moon Muncher (0)</span>
              <span className="text-slate-500">Cosmic Oracle (600+)</span>
            </div>
            {nextRank && (
              <span className="text-[9px] font-mono text-slate-400 block">
                {nextRank.floor - xp} XP to {nextRank.label}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-5 space-y-3">
        <h2 className="text-xs font-bold font-mono text-turquoise uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" /> Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onNavigateToView?.("moondial")}
            className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-center hover:border-turquoise-500/40 transition-all"
          >
            <Calendar className="w-4 h-4 text-turquoise" />
            <span className="text-xs font-mono">Moondial & Calendar</span>
          </button>
          <button
            onClick={() => onNavigateToView?.("challenges")}
            className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-center hover:border-turquoise-500/40 transition-all"
          >
            <Trophy className="w-4 h-4 text-turquoise" />
            <span className="text-xs font-mono">Challenges & Games</span>
          </button>
          <button
            onClick={() => onNavigateToView?.("notebook")}
            className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-turquoise-500/40 text-left transition-all"
          >
            <Sparkles className="w-4 h-4 text-turquoise" />
            <span className="text-xs font-mono">Notebook</span>
          </button>
        </div>
        <button
          onClick={() => onNavigateToView?.("chat")}
          className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-turquoise-500/40 text-left transition-all"
        >
          <MessageSquare className="w-4 h-4 text-turquoise" />
          <span className="text-xs font-mono">Chat with the AI Companion</span>
        </button>
      </div>
    </div>
  );
}
