import React, { useState, useEffect } from "react";
import Header, { PrimaryTab } from "./components/Header";
import LandingPage from "./components/LandingPage";
import HomeFeed from "./components/HomeFeed";
import ActivitiesView from "./components/ActivitiesView";
import TribeDashboard from "./components/TribeDashboard";
import AdvertiserDashboard from "./components/AdvertiserDashboard";
import ProfileDashboard from "./components/ProfileDashboard";
import NotesWorkspace from "./components/NotesWorkspace";
import NotificationsDashboard from "./components/NotificationsDashboard";
import ToolsView, { ToolSubtab } from "./components/ToolsView";
import PageTransition from "./components/PageTransition";
import { supabase } from "./lib/supabase";
import { api } from "./lib/api";
import { AstroEvent, Challenge } from "./types";
import { FileText, X } from "lucide-react";

import "./lib/animations.css";

export type AppView =
  | "home"
  | "activities"
  | "tools"
  | "tribe"
  | "watchAds"
  | "profile"
  | "notifications"
  | "notebook";

export type ParentTab = AppView | string;

export default function App() {
  const [activeTab, setActiveTab] = useState<AppView>("home");
  const [activitiesSubtab, setActivitiesSubtab] = useState<"challenges" | "games" | "moon-clock">("challenges");
  const [toolsSubtab, setToolsSubtab] = useState<ToolSubtab>("catalogues");
  const [isOnline, setIsOnline] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const [recentEvents, setRecentEvents] = useState<AstroEvent[]>([]);
  const [recentChallenges, setRecentChallenges] = useState<Challenge[]>([]);

  const [notebookFloatOpen, setNotebookFloatOpen] = useState(false);

  // Check Supabase session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsLoggedIn(true);
          const { data: { user } } = await supabase.auth.getUser();
          const userNick =
            user?.user_metadata?.nickname ||
            (user?.email ? user.email.split("@")[0] : "stargazer");
          setNickname(userNick);
          localStorage.setItem("mb_nickname", userNick);
        } else {
          const cachedNick = localStorage.getItem("mb_nickname");
          if (cachedNick) {
            setNickname(cachedNick);
            setIsLoggedIn(true);
          }
        }
      } catch (e) {
        console.warn("Session check error:", e);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsLoggedIn(true);
        const user = session.user;
        const userNick =
          user?.user_metadata?.nickname ||
          (user?.email ? user.email.split("@")[0] : "stargazer");
        setNickname(userNick);
        localStorage.setItem("mb_nickname", userNick);
      } else if (event === "SIGNED_OUT") {
        setIsLoggedIn(false);
        setNickname("");
        localStorage.removeItem("mb_nickname");
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

    // Fetch initial notifications data
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRecentEvents(data.slice(0, 3));
      })
      .catch(() => {});

    fetch("/api/challenges")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRecentChallenges(data.slice(0, 3));
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem("mb_nickname");
    setIsLoggedIn(false);
    setNickname("");
  };

  const handleNavigateToView = (view: string) => {
    const v = view.toLowerCase();
    if (v === "games") {
      setActiveTab("activities");
      setActivitiesSubtab("games");
    } else if (v === "challenges") {
      setActiveTab("activities");
      setActivitiesSubtab("challenges");
    } else if (v === "moon-clock" || v === "moondial" || v === "dial" || v === "calendar" || v === "events") {
      setActiveTab("activities");
      setActivitiesSubtab("moon-clock");
    } else if (v === "activities") {
      setActiveTab("activities");
    } else if (v === "tools" || v === "catalogues" || v === "catalogue") {
      setActiveTab("tools");
      setToolsSubtab("catalogues");
    } else if (v === "chat") {
      setActiveTab("tools");
      setToolsSubtab("chat");
    } else if (v === "notebook" || v === "notes") {
      setActiveTab("tools");
      setToolsSubtab("notebook");
    } else if (v === "tribe" || v === "meet" || v === "findsomeonelikeme") {
      setActiveTab("tribe");
    } else if (v === "watchads" || v === "ads" || v === "advertise") {
      setActiveTab("watchAds");
    } else if (v === "profile" || v === "portfolio") {
      setActiveTab("profile");
    } else if (v === "notifications") {
      setActiveTab("notifications");
    } else {
      setActiveTab("home");
    }
  };

  const handleShareFeed = (entry: {
    kind: any;
    title?: string;
    body?: string;
    refId?: string;
    refType?: string;
    experience?: string;
  }) => {
    const item = { author: nickname || "stargazer", ...entry };
    api.postFeed(item).catch(() => {});
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case "home":
        return <HomeFeed nickname={nickname} onNavigateToView={handleNavigateToView} />;

      case "activities":
        return (
          <ActivitiesView
            nickname={nickname}
            initialSubtab={activitiesSubtab}
            onNavigateToView={handleNavigateToView}
            onShareFeed={handleShareFeed}
          />
        );

      case "tools":
        return (
          <ToolsView
            nickname={nickname}
            initialSubtab={toolsSubtab}
            onNavigateToView={handleNavigateToView}
            onShareFeed={handleShareFeed}
          />
        );

      case "tribe":
        return <TribeDashboard nickname={nickname} onNavigateToView={handleNavigateToView} />;

      case "watchAds":
        return <AdvertiserDashboard onNavigateToView={handleNavigateToView} />;

      case "profile":
        return (
          <div className="max-w-6xl mx-auto px-4 py-6">
            <ProfileDashboard
              nickname={nickname}
              onChangeNickname={(name) => {
                setNickname(name);
                localStorage.setItem("mb_nickname", name);
              }}
              onNavigateToView={handleNavigateToView}
            />
          </div>
        );

      case "notebook":
        return (
          <div className="max-w-6xl mx-auto px-4 py-6">
            <NotesWorkspace onNavigateToView={handleNavigateToView} />
          </div>
        );

      case "notifications":
        return (
          <div className="max-w-4xl mx-auto px-4 py-6">
            <NotificationsDashboard
              events={recentEvents}
              challenges={recentChallenges}
              nickname={nickname}
            />
          </div>
        );

      default:
        return <HomeFeed nickname={nickname} onNavigateToView={handleNavigateToView} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#07080f] text-slate-100 flex flex-col font-sans selection:bg-turquoise-500/30 selection:text-turquoise">
      {!isLoggedIn ? (
        <LandingPage
          onExplorePublic={() => {
            const guest = "astral_traveler";
            setNickname(guest);
            localStorage.setItem("mb_nickname", guest);
            setIsLoggedIn(true);
          }}
          onLoginSuccess={(user) => {
            const nick =
              user?.user_metadata?.nickname ||
              (user?.email ? user.email.split("@")[0] : "stargazer");
            setNickname(nick);
            localStorage.setItem("mb_nickname", nick);
            setIsLoggedIn(true);
          }}
        />
      ) : (
        <>
          {/* Top-Level Navigation Header */}
          <Header
            activeTab={
              activeTab === "home" ||
              activeTab === "activities" ||
              activeTab === "tools" ||
              activeTab === "tribe" ||
              activeTab === "watchAds"
                ? activeTab
                : "home"
            }
            onSelectTab={(tab: PrimaryTab) => {
              setActiveTab(tab);
              if (tab === "activities") {
                setActivitiesSubtab("challenges");
              } else if (tab === "tools") {
                setToolsSubtab("catalogues");
              }
            }}
            onJumpToMoonClock={() => {
              setActiveTab("activities");
              setActivitiesSubtab("moon-clock");
            }}
            onOpenNotifications={() => setActiveTab("notifications")}
            onOpenProfile={() => setActiveTab("profile")}
            onOpenNotebook={() => setActiveTab("notebook")}
            isOnline={isOnline}
            nickname={nickname || "Stargazer"}
            unreadCount={unreadCount}
            onLogout={handleLogout}
          />

          {/* Main Content Area */}
          <main className="flex-1 pb-20 overflow-y-auto overflow-x-hidden min-w-0">
            <PageTransition>{renderActiveView()}</PageTransition>
          </main>

          {/* Floating Personal Notebook Trigger (§1b / §6) */}
          {activeTab !== "notebook" && (
            <button
              onClick={() => setNotebookFloatOpen(true)}
              className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full border border-slate-700/60 bg-slate-900/80 hover:bg-turquoise-500 hover:text-slate-950 text-turquoise transition-all duration-300 shadow-xl backdrop-blur-md group"
              title="Quick Floating Notebook"
            >
              <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="sr-only">Open Notebook</span>
            </button>
          )}

          {/* Floating Notebook Modal */}
          {notebookFloatOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="relative w-full max-w-5xl max-h-[90dvh] bg-[#e8f0f0] rounded-3xl border border-slate-300/40 shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-3.5 border-b border-slate-300/40 bg-[#e8f0f0]/90">
                  <span className="text-xs font-mono font-bold text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-turquoise" />
                    Personal Notebook &bull; Floating Mode
                  </span>
                  <button
                    onClick={() => setNotebookFloatOpen(false)}
                    className="p-1.5 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-300/40 transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  <NotesWorkspace onNavigateToView={handleNavigateToView} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
