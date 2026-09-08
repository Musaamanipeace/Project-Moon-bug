import React, { useState, useEffect } from "react";
import {
  Sparkles, MapPin, Compass, Award, Mail, Calendar, HelpCircle,
  LogOut, RefreshCw, ArrowUpRight, Rss, Gamepad2, Users,
  Clock, FileText, BookOpen, Bell, Moon, Tv, Megaphone,
  MoreHorizontal, User, MessageSquare, CalendarDays,
} from "lucide-react";
import { getLunarStatus, getMoonPhaseDetails } from "./lib/lunar";
import { getSeason, getNextActiveEvent, getMoonRiseSetTimes } from "./lib/events";
import StarryBackground from "./components/StarryBackground";
import Header from "./components/Header";
import NotesWorkspace from "./components/NotesWorkspace";
import ProfileDashboard from "./components/ProfileDashboard";
import CalendarDashboard from "./components/CalendarDashboard";
import ChatDashboard from "./components/ChatDashboard";
import EventsDashboard from "./components/EventsDashboard";
import ChallengesDashboard from "./components/ChallengesDashboard";
import GamesDashboard from "./components/GamesDashboard";
import DialDashboard from "./components/DialDashboard";
import AdvertiserDashboard from "./components/AdvertiserDashboard";
import CataloguesDashboard from "./components/CataloguesDashboard";
import Sidebar from "./components/Sidebar";
import MeetPeople from "./components/MeetPeople";
import TribeDashboard from "./components/TribeDashboard";
import RecommendationFeed from "./components/RecommendationFeed";
import NotificationsDashboard from "./components/NotificationsDashboard";
import Hello from "./components/Hello";
import PageTransition from "./components/PageTransition";
import { api } from "./lib/api";
import { supabase } from "./lib/supabase";
import { AstroEvent, Challenge } from "./types";
import LandingPage from "./components/LandingPage";

import "./lib/animations.css";

export type ParentTab =
  | "home"
  | "watchAds"
  | "advertise"
  | "moondial"
  | "challenges"
  | "portfolio"
  | "notebook"
  | "catalogues"
  | "games"
  | "tribe"
  | "calendar"
  | "events"
  | "notifications"
  | "chat"
  | "hello"
  | "findSomeoneLikeMe"
  | "recommendationFeed";

const VIEW_TO_TAB: Record<string, ParentTab> = {
  home: "home",
  watchAds: "watchAds",
  advertise: "advertise",
  moondial: "moondial",
  dial: "moondial",
  challenges: "challenges",
  portfolio: "portfolio",
  profile: "portfolio",
  notebook: "notebook",
  notes: "notebook",
  catalogues: "catalogues",
  games: "games",
  tribe: "tribe",
  calendar: "calendar",
  events: "events",
  notifications: "notifications",
  chat: "chat",
  hello: "hello",
  findSomeoneLikeMe: "findSomeoneLikeMe",
  find: "findSomeoneLikeMe",
  meet: "findSomeoneLikeMe",
  recommendations: "recommendationFeed",
  recommendationFeed: "recommendationFeed",
};

