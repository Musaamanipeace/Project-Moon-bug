import React, { useState, useEffect } from "react";
import {
  Sparkles, MapPin, Compass, Award, Mail, Calendar, HelpCircle,
  LogOut, RefreshCw, ArrowUpRight, Rss, Gamepad2, Users,
  Clock, FileText, BookOpen, Bell,
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
import PageTransition from "./components/PageTransition";
import { api } from "./lib/api";
import { supabase } from "./lib/supabase";
import { AstroEvent, Challenge } from "./types";
import LandingPage from "./components/LandingPage";
import NotificationsDashboard from "./components/NotificationsDashboard";

import "./lib/animations.css";

export type ParentTab = "home" | "activities" | "watchAds";
export type ActivitiesSubTab = "challenges" | "games" | "tribe" | "notes" | "meet" | "calendar" | "events" | "catalogues";

export default function App() {
  const [parentTab, setParentTab] = useState<ParentTab>("home");
  const [activitiesSubTab, setActivitiesSubTab] = useState<ActivitiesSubTab>("challenges");

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
    activities: "dynamic",
    watchAds: "cloudy",
  };
  const themeVariant = THEME_BY_TAB[parentTab] || "twilight";

  const activeDate = new Date();
  const lunarStatus = getLunarStatus(activeDate);

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
          />

          <Sidebar
            activeView={parentTab}
            onNavigate={setParentTab}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(v => !v)}
            activitiesSubTab={parentTab === "activities" ? activitiesSubTab : undefined}
            onActivitiesSubTabChange={setActivitiesSubTab}
          />

          <main className="flex-1 pb-24 overflow-x-hidden min-w-0">
            <PageTransition>
              {parentTab === "home" && (
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
                        onClick={() => setParentTab("activities")}
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

                  <RecommendationFeed onNavigateToView={(view) => {
                    if (view === "catalogues") setParentTab("activities");
                  }} />
                </div>
              )}

              {parentTab === "activities" && (
                <div className="space-y-6 px-4 py-4 max-w-6xl mx-auto">
                  <div className="flex flex-wrap gap-2 border-b border-slate-800/60 pb-3">
                    {([
                      { key: "challenges", label: "Challenges", icon: Award },
                      { key: "games", label: "Games", icon: Gamepad2 },
                      { key: "tribe", label: "Tribe", icon: Users },
                      { key: "notes", label: "Notebook", icon: FileText },
                      { key: "calendar", label: "Calendar", icon: Calendar },
                      { key: "events", label: "Events", icon: Compass },
                      { key: "catalogues", label: "Catalogues", icon: BookOpen },
                    ] as const).map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activitiesSubTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActivitiesSubTab(tab.key)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                            isActive
                              ? "bg-turquoise-500/10 border border-turquoise-500/30 text-turquoise"
                              : "border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/50"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {activitiesSubTab === "challenges" && (
                    <ChallengesDashboard onNavigateToView={setParentTab} onShareFeed={handleShareFeed} />
                  )}
                  {activitiesSubTab === "games" && (
                    <GamesDashboard onNavigateToView={setParentTab} onShareFeed={handleShareFeed} />
                  )}
                  {activitiesSubTab === "tribe" && (
                    <TribeDashboard nickname={nickname} onNavigateToView={setParentTab} />
                  )}
                  {activitiesSubTab === "notes" && (
                    <NotesWorkspace onNavigateToView={setParentTab} />
                  )}
                  {activitiesSubTab === "calendar" && (
                    <CalendarDashboard onNavigateToView={setParentTab} />
                  )}
                  {activitiesSubTab === "events" && (
                    <EventsDashboard
                      nickname={nickname}
                      onNavigateToView={setParentTab}
                      onShareFeed={handleShareFeed}
                    />
                  )}
                  {activitiesSubTab === "catalogues" && (
                    <CataloguesDashboard onNavigateToView={setParentTab} onShareFeed={handleShareFeed} />
                  )}
                </div>
              )}

              {parentTab === "watchAds" && (
                <AdvertiserDashboard
                  nickname={nickname}
                  onNavigateToView={setParentTab}
                  onShareFeed={handleShareFeed}
                />
              )}
            </PageTransition>
          </main>

          <nav className="fixed bottom-0 left-0 right-0 py-2 border-t border-slate-800/80 bg-[#0a0b10]/95 backdrop-blur-xl z-40 flex items-center justify-around shadow-2xl overflow-x-auto">
            <button
              onClick={() => setParentTab("home")}
              className={`flex flex-col items-center gap-1.5 text-[9px] font-mono font-bold transition-all duration-300 px-2 ${
                parentTab === "home" ? "text-turquoise" : "text-slate-200 hover:text-white"
              }`}
            >
              <span>Home</span>
            </button>

            <button
              onClick={() => setParentTab("activities")}
              className={`flex flex-col items-center gap-1.5 text-[9px] font-mono font-bold transition-all duration-300 px-2 ${
                parentTab === "activities" ? "text-turquoise" : "text-slate-200 hover:text-white"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Activities</span>
            </button>

            <button
              onClick={() => setParentTab("watchAds")}
              className={`flex flex-col items-center gap-1.5 text-[9px] font-mono font-bold transition-all duration-300 px-2 ${
                parentTab === "watchAds" ? "text-turquoise" : "text-slate-200 hover:text-white"
              }`}
            >
              <span>Watch Ads</span>
            </button>
          </nav>
        </>
      )}
    </div>
  );
}
