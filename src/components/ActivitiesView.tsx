import React, { useState } from "react";
import { Trophy, Gamepad2, Moon, Calendar, Sparkles } from "lucide-react";
import ChallengesDashboard from "./ChallengesDashboard";
import GamesDashboard from "./GamesDashboard";
import DialDashboard from "./DialDashboard";
import CalendarDashboard from "./CalendarDashboard";
import EventsDashboard from "./EventsDashboard";

interface ActivitiesViewProps {
  nickname: string;
  initialSubtab?: "challenges" | "games" | "moon-clock";
  onNavigateToView?: (view: string) => void;
  onShareFeed?: (entry: {
    kind: any;
    title?: string;
    body?: string;
    refId?: string;
    refType?: string;
    experience?: string;
  }) => void;
}

export default function ActivitiesView({
  nickname,
  initialSubtab = "challenges",
  onNavigateToView,
  onShareFeed,
}: ActivitiesViewProps) {
  const [subtab, setSubtab] = useState<"challenges" | "games" | "moon-clock">(initialSubtab);
  const [moonClockLens, setMoonClockLens] = useState<"dial" | "calendar" | "events">("dial");

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Sub-nav bar for Activities (§1b) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-turquoise" />
            Activities &amp; Astronomical Tools
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Challenges, community games, and the unified celestial moon clock.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/70 p-1.5 rounded-2xl border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setSubtab("challenges")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              subtab === "challenges"
                ? "bg-turquoise-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Challenges</span>
          </button>

          <button
            onClick={() => setSubtab("games")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              subtab === "games"
                ? "bg-turquoise-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Games</span>
          </button>

          <button
            onClick={() => setSubtab("moon-clock")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              subtab === "moon-clock"
                ? "bg-turquoise-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Moon Clock</span>
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE SUBTAB */}
      {subtab === "challenges" && (
        <ChallengesDashboard
          onNavigateToView={onNavigateToView}
          onShareFeed={onShareFeed}
        />
      )}

      {subtab === "games" && (
        <GamesDashboard
          nickname={nickname}
          onNavigateToView={onNavigateToView}
        />
      )}

      {subtab === "moon-clock" && (
        <div className="space-y-6">
          {/* Moon Clock Lens Switcher */}
          <div className="flex items-center justify-center gap-2 font-mono text-xs">
            <button
              onClick={() => setMoonClockLens("dial")}
              className={`px-4 py-1.5 rounded-xl border transition-all ${
                moonClockLens === "dial"
                  ? "border-turquoise-500/50 bg-turquoise-500/15 text-turquoise font-bold"
                  : "border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              3D Earth Orbit Clock
            </button>
            <button
              onClick={() => setMoonClockLens("calendar")}
              className={`px-4 py-1.5 rounded-xl border transition-all ${
                moonClockLens === "calendar"
                  ? "border-turquoise-500/50 bg-turquoise-500/15 text-turquoise font-bold"
                  : "border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Lunar Calendar
            </button>
            <button
              onClick={() => setMoonClockLens("events")}
              className={`px-4 py-1.5 rounded-xl border transition-all ${
                moonClockLens === "events"
                  ? "border-turquoise-500/50 bg-turquoise-500/15 text-turquoise font-bold"
                  : "border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Astro Events &amp; Transits
            </button>
          </div>

          {moonClockLens === "dial" && (
            <DialDashboard
              locationText="Equatorial Arc &bull; 0.0°N, 0.0°E"
              birthDate="2000-01-01"
              nickname={nickname}
            />
          )}

          {moonClockLens === "calendar" && (
            <CalendarDashboard onNavigateToView={onNavigateToView} />
          )}

          {moonClockLens === "events" && (
            <EventsDashboard
              nickname={nickname}
              onAddXp={() => {}}
              isOnline={true}
              onNavigateToView={onNavigateToView}
              onShareFeed={onShareFeed}
            />
          )}
        </div>
      )}
    </div>
  );
}
