import React, { useState, useEffect } from "react";
import { Sun, Moon, Info, Sparkles, Wifi, WifiOff, LogOut, Bell, User, Settings, Tv, Megaphone, CalendarDays, Award, FileText, BookOpen, Gamepad2, Users, MessageSquare, HelpCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

import type { ParentTab } from "../App";

interface HeaderProps {
  activeView: ParentTab;
  isOnline: boolean;
  theme: "dark" | "light";
  onThemeToggle: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  nickname: string;
  onNavigateHome?: () => void;
}

export default function Header({ activeView, isOnline, theme, onThemeToggle, isLoggedIn, onLogout, nickname, onNavigateHome }: HeaderProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState("");

  const dashboardMap: Record<ParentTab, { title: string; desc: string; steps: string }> = {
    home: {
      title: "Home",
      desc: "Observe real-time celestial coordinates on our MoonDial and discover community recommendations.",
      steps: "Track lunar phases, browse paywall-free resources, or watch nature-conscious ads.",
    },
    watchAds: {
      title: "Watch Ads",
      desc: "Curated, nature-conscious and public-awareness campaigns. Earn Cheese for watching.",
      steps: "Browse the Watch shelf and earn Cheese for viewing ads.",
    },
    advertise: {
      title: "Advertise",
      desc: "Upload campaigns and track ad engagement, comments, and emoji reactions using Cheese tokens.",
      steps: "Upload a new campaign or manage existing ones from the Advertise dashboard.",
    },
    moondial: {
      title: "Moondial",
      desc: "Interactive 3D lunar clock and calendar. Track moonrise, zenith, moonset, and upcoming astro events.",
      steps: "Use the MoonDial to observe lunar coordinates, or browse the calendar for event dates.",
    },
    challenges: {
      title: "Challenges",
      desc: "Complete community challenges, play multiplayer games, connect with your tribe, and track your notebook.",
      steps: "Browse challenges, play games, or navigate to Games/Tribe via the overflow menu.",
    },
    portfolio: {
      title: "Portfolio",
      desc: "View your profile, rank, achievements, and shared personal feed. Manage possessions and interests.",
      steps: "Explore your profile sections using the navigation cards below.",
    },
    notebook: {
      title: "Notebook",
      desc: "Floatable daily planner, ideas, project tracking, and personal catalogues. Daytime writing mode.",
      steps: "Use the Daily Planner, capture ideas, manage projects, or archive challenge logs.",
    },
    catalogues: {
      title: "Catalogues",
      desc: "Community-curated lists of books, movies, courses, and products recommended by the tribe.",
      steps: "Browse categories, subscribe to items, or share your own catalogue entries.",
    },
    games: {
      title: "Games",
      desc: "Multiplayer games: a 3-hint AI phrase-guessing game and chess. Win streaks earn XP.",
      steps: "Reveal hints, guess phrases, or move chess pieces. Back to Challenges for more.",
    },
    tribe: {
      title: "Tribe",
      desc: "Your matched tribe members. The highest-Xp member becomes Ruler, forming an Empire.",
      steps: "Browse your tribe roster, view profiles, or chat with members.",
    },
    calendar: {
      title: "Calendar",
      desc: "Monthly calendar with lunar-phase highlights and upcoming astro events.",
      steps: "Navigate months, view event details, or jump to the Moondial.",
    },
    events: {
      title: "Events",
      desc: "Upcoming astronomical events and active community challenges. Add notes and comments.",
      steps: "Browse events and challenges, add comments, or share to your feed.",
    },
    notifications: {
      title: "Notifications",
      desc: "System, event, and challenge notifications. Stay updated on community activity.",
      steps: "Review all notifications and click through to relevant views.",
    },
    chat: {
      title: "Chat",
      desc: "Chat with the AI Companion or your Tribe. AI has a daily message cap.",
      steps: "Switch between AI and Tribe tabs, send messages, earn XP for participation.",
    },
    hello: {
      title: "Hello",
      desc: "Personal greeting and quick-access hub. Check your rank progress and tonight's sky.",
      steps: "Use the quick-access buttons to jump to Moondial, Challenges, Notebook, or Chat.",
    },
    findSomeoneLikeMe: {
      title: "Find Someone",
      desc: "Privacy-preserving matchmaking based on shared profile traits. XP-gated.",
      steps: "Browse matches, accept or reject users, and build your Tribe.",
    },
    recommendationFeed: {
      title: "Recommendations",
      desc: "Endless feed of community-recommended courses, videos, books, movies, and products.",
      steps: "Browse by category, subscribe or unsubscribe, or visit source links.",
    },
  };

  const currentContext = dashboardMap[activeView] || dashboardMap.home;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setOtpLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
      if (error) throw error;
      setOtpSent(true);
      setOtpSentMsg(`✓ Magic link sent to ${email}`);
      setTimeout(() => {
        setShowProfile(false);
        setOtpSent(false);
        setOtpSentMsg("");
      }, 3000);
    } catch (err) {
      console.error(err);
      setOtpSentMsg("Failed to send magic link. Try again.");
      setTimeout(() => setOtpSentMsg(""), 3000);
    }
    setOtpLoading(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".notifications-dropdown") && !target.closest(".bell-btn")) {
        setShowNotifications(false);
      }
      if (!target.closest(".profile-dropdown") && !target.closest(".profile-btn")) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#0a0b10]/80 dark:bg-[#0a0b10]/80 light:bg-slate-100/90 backdrop-blur-md transition-all duration-300">
      <div className="flex items-center gap-2 cursor-pointer group" onClick={onNavigateHome} title="Go to Home">
        <h1 className="text-xl font-bold font-mono tracking-wider text-slate-100 group-hover:text-white transition-colors duration-500 relative flex items-center gap-1">
          <span className="bg-gradient-to-r from-turquoise-200 via-turquoise-300 to-turquoise-500 bg-clip-text text-transparent">
            Project-moonrise
          </span>
        </h1>
      </div>

      <div className="relative">
        <button
          onMouseEnter={() => setShowPopover(true)}
          onMouseLeave={() => setShowPopover(false)}
          onClick={() => setShowPopover(!showPopover)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/60 dark:border-slate-700/60 light:border-slate-300 bg-slate-900/50 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-turquoise-500/10 text-xs font-semibold text-slate-200 transition-all duration-300 focus:outline-none"
        >
          <span>{currentContext.title}</span>
          <Info className="w-3.5 h-3.5 text-turquoise" />
        </button>

        {showPopover && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 p-3 rounded-xl border border-slate-700 bg-[#0c0d16] text-slate-200 shadow-2xl backdrop-blur-lg z-50 transition-all duration-300 animate-fade-in">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0c0d16] border-t border-l border-slate-700 rotate-45" />
            <h4 className="text-xs font-bold text-turquoise mb-1 font-mono uppercase tracking-wider">
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

      <div className="flex items-center gap-3">
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

        {isLoggedIn && (
          <div className="relative flex items-center gap-1">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="bell-btn p-1.5 rounded-lg text-slate-400 hover:text-turquoise hover:bg-slate-800/60 transition-all"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            {showNotifications && (
              <div className="notifications-dropdown absolute top-full right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-700 bg-[#0c0d16] shadow-2xl backdrop-blur-lg z-50">
                <div className="p-3 border-b border-slate-800">
                  <h3 className="text-xs font-mono font-bold text-turquoise uppercase tracking-wider">Notifications</h3>
                </div>
                <div className="p-3 space-y-2 text-[10px]">
                  <div className="p-2 rounded-lg border border-slate-800 bg-slate-900/40">
                    <span className="text-[9px] font-mono text-slate-400 uppercase block">Welcome</span>
                    <p className="text-slate-300">Welcome to Project Moonrise, {nickname || "explorer"}.</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowProfile(!showProfile)}
              className="profile-btn p-1.5 rounded-lg text-slate-400 hover:text-turquoise hover:bg-slate-800/60 transition-all"
              title="Profile"
            >
              <User className="w-4 h-4" />
            </button>

            {showProfile && (
              <div className="profile-dropdown absolute top-full right-0 mt-2 w-64 rounded-xl border border-slate-700 bg-[#0c0d16] shadow-2xl backdrop-blur-lg z-50">
                <div className="p-3 border-b border-slate-800">
                  <span className="text-xs font-mono text-slate-300 block">{nickname || "anonymous"}</span>
                  {otpSentMsg && <span className="text-[9px] font-mono text-turquoise-dim block mt-0.5">{otpSentMsg}</span>}
                </div>

                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="p-3 space-y-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-turquoise-500"
                    />
                    <button
                      type="submit"
                      disabled={otpLoading || !email.trim()}
                      className="w-full py-1.5 rounded-lg bg-turquoise-500 hover:bg-turquoise-400 text-slate-950 font-mono text-[10px] font-bold uppercase transition-all disabled:opacity-50"
                    >
                      {otpLoading ? "Sending..." : "Send Magic Link"}
                    </button>
                  </form>
                ) : (
                  <div className="p-3 text-[9px] font-mono text-slate-300">
                    Check your email for the magic link.
                  </div>
                )}

                <div className="border-t border-slate-800 p-2">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-400 hover:bg-red-950/30 font-mono text-xs uppercase transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onThemeToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-turquoise hover:bg-slate-800/60 transition-all"
          title="Toggle theme"
        >
          {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
