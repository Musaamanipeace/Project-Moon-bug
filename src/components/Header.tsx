import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Users,
  Tv,
  Gamepad2,
  Bell,
  User,
  LogOut,
  ChevronDown,
  BookOpen,
  Shield,
  Wifi,
  WifiOff,
  Wrench,
} from "lucide-react";
import { getLunarAge, getMoonPhaseDetails } from "../lib/lunar";

export type PrimaryTab = "home" | "activities" | "tribe" | "watchAds" | "tools";

interface HeaderProps {
  activeTab: PrimaryTab;
  onSelectTab: (tab: PrimaryTab) => void;
  onJumpToMoonClock: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenNotebook?: () => void;
  isOnline: boolean;
  nickname: string;
  avatarEmoji?: string;
  unreadCount?: number;
  onLogout: () => void;
}

export default function Header({
  activeTab,
  onSelectTab,
  onJumpToMoonClock,
  onOpenNotifications,
  onOpenProfile,
  onOpenNotebook,
  isOnline,
  nickname,
  avatarEmoji = "🌙",
  unreadCount = 0,
  onLogout,
}: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate live lunar phase from today's date
  const now = new Date();
  const lunarAge = getLunarAge(now);
  const currentPhase = getMoonPhaseDetails(lunarAge);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tabs: { id: PrimaryTab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Home", icon: <Sparkles className="w-4 h-4" /> },
    { id: "activities", label: "Activities", icon: <Gamepad2 className="w-4 h-4" /> },
    { id: "tools", label: "Tools", icon: <Wrench className="w-4 h-4" /> },
    { id: "tribe", label: "Tribe", icon: <Users className="w-4 h-4" /> },
    { id: "watchAds", label: "Watch Ads", icon: <Tv className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090a10]/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* LEFT: Project Moonrise logo/wordmark + active lunar-phase badge */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab("home")}
            className="flex items-center gap-2 text-left group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full border border-turquoise-500/30 bg-turquoise-500/10 flex items-center justify-center text-turquoise group-hover:border-turquoise-500/60 transition-colors">
              <span className="text-sm">🌑</span>
            </div>
            <span className="hidden sm:inline font-mono font-bold text-sm tracking-wider text-slate-100 group-hover:text-white transition-colors">
              Moonrise
            </span>
          </button>

          {/* Small active lunar-phase badge (clickable to jump straight to Moon Clock view) */}
          <button
            onClick={onJumpToMoonClock}
            title="Click to view 3D Moon Clock & celestial calendar"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-700/60 bg-slate-900/60 hover:border-turquoise-500/40 hover:bg-slate-800/80 text-[11px] font-mono text-slate-300 hover:text-turquoise transition-all cursor-pointer shadow-sm"
          >
            <span>{currentPhase.emoji}</span>
            <span className="hidden md:inline font-medium">{currentPhase.name}</span>
          </button>
        </div>

        {/* CENTER: 4 Primary Tabs (§1b) */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-medium transition-all ${
                  isActive
                    ? "bg-turquoise-500/15 text-turquoise border border-turquoise-500/40 shadow-[0_0_12px_rgba(79,209,197,0.15)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* RIGHT: User avatar/nickname, notifications bell, profile dropdown. No XP counter anywhere. */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Online connection indicator */}
          <div
            title={isOnline ? "Connected to Moonrise server" : "Offline mode"}
            className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-full border border-slate-800 bg-slate-900/40 text-[10px] font-mono text-slate-400"
          >
            {isOnline ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400">Live</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Notifications bell */}
          <button
            onClick={onOpenNotifications}
            title="Notifications"
            className="relative p-2 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-turquoise-500 text-slate-950 font-mono text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/80 text-slate-200 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs">
                {avatarEmoji}
              </div>
              <span className="hidden md:inline font-mono text-xs font-semibold max-w-[100px] truncate text-slate-200">
                {nickname || "Stargazer"}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-800 bg-[#0d0e17] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 font-mono text-xs">
                <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                  <span className="text-[10px] text-slate-500 uppercase block tracking-wider">
                    Signed in as
                  </span>
                  <span className="font-bold text-slate-200 truncate block">
                    {nickname || "Stargazer"}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenProfile();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-turquoise hover:bg-slate-800/60 transition-colors text-left"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profile &amp; Lunar Bio</span>
                </button>

                {onOpenNotebook && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenNotebook();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-turquoise hover:bg-slate-800/60 transition-colors text-left"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Personal Notebook</span>
                  </button>
                )}

                <div className="my-1 border-t border-slate-800/80" />

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
