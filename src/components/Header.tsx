import { useState } from "react";
import { Sun, Moon, Info, Sparkles, Wifi, WifiOff } from "lucide-react";

interface HeaderProps {
  activeView: string;
  isOnline: boolean;
  theme: "dark" | "light";
  onThemeToggle: () => void;
}

export default function Header({ activeView, isOnline, theme, onThemeToggle }: HeaderProps) {
  const [showPopover, setShowPopover] = useState(false);

  // Dynamic dashboard text and tooltip description mapping
  const dashboardMap: Record<string, { title: string; desc: string; steps: string }> = {
    home: {
      title: "Home Dashboard",
      desc: "Observe the real-time Sun and Moon positioning on our celestial Dial.",
      steps: "Enter birthdate below to track your precise Lunar Age (completed full cycles since birth). Complete daily Astro challenges to rank up.",
    },
    notes: {
      title: "Notes Workspace",
      desc: "A highly tailored notebook categorized into 5 specific scopes to organize your daily activities.",
      steps: "Manage a 3D flipping Journal, Timetables with auto-resets, long-term Life Goals, custom simulated Reminders, and Accessibility Ideas.",
    },
    profile: {
      title: "Profile Dashboard",
      desc: "Manage your cosmic identity, interests, occupational attributes, and active projects.",
      steps: "Access local files via the Personal Gallery, check your level on the Cheese Rank XP meter, or interact with the Cryptocurrency Wallet mockups.",
    },
    calendar: {
      title: "Calendar Dashboard",
      desc: "Review a fixed monthly grid showcasing accurate lunar phases for each date.",
      steps: "Toggle Astro Event flags or click specific lunar phase filter buttons to highlight matches across the month.",
    },
    chat: {
      title: "AI Companion Dashboard",
      desc: "Engage in helpful reflection and productive support conversations.",
      steps: "Talk to the astronomy-trained Moonbug Bot or establish a zero-latency real-time thread in the multi-user Tribe Chat.",
    },
    events: {
      title: "Events & Challenges",
      desc: "Explore detailed astronomy transits, eclipse guides, and community challenges.",
      steps: "Hover over cards to see magnificent hover states, click to view the comments forum, or complete assignments for extra XP.",
    },
  };

  const currentContext = dashboardMap[activeView] || dashboardMap.home;

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#0a0b10]/80 dark:bg-[#0a0b10]/80 light:bg-slate-100/90 backdrop-blur-md transition-all duration-300">
      {/* Animated Logo Container */}
      <div className="flex items-center gap-2 cursor-pointer group">
        <div className="relative">
          <Sparkles className="w-6 h-6 text-yellow-400 group-hover:text-amber-300 transition-colors duration-300 animate-spin-slow" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
          </span>
        </div>
        <h1 className="text-xl font-bold font-mono tracking-wider text-slate-100 group-hover:text-white transition-colors duration-500 relative">
          <span className="bg-gradient-to-r from-yellow-200 via-slate-100 to-white bg-[length:200%_auto] bg-clip-text text-transparent group-hover:animate-gradient-pulse">
            Moonbug
          </span>
        </h1>
      </div>

      {/* Center Dynamic Context Button with Hover Popover */}
      <div className="relative">
        <button
          onMouseEnter={() => setShowPopover(true)}
          onMouseLeave={() => setShowPopover(false)}
          onClick={() => setShowPopover(!showPopover)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/60 dark:border-slate-700/60 light:border-slate-300 bg-slate-900/50 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-yellow-500/10 text-xs font-semibold text-slate-200 transition-all duration-300 focus:outline-none"
        >
          <span>{currentContext.title}</span>
          <Info className="w-3.5 h-3.5 text-yellow-400" />
        </button>

        {showPopover && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 p-3 rounded-xl border border-slate-700 bg-[#0c0d16] text-slate-200 shadow-2xl backdrop-blur-lg z-50 transition-all duration-300 animate-fade-in">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0c0d16] border-t border-l border-slate-700 rotate-45" />
            <h4 className="text-xs font-bold text-yellow-400 mb-1 font-mono uppercase tracking-wider">
              {currentContext.title} Guide
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-1.5">
              {currentContext.desc}
            </p>
            <div className="border-t border-slate-800 pt-1.5">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Usage Instruction:</span>
              <p className="text-[10px] text-slate-300 leading-relaxed mt-0.5">
                {currentContext.steps}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls & Connection badges */}
      <div className="flex items-center gap-3">
        {/* Glowing Network Status Badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-slate-800 bg-slate-900/40 text-[10px] font-mono">
          {isOnline ? (
            <>
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-emerald-400 font-semibold uppercase animate-pulse">Online</span>
              <Wifi className="w-3 h-3 text-emerald-400" />
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-slate-500" />
              <span className="text-slate-400 uppercase">Offline</span>
              <WifiOff className="w-3 h-3 text-slate-400" />
            </>
          )}
        </div>

        {/* Global Theme Toggle */}
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-800 hover:text-yellow-400 text-slate-300 transition-all duration-200 focus:outline-none"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