export default function App() {
  const [parentTab, setParentTab] = useState<ParentTab>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState("");
  const [locationText, setLocationText] = useState("Nairobi, Kenya");
  const [birthDate, setBirthDate] = useState("1998-05-15");

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [recentEvents, setRecentEvents] = useState<AstroEvent[]>([]);
  const [recentChallenges, setRecentChallenges] = useState<Challenge[]>([]);

  const [liveTick, setLiveTick] = useState(0);
  const [showSun, setShowSun] = useState(true);
  const [showRealistic, setShowRealistic] = useState(true);
  const [notebookFloatOpen, setNotebookFloatOpen] = useState(false);

  const [xp, setXp] = useState(() => {
    try {
      const saved = localStorage.getItem("mb_xp");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const onAddXp = (amount: number) => {
    setXp((prev) => {
      const next = prev + amount;
      try { localStorage.setItem("mb_xp", String(next)); } catch {}
      return next;
    });
  };

  const onDeductXp = (amount: number) => {
    setXp((prev) => {
      const next = Math.max(0, prev - amount);
      try { localStorage.setItem("mb_xp", String(next)); } catch {}
      return next;
    });
  };

  const handleNavigateToView = (view: string) => {
    const target = VIEW_TO_TAB[view] || "home";
    setParentTab(target);
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.nickname) {
          setNickname(user.user_metadata.nickname);
        } else if (user?.email) {
          setNickname(user.email.split("@")[0]);
        }

        const savedLoc = localStorage.getItem("mb_location");
        const savedBirth = localStorage.getItem("mb_birthdate");
        if (savedLoc) setLocationText(savedLoc);
        if (savedBirth) setBirthDate(savedBirth);

        fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nickname: user?.email?.split("@")[0] || "user", activePhase: getLunarStatus(new Date()).phase.name })
        }).catch(() => {});
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      }
    });

    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    const savedTheme = localStorage.getItem("mb_theme") as "dark" | "light";
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }

    fetch("/api/events")
      .then(res => res.json())
      .then(data => setRecentEvents(data.slice(0, 3)))
      .catch(() => {});

    fetch("/api/challenges")
      .then(res => res.json())
      .then(data => setRecentChallenges(data.slice(0, 3)))
      .catch(() => {});

    const eventSource = new EventSource("/api/stream");
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "users_list") {
          setOnlineUsers(payload.data);
        }
      } catch {}
    };

    const interval = setInterval(() => {
      setLiveTick(t => t + 1);
    }, 15000);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      eventSource.close();
      clearInterval(interval);
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleThemeToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("mb_theme", nextTheme);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("mb_nickname");
    setIsLoggedIn(false);
    setNickname("");
  };

  const handleShareFeed = (entry: {
    kind: any; title?: string; body?: string; refId?: string; refType?: string; experience?: string;
  }) => {
    const item = { author: nickname, ...entry };
    try {
      const cached = JSON.parse(localStorage.getItem("mb_feed") || "[]");
      cached.unshift({ id: `local-${Date.now()}`, timestamp: new Date().toISOString(), ...item });
      if (cached.length > 200) cached.pop();
      localStorage.setItem("mb_feed", JSON.stringify(cached));
    } catch {}
    api.postFeed(item).catch(() => {});
  };

  const THEME_BY_TAB: Record<string, string> = {
    home: "twilight",
    watchAds: "cloudy",
    advertise: "cloudy",
    moondial: "twilight",
    challenges: "dynamic",
    portfolio: "night",
    notebook: "daytime",
    catalogues: "dynamic",
    games: "dynamic",
    tribe: "dynamic",
    calendar: "twilight",
    events: "dynamic",
    notifications: "twilight",
    chat: "twilight",
    hello: "twilight",
    findSomeoneLikeMe: "twilight",
    recommendationFeed: "twilight",
  };
  const themeVariant = THEME_BY_TAB[parentTab] || "twilight";

  const activeDate = new Date();
  const lunarStatus = getLunarStatus(activeDate);

  const handleBackToHome = () => setParentTab("home");

  const BOTTOM_NAV_VISIBLE: { id: ParentTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "home", label: "Home", icon: Sparkles },
    { id: "watchAds", label: "Watch Ads", icon: Tv },
    { id: "advertise", label: "Advertise", icon: Megaphone },
    { id: "moondial", label: "Moondial", icon: Moon },
    { id: "challenges", label: "Challenges", icon: Award },
    { id: "portfolio", label: "Portfolio", icon: User },
    { id: "notebook", label: "Notebook", icon: FileText },
    { id: "catalogues", label: "Catalogues", icon: BookOpen },
  ];

  const OVERFLOW_ITEMS: { id: ParentTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "tribe", label: "Tribe", icon: Users },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "events", label: "Events", icon: Compass },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "hello", label: "Hello", icon: HelpCircle },
    { id: "findSomeoneLikeMe", label: "Find Someone", icon: Users },
    { id: "recommendationFeed", label: "Recommendations", icon: Rss },
  ];

  const renderMainContent = () => {
    switch (parentTab) {
      case "home":
        return (
          <div className="space-y-8 px-4 py-4 max-w-5xl mx-auto">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6">
              <div className="space-y-3">
                <h2 className="text-base font-bold font-mono text-turquoise uppercase tracking-wider">
                  Discover paywall-free resources, recommended by people.
                </h2>
                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  Highlighted community picks and free advertising — find courses, videos, books, movies and products without paywalls.
                </p>
                <button
                  onClick={() => setParentTab("recommendationFeed")}
                  className="px-4 py-2 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Browse Recommendations &rarr;
                </button>
              </div>
            </section>

            <DialDashboard
              locationText={locationText}
              birthDate={birthDate}
              nickname={nickname}
            />

            <RecommendationFeed onNavigateToView={handleNavigateToView} />
          </div>
        );

      case "watchAds":
      case "advertise":
        return (
          <AdvertiserDashboard
            xp={xp}
            onAddXp={onAddXp}
            nickname={nickname}
            onNavigateToView={handleNavigateToView}
            onShareFeed={handleShareFeed}
          />
        );

      case "moondial":
        return (
          <div className="space-y-6 px-4 py-4 max-w-6xl mx-auto">
            <DialDashboard
              locationText={locationText}
              birthDate={birthDate}
              nickname={nickname}
            />
            <CalendarDashboard onNavigateToView={handleNavigateToView} />
          </div>
        );

      case "challenges":
        return (
          <div className="px-4 py-4 max-w-6xl mx-auto">
            <ChallengesDashboard
              onNavigateToView={handleNavigateToView}
              onShareFeed={handleShareFeed}
            />
            <div className="mt-6 text-center">
              <button
                onClick={() => setParentTab("games")}
                className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-turquoise-500/40 text-turquoise font-mono text-xs font-bold transition-all"
              >
                <Gamepad2 className="w-3.5 h-3.5 inline mr-1" />
                Or play multiplayer games
              </button>
            </div>
          </div>
        );

      case "portfolio":
        return (
          <div className="px-4 py-4 max-w-6xl mx-auto">
            <ProfileDashboard
              nickname={nickname}
              onChangeNickname={setNickname}
              xp={xp}
              onAddXp={onAddXp}
              onNavigateToView={handleNavigateToView}
            />
          </div>
        );

      case "notebook":
        return (
          <div className="px-4 py-4 max-w-6xl mx-auto">
            <NotesWorkspace xp={xp} onAddXp={onAddXp} onNavigateToView={handleNavigateToView} />
          </div>
        );

      case "catalogues":
        return (
          <div className="px-4 py-4 max-w-6xl mx-auto">
            <CataloguesDashboard onNavigateToView={handleNavigateToView} onShareFeed={handleShareFeed} />
          </div>
        );

      case "games":
        return (
          <div className="px-4 py-4 max-w-6xl mx-auto">
            <GamesDashboard
              xp={xp}
              onAddXp={onAddXp}
              onNavigateToView={handleNavigateToView}
              onShareFeed={handleShareFeed}
            />
          </div>
        );

      case "tribe":
        return (
          <div className="px-4 py-4 max-w-6xl mx-auto">
            <TribeDashboard nickname={nickname} xp={xp} onNavigateToView={handleNavigateToView} />
          </div>
        );

      case "calendar":
        return (
          <div className="px-4 py-4 max-w-6xl mx-auto">
            <CalendarDashboard onNavigateToView={handleNavigateToView} />
          </div>
        );

      case "events":
        return (
          <div className="px-4 py-4 max-w-6xl mx-auto">
            <EventsDashboard
              nickname={nickname}
              onAddXp={onAddXp}
              isOnline={isOnline}
              onNavigateToView={handleNavigateToView}
              onShareFeed={handleShareFeed}
            />
          </div>
        );

      case "notifications":
        return (
          <div className="px-4 py-4 max-w-6xl mx-auto">
            <NotificationsDashboard
              events={recentEvents}
              challenges={recentChallenges}
              nickname={nickname}
            />
          </div>
        );

      case "chat":
        return (
          <div className="px-4 py-4 max-w-6xl mx-auto">
            <ChatDashboard
              nickname={nickname}
              xp={xp}
              onAddXp={onAddXp}
              onDeductXp={onDeductXp}
              onNavigateToView={handleNavigateToView}
            />
          </div>
        );

      case "hello":
        return (
          <div className="px-4 py-4 max-w-6xl mx-auto">
            <Hello nickname={nickname} xp={xp} onNavigateToView={handleNavigateToView} />
          </div>
        );

      case "findSomeoneLikeMe":
        return (
          <div className="px-4 py-4 max-w-6xl mx-auto">
            <MeetPeople nickname={nickname} onNavigateToView={handleNavigateToView} />
          </div>
        );

      case "recommendationFeed":
        return (
          <div className="px-4 py-4 max-w-6xl mx-auto">
            <RecommendationFeed onNavigateToView={handleNavigateToView} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`app-scale-root min-h-screen text-slate-100 flex flex-col font-sans transition-colors duration-300 ${theme}`}>
      {!isLoggedIn ? (
        <LandingPage onExplorePublic={() => {
          setIsLoggedIn(true);
          setNickname("astral_traveler");
        }} />
      ) : (
        <>
          <StarryBackground />
          <div className={`fixed inset-0 pointer-events-none theme-${themeVariant}`} style={{ zIndex: -9 }} />

          <Header
            activeView={parentTab}
            isOnline={isOnline}
            theme={theme}
            onThemeToggle={handleThemeToggle}
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
            nickname={nickname}
            onNavigateHome={handleBackToHome}
          />

          <div className="flex flex-1 overflow-hidden">
            <Sidebar
              activeView={parentTab}
              onNavigateToView={handleNavigateToView}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(v => !v)}
            />

            <main className="flex-1 pb-24 overflow-y-auto overflow-x-hidden min-w-0">
              <PageTransition>
                {renderMainContent()}
              </PageTransition>
            </main>
          </div>

          {parentTab !== "notebook" && (
            <button
              onClick={() => setNotebookFloatOpen(true)}
              className="fixed bottom-24 right-4 z-40 p-3 rounded-full border border-slate-700/50 bg-slate-900/60 hover:bg-turquoise-500/20 text-turquoise transition-all duration-300 group"
              title="Float Notebook"
            >
              <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 px-2 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Float Notebook
              </span>
            </button>
          )}

          {notebookFloatOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="relative w-full max-w-5xl max-h-[90dvh] bg-[#e8f0f0] rounded-3xl border border-slate-300/40 shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-3 border-b border-slate-300/40 bg-[#e8f0f0]/80">
                  <span className="text-xs font-mono text-slate-600 flex items-center gap-1">
                    <FileText className="w-4 h-4 text-turquoise" />
                    Notebook — Floating Mode
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNotebookFloatOpen(false)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-turquoise hover:bg-turquoise-500/10 transition-all"
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  <NotesWorkspace xp={xp} onAddXp={onAddXp} onNavigateToView={handleNavigateToView} />
                </div>
              </div>
            </div>
          )}

          <nav className="fixed bottom-0 left-0 right-0 py-2 border-t border-slate-800/80 bg-[#0a0b10]/95 backdrop-blur-xl z-40 shadow-2xl overflow-x-auto">
            <div className="flex items-center justify-around max-w-6xl mx-auto">
              {BOTTOM_NAV_VISIBLE.map((item) => {
                const Icon = item.icon;
                const isActive = parentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setParentTab(item.id)}
                    className={`flex flex-col items-center gap-1.5 text-[9px] font-mono font-bold transition-all duration-300 px-2 min-w-[60px] ${
                      isActive ? "text-turquoise" : "text-slate-200 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <OverflowMenu
                items={OVERFLOW_ITEMS}
                activeTab={parentTab}
                onSelect={(id) => setParentTab(id)}
              />
            </div>
          </nav>
        </>
      )}
    </div>
  );
}

function OverflowMenu({
  items,
  activeTab,
  onSelect,
}: {
  items: { id: ParentTab; label: string; icon: React.ComponentType<{ className?: string }> }[];
  activeTab: ParentTab;
  onSelect: (id: ParentTab) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex flex-col items-center gap-1.5 text-[9px] font-mono font-bold transition-all duration-300 px-2 min-w-[50px] ${
          open ? "text-turquoise" : "text-slate-200 hover:text-white"
        }`}
      >
        <MoreHorizontal className="w-4 h-4" />
        <span>More</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 w-48 rounded-xl border border-slate-800 bg-[#0c0d16]/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-1.5 space-y-0.5 max-h-80 overflow-y-auto">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelect(item.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-xs font-mono ${
                      isActive
                        ? "bg-turquoise-500/10 text-turquoise border border-turquoise-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
