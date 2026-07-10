import { useState } from "react";
import { ChevronLeft, ChevronRight, Filter, Eye, EyeOff, Sparkles } from "lucide-react";
import { getLunarAge, getMoonPhaseDetails } from "../lib/lunar";

interface CalendarDashboardProps {
  isOnline: boolean;
}

export default function CalendarDashboard({ isOnline }: CalendarDashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activePhaseFilter, setActivePhaseFilter] = useState<string | null>(null);
  const [showAstroEvents, setShowAstroEvents] = useState(true);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Stable Grid Math
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Create grid cells (pads at start, valid days, pads at end to total 42 cells)
  const cells: { type: "pad" | "day"; dayNumber?: number; dateObj?: Date }[] = [];

  // 1. Initial pads
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push({ type: "pad" });
  }

  // 2. Active days
  for (let d = 1; d <= totalDays; d++) {
    cells.push({
      type: "day",
      dayNumber: d,
      dateObj: new Date(year, month, d)
    });
  }

  // 3. Trailing pads to secure a stable 42-cell fixed layout (7 columns x 6 rows)
  const remaining = 42 - cells.length;
  for (let i = 0; i < remaining; i++) {
    cells.push({ type: "pad" });
  }

  // Predefined Astro Event markers to showcase calendar integration
  // August 12: Eclipse/Perseids; July 15: ISS Transit; July 21: Supermoon
  const getDayEvents = (dayNum: number, currentMonth: number) => {
    const events: { title: string; type: string }[] = [];
    if (currentMonth === 7 && dayNum === 12) {
      events.push({ title: "Total Eclipse", type: "eclipse" });
      events.push({ title: "Perseids Peak", type: "meteor-shower" });
    }
    if (currentMonth === 6 && dayNum === 15) {
      events.push({ title: "ISS Moon Transit", type: "transit" });
    }
    if (currentMonth === 6 && dayNum === 21) {
      events.push({ title: "Buck Supermoon", type: "supermoon" });
    }
    return events;
  };

  const phaseButtons = [
    { name: "New Moon", emoji: "🌑" },
    { name: "Waxing Crescent", emoji: "🌒" },
    { name: "First Quarter", emoji: "🌓" },
    { name: "Waxing Gibbous", emoji: "🌔" },
    { name: "Full Moon", emoji: "🌕" },
    { name: "Waning Gibbous", emoji: "🌖" },
    { name: "Last Quarter", emoji: "🌗" },
    { name: "Waning Crescent", emoji: "🌘" }
  ];

  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto text-slate-200">
      
      {/* Calendar Controls header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 hover:text-white transition-all focus:outline-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-bold font-mono tracking-wider text-slate-100 min-w-[150px] text-center">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 hover:text-white transition-all focus:outline-none"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Toggles and active filter summaries */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowAstroEvents(!showAstroEvents)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border font-mono text-[10px] uppercase font-bold transition-all duration-300 focus:outline-none ${
              showAstroEvents
                ? "border-yellow-500 bg-yellow-500/10 text-yellow-300"
                : "border-slate-800 bg-slate-950 text-slate-500"
            }`}
          >
            {showAstroEvents ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Astro Events</span>
          </button>

          {activePhaseFilter && (
            <button
              onClick={() => setActivePhaseFilter(null)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed border-slate-700 bg-slate-950 text-[10px] text-slate-300 hover:text-red-400 hover:border-red-500/30 font-mono"
            >
              <span>Filter: {activePhaseFilter}</span>
              <span>&times;</span>
            </button>
          )}
        </div>
      </div>

      {/* Lunar Phase Filter grid */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-[#0c0d16]/80 backdrop-blur-md">
        <h3 className="text-xs font-bold font-mono text-yellow-400 tracking-wider uppercase mb-3 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter grid by Lunar Phase</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {phaseButtons.map((btn) => (
            <button
              key={btn.name}
              onClick={() => {
                if (activePhaseFilter === btn.name) {
                  setActivePhaseFilter(null);
                } else {
                  setActivePhaseFilter(btn.name);
                }
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-bold font-mono transition-all duration-300 focus:outline-none ${
                activePhaseFilter === btn.name
                  ? "border-yellow-500 bg-yellow-500/15 text-yellow-300"
                  : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:text-slate-100"
              }`}
            >
              <span className="text-sm">{btn.emoji}</span>
              <span>{btn.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stable Fixed Grid Calendar Display */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-md">
        {/* Weekday Labels Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono font-bold text-slate-500 uppercase pb-2 border-b border-slate-800/60 mb-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Stable 42 Grid Cells */}
        <div className="grid grid-cols-7 gap-2">
          {cells.map((cell, index) => {
            if (cell.type === "pad") {
              // Purged undefined markers - render a stable empty pad box
              return (
                <div
                  key={`pad-${index}`}
                  className="aspect-square rounded-xl bg-slate-950/10 border border-slate-900/50 opacity-20"
                />
              );
            }

            // Day rendering logic
            const dayNum = cell.dayNumber!;
            const dayDate = cell.dateObj!;
            const lunarAge = getLunarAge(dayDate);
            const phase = getMoonPhaseDetails(lunarAge);

            const isFiltered = activePhaseFilter === phase.name;
            const events = getDayEvents(dayNum, month);
            const hasEvents = events.length > 0;

            const isToday =
              new Date().getDate() === dayNum &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <div
                key={`day-${dayNum}`}
                className={`aspect-square p-2 rounded-xl border flex flex-col justify-between transition-all duration-300 relative ${
                  isFiltered
                    ? "border-yellow-500 bg-yellow-500/10 text-yellow-100 shadow-md shadow-yellow-500/5"
                    : isToday
                    ? "border-amber-400 bg-amber-500/5 text-amber-100"
                    : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                }`}
              >
                {/* Clean Numeric Day with no undefined labels */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold font-mono ${isToday ? "text-yellow-400" : "text-slate-200"}`}>
                    {dayNum}
                  </span>
                  <span className="text-xs" title={phase.name}>
                    {phase.emoji}
                  </span>
                </div>

                {/* Event or Phase Indicator dot */}
                <div className="flex flex-col gap-0.5 justify-end h-1/2 overflow-hidden">
                  {showAstroEvents && hasEvents && (
                    <div className="flex flex-col gap-0.5">
                      {events.map((ev, eIdx) => (
                        <span
                          key={eIdx}
                          className="text-[7px] font-mono font-bold leading-none py-0.5 px-1 rounded truncate bg-yellow-500 text-slate-950 flex items-center gap-0.5 shadow-sm"
                        >
                          <Sparkles className="w-1.5 h-1.5" />
                          {ev.title}
                        </span>
                      ))}
                    </div>
                  )}

                  {!hasEvents && (
                    <span className="text-[7px] text-slate-500 font-mono tracking-tighter truncate opacity-60">
                      Day {Math.floor(lunarAge)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
