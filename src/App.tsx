import React, { useState, useEffect } from "react";
import { Sparkles, MapPin, Compass, Award, Mail, Calendar, HelpCircle, Bot, LogOut, ArrowUpRight } from "lucide-react";
import { getLunarStatus, getCyclesSinceBirth, getMoonPhaseDetails } from "./lib/lunar";
import StarryBackground from "./components/StarryBackground";
import Header from "./components/Header";
import NotesWorkspace from "./components/NotesWorkspace";
import ProfileDashboard from "./components/ProfileDashboard";
import CalendarDashboard from "./components/CalendarDashboard";
import ChatDashboard from "./components/ChatDashboard";
import EventsDashboard from "./components/EventsDashboard";
import { AstroEvent, Challenge, OnlineUser } from "./types";

export default function App() {
  const [activeView, setActiveView] = useState<"home" | "notes" | "profile" | "calendar" | "chat" | "events">("home");
  const [isOnline, setIsOnline] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // User Authentication State
  const [isLoggedIn, setIsOnlineLoggedIn] = useState(false);
  const [nickname, setNickname] = useState("");
  const [locationText, setLocationText] = useState("Nairobi, Kenya");
  const [birthDate, setBirthDate] = useState("1998-05-15");

  // App metrics & XP state (persisted in localStorage)
  const [xp, setXp] = useState(30);

  // Dial Options
  const [showSun, setShowSun] = useState(true);
  const [showRealistic, setShowRealistic] = useState(true);

  // Lists fetched from server
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [recentEvents, setRecentEvents] = useState<AstroEvent[]>([]);
  const [recentChallenges, setRecentChallenges] = useState<Challenge[]>([]);

  // Detailed modal integration from home view highlights
  const [selectedHomeItem, setSelectedHomeItem] = useState<{ type: "event" | "challenge"; data: any } | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Newsletter subscribe
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribedMsg, setSubscribedMsg] = useState("");

  // Astronomical status based on system current time
  const [lunarStatus, setLunarStatus] = useState(getLunarStatus(new Date()));

  // 1. Initial boots & listeners
  useEffect(() => {
    // Sync browser online status
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    // Sync theme from localStorage
    const savedTheme = localStorage.getItem("mb_theme") as "dark" | "light";
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }

    // Sync user session details
    const savedName = localStorage.getItem("mb_nickname");
    const savedLoc = localStorage.getItem("mb_location");
    const savedBirth = localStorage.getItem("mb_birthdate");
    const savedXp = localStorage.getItem("mb_xp");

    if (savedName) {
      setNickname(savedName);
      setIsOnlineLoggedIn(true);
      // Trigger login to backend on boot
      fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: savedName, activePhase: getLunarStatus(new Date()).phase.name })
      }).catch(err => console.error("Auto login error:", err));
    }

    if (savedLoc) setLocationText(savedLoc);
    if (savedBirth) setBirthDate(savedBirth);
    if (savedXp) setXp(parseInt(savedXp));

    // Dynamic fetch of events & challenges highlights
    fetch("/api/events")
      .then(res => res.json())
      .then(data => setRecentEvents(data.slice(0, 3)))
      .catch(err => console.error(err));

    fetch("/api/challenges")
      .then(res => res.json())
      .then(data => setRecentChallenges(data.slice(0, 3)))
      .catch(err => console.error(err));

    // SSE Stream connection
    const eventSource = new EventSource("/api/stream");
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "users_list") {
          setOnlineUsers(payload.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    // Update lunar physics calculations every minute
    const lunarTimer = setInterval(() => {
      setLunarStatus(getLunarStatus(new Date()));
    }, 60000);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      eventSource.close();
      clearInterval(lunarTimer);
    };
  }, []);

  const handleAddXp = (amount: number) => {
    const nextXp = xp + amount;
    setXp(nextXp);
    localStorage.setItem("mb_xp", nextXp.toString());
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("mb_theme", nextTheme);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    localStorage.setItem("mb_nickname", nickname.trim());
    localStorage.setItem("mb_location", locationText.trim());
    localStorage.setItem("mb_birthdate", birthDate);
    setIsOnlineLoggedIn(true);

    try {
      await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim(),
          activePhase: lunarStatus.phase.name
        })
      });
      handleAddXp(20); // login award
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname })
      });
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem("mb_nickname");
    setIsOnlineLoggedIn(false);
    setNickname("");
  };

  const handleNewsletterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribedMsg("✓ Subscription successful! Connecting skies...");
    setNewsletterEmail("");
    handleAddXp(15);
    setTimeout(() => setSubscribedMsg(""), 4000);
  };

  // Calculate moon birth details dynamically
  const birthDateObj = birthDate ? new Date(birthDate) : null;
  const userBirthAge = birthDateObj ? getLunarStatus(birthDateObj).age : 0;
  const userBirthPhase = birthDateObj ? getMoonPhaseDetails(userBirthAge) : null;
  const birthCycles = birthDateObj ? getCyclesSinceBirth(birthDateObj, new Date()) : 0;

  // Generate 24 sampler points for trajectories
  const baseDate = new Date();
  const sunPoints: [number, number][] = [];
  const moonPoints: [number, number][] = [];

  for (let h = 0; h <= 24; h++) {
    const tempDate = new Date(baseDate);
    tempDate.setHours(h, 0, 0, 0);
    const status = getLunarStatus(tempDate);
    
    const x = (h / 24) * 1000;
    const sAngleRad = (status.sunAngle * Math.PI) / 180;
    const sY = 500 - 300 * Math.sin(sAngleRad);
    sunPoints.push([x, sY]);

    const mAngleRad = ((status.sunAngle - status.moonAngle) * Math.PI) / 180;
    const mY = 500 - 300 * Math.sin(mAngleRad);
    moonPoints.push([x, mY]);
  }

  const sunPath = `M ${sunPoints.map(p => `${p[0]},${p[1]}`).join(" L ")}`;
  const moonPath = `M ${moonPoints.map(p => `${p[0]},${p[1]}`).join(" L ")}`;

  // Active positions based on current progress of the day
  const currentHourDecimal = baseDate.getHours() + baseDate.getMinutes() / 60;
  const activeSunX = (currentHourDecimal / 24) * 1000;
  const activeSunY = 500 - 300 * Math.sin((lunarStatus.sunAngle * Math.PI) / 180);

  const activeMoonX = (currentHourDecimal / 24) * 1000;
  const activeMoonY = 500 - 300 * Math.sin(((lunarStatus.sunAngle - lunarStatus.moonAngle) * Math.PI) / 180);

  return (
    <div className={`min-h-screen text-slate-100 flex flex-col font-sans transition-colors duration-300 ${theme}`}>
      {/* Background Starry Nebula Canvas */}
      <StarryBackground />

      {/* Persistent Polish Header */}
      <Header
        activeView={activeView}
        isOnline={isOnline}
        theme={theme}
        onThemeToggle={handleThemeToggle}
      />

      {/* 1. AUTH LOGIN IDENTITY MODAL */}
      {!isLoggedIn && (
        <div className="fixed inset-0 bg-[#000000]/85 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700/80 bg-[#0a0b12] p-6 shadow-2xl relative">
            <div className="flex flex-col items-center text-center gap-2 mb-4">
              <div className="relative">
                <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse" />
              </div>
              <h2 className="text-lg font-bold font-mono text-slate-100">Welcome to Moonbug</h2>
              <p className="text-xs text-slate-400">Enter your birth date and lunar nickname to begin your astral diary.</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Cosmic Nickname</label>
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g., Starseeker-99"
                  className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Coarse Location</label>
                <input
                  type="text"
                  required
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="e.g., Nairobi, Kenya"
                  className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Birth Date</label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-colors duration-300 shadow-lg shadow-yellow-500/10"
              >
                Enter Lunar Workspace
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. MAIN ACTIVE VIEW RENDERER */}
      <main className="flex-1 pb-24 overflow-x-hidden">
        {isLoggedIn && (
          <>
            {/* VIEW A: HOME VIEW (MAIN DIAL) */}
            {activeView === "home" && (
              <div className="space-y-6 px-4 py-4 max-w-5xl mx-auto">
                {/* 1. Dial Section */}
                <section className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3 mb-4">
                    <div>
                      <h2 className="text-sm font-bold font-mono text-yellow-400 uppercase tracking-wider">
                        🌙 Celestial Moon Dial & Horizon Wave Viewport
                      </h2>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Location Coordinated: {locationText}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSun(!showSun)}
                        className={`px-3 py-1 rounded-lg border text-[10px] font-mono font-bold transition-colors ${
                          showSun ? "border-yellow-500 bg-yellow-500/10 text-yellow-300" : "border-slate-800 bg-slate-950 text-slate-500"
                        }`}
                      >
                        ☀️ Sun Toggle
                      </button>
                      <button
                        onClick={() => setShowRealistic(!showRealistic)}
                        className={`px-3 py-1 rounded-lg border text-[10px] font-mono font-bold transition-colors ${
                          showRealistic ? "border-yellow-500 bg-yellow-500/10 text-yellow-300" : "border-slate-800 bg-slate-950 text-slate-500"
                        }`}
                      >
                        🌕 Realistic View
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Horizontal Wave Viewport */}
                    <div className="relative aspect-square w-full max-w-[320px] sm:max-w-[360px] md:max-w-full bg-[#05060b] border border-slate-800 rounded-2xl mx-auto shadow-2xl flex items-center justify-center overflow-hidden p-2">
                      {/* Eclipse warning banner */}
                      {lunarStatus.isEclipse && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
                          <span className="px-2 py-0.5 rounded border border-red-500 bg-red-950/80 text-red-400 text-[8px] font-mono font-bold uppercase animate-pulse">
                            Solar Eclipse In Alignment
                          </span>
                        </div>
                      )}

                      <svg viewBox="0 0 1000 1000" className="w-full h-full text-slate-500">
                        {/* Grid lines for coordinate precision */}
                        <line x1="100" y1="0" x2="100" y2="1000" stroke="#11131f" strokeWidth="1" strokeDasharray="5,5" />
                        <line x1="200" y1="0" x2="200" y2="1000" stroke="#11131f" strokeWidth="1" strokeDasharray="5,5" />
                        <line x1="300" y1="0" x2="300" y2="1000" stroke="#11131f" strokeWidth="1" strokeDasharray="5,5" />
                        <line x1="400" y1="0" x2="400" y2="1000" stroke="#11131f" strokeWidth="1" strokeDasharray="5,5" />
                        <line x1="500" y1="0" x2="500" y2="1000" stroke="#11131f" strokeWidth="1" strokeDasharray="5,5" />
                        <line x1="600" y1="0" x2="600" y2="1000" stroke="#11131f" strokeWidth="1" strokeDasharray="5,5" />
                        <line x1="700" y1="0" x2="700" y2="1000" stroke="#11131f" strokeWidth="1" strokeDasharray="5,5" />
                        <line x1="800" y1="0" x2="800" y2="1000" stroke="#11131f" strokeWidth="1" strokeDasharray="5,5" />
                        <line x1="900" y1="0" x2="900" y2="1000" stroke="#11131f" strokeWidth="1" strokeDasharray="5,5" />
                        
                        <line x1="0" y1="200" x2="1000" y2="200" stroke="#11131f" strokeWidth="1" strokeDasharray="5,5" />
                        <line x1="0" y1="350" x2="1000" y2="350" stroke="#11131f" strokeWidth="1" strokeDasharray="5,5" />
                        <line x1="0" y1="650" x2="1000" y2="650" stroke="#11131f" strokeWidth="1" strokeDasharray="5,5" />
                        <line x1="0" y1="800" x2="1000" y2="800" stroke="#11131f" strokeWidth="1" strokeDasharray="5,5" />

                        {/* Static Yellow Horizon dividing line */}
                        <line x1="0" y1="500" x2="1000" y2="500" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />

                        {/* Rise and Set labels */}
                        <text x="30" y="470" fill="#f59e0b" fontSize="22" fontWeight="bold" fontFamily="monospace">
                          Rise (East)
                        </text>
                        <text x="970" y="470" fill="#f59e0b" fontSize="22" fontWeight="bold" fontFamily="monospace" textAnchor="end">
                          Set (West)
                        </text>

                        {/* Smooth trajectory lines */}
                        {/* Sun's blue path wave */}
                        {showSun && (
                          <>
                            {/* Path glow */}
                            <path d={sunPath} stroke="#60a5fa" strokeWidth="8" fill="none" opacity="0.15" strokeLinecap="round" strokeLinejoin="round" />
                            <path d={sunPath} stroke="#60a5fa" strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round" strokeLinejoin="round" />
                          </>
                        )}

                        {/* Moon's blue path wave */}
                        <path d={moonPath} stroke="#3b82f6" strokeWidth="8" fill="none" opacity="0.15" strokeLinecap="round" strokeLinejoin="round" />
                        <path d={moonPath} stroke="#3b82f6" strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Active indicator nodes */}
                        {/* Sun Active node */}
                        {showSun && (
                          <g transform={`translate(${activeSunX}, ${activeSunY})`} className="transition-all duration-500">
                            {/* Halo / glow if above horizon */}
                            {activeSunY < 500 && (
                              <circle r="35" fill="#f59e0b" opacity="0.25" className="animate-pulse" />
                            )}
                            <text
                              x="0"
                              y="12"
                              textAnchor="middle"
                              fontSize="40"
                              className="transition-all duration-500"
                              style={{
                                filter: activeSunY < 500 ? "drop-shadow(0px 0px 8px rgba(245, 158, 11, 0.8))" : "grayscale(100%) opacity(0.35)"
                              }}
                            >
                              ☀️
                            </text>
                          </g>
                        )}

                        {/* Moon Active node */}
                        <g transform={`translate(${activeMoonX}, ${activeMoonY})`} className="transition-all duration-500">
                          {/* Halo / glow if above horizon */}
                          {activeMoonY < 500 && (
                            <circle r="35" fill="#3b82f6" opacity="0.25" className="animate-pulse" />
                          )}
                          <text
                            x="0"
                            y="12"
                            textAnchor="middle"
                            fontSize="40"
                            className="transition-all duration-500"
                            style={{
                              filter: activeMoonY < 500 ? "drop-shadow(0px 0px 8px rgba(59, 130, 246, 0.8))" : "grayscale(100%) opacity(0.35)"
                            }}
                          >
                            {lunarStatus.phase.emoji}
                          </text>
                        </g>

                        {/* Current Time Indicator Vertical Line (matching active position X) */}
                        <line x1={activeSunX} y1="0" x2={activeSunX} y2="1000" stroke="#ffffff" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
                      </svg>
                    </div>

                    {/* Numeric Physical Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/40">
                        <span className="text-[9px] font-mono text-slate-500 block uppercase">Current Phase</span>
                        <span className="text-xs font-bold text-slate-200 block mt-0.5">
                          {lunarStatus.phase.name} {lunarStatus.phase.emoji}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/40">
                        <span className="text-[9px] font-mono text-slate-500 block uppercase">Illumination</span>
                        <span className="text-xs font-bold text-slate-200 block mt-0.5">
                          {lunarStatus.illumination}%
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/40">
                        <span className="text-[9px] font-mono text-slate-500 block uppercase">LUNAR AGE</span>
                        <span className="text-xs font-bold text-slate-200 block mt-0.5">
                          Day {Math.floor(lunarStatus.age)} / 29
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/40">
                        <span className="text-[9px] font-mono text-slate-500 block uppercase">Moon Distance</span>
                        <span className="text-xs font-bold text-slate-200 block mt-0.5 font-mono">
                          {lunarStatus.distanceKm.toLocaleString()} km
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/40 col-span-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[9px] font-mono text-slate-500 block uppercase">Proximity Alignment</span>
                            <span className="text-xs font-bold text-slate-200 block mt-0.5">
                              {lunarStatus.proximityState}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[8px] font-mono text-slate-400">
                            Orbit Matrix
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Realistic Moon visualizer option */}
                {showRealistic && (
                  <section className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-md text-center">
                    <h3 className="text-xs font-bold font-mono text-yellow-400 uppercase tracking-widest mb-3">
                      🌑 REALISTIC MOON SURFACE VISUALIZER
                    </h3>
                    <div className="relative inline-block w-40 h-24 sm:w-48 sm:h-28 overflow-hidden mx-auto mb-2">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="relative w-24 h-24 rounded-full border border-yellow-400 bg-gradient-to-r from-yellow-100 to-amber-400/90 shadow-2xl transition-all duration-1000 shadow-yellow-500/20"
                          style={{
                            clipPath: `inset(0px ${100 - lunarStatus.illumination}% 0px 0px)`
                          }}
                        >
                          <div className="absolute top-4 left-6 bg-yellow-600/10 rounded-full w-5 h-5 shadow-inner" />
                          <div className="absolute top-12 left-12 bg-yellow-600/10 rounded-full w-7 h-7 shadow-inner" />
                          <div className="absolute top-8 left-16 bg-yellow-600/5 rounded-full w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400">
                      Calculated illumination: {lunarStatus.illumination}% based on synodic orbit intervals of 29.53 days.
                    </p>
                  </section>
                )}

                {/* 3. Personal calculations */}
                <section className="bg-[#0c0d16]/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
                  <h3 className="text-sm font-bold font-mono text-yellow-400 uppercase tracking-wider mb-3">
                    🔢 PERSONAL CELESTIAL CALCULATIONS
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Lunar Age</span>
                        <div className="group relative">
                          <HelpCircle className="w-3.5 h-3.5 text-yellow-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-52 p-2 rounded-lg bg-black border border-slate-700 text-[10px] text-slate-300 leading-normal z-50">
                            "Lunar Age" is defined as: The number of full moon cycles that have occurred since the user's birthdate.
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-bold font-mono text-yellow-400 block">
                        {birthCycles.toLocaleString()} full moon cycles
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono block leading-relaxed">
                        Completed moon alignments since birth date: {birthDateObj?.toLocaleDateString()}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Moon Birth Phase</span>
                      <span className="text-sm font-bold font-mono text-yellow-400 block">
                        {userBirthPhase ? `${userBirthPhase.name} ${userBirthPhase.emoji}` : "Calculating..."}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono block leading-relaxed">
                        The exact cosmic configuration during your terrestrial genesis day.
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Update Birth Date</label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => {
                        setBirthDate(e.target.value);
                        localStorage.setItem("mb_birthdate", e.target.value);
                        handleAddXp(5);
                      }}
                      className="p-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none max-w-xs"
                    />
                  </div>
                </section>

                {/* 4. Double Highlights Cards: Astro Events & Challenges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Events Highlights */}
                  <section className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-md space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <h3 className="text-xs font-bold font-mono text-yellow-400 uppercase tracking-widest">
                        🌌 Astronomy Event Highlights
                      </h3>
                      <button onClick={() => setActiveView("events")} className="text-[9px] font-mono text-slate-400 hover:text-slate-200">
                        View All &rarr;
                      </button>
                    </div>

                    <div className="space-y-2">
                      {recentEvents.map((ev) => (
                        <div
                          key={ev.id}
                          onMouseEnter={() => setHoveredItemId(ev.id)}
                          onMouseLeave={() => setHoveredItemId(null)}
                          onClick={() => setSelectedHomeItem({ type: "event", data: ev })}
                          className="group relative cursor-pointer p-2.5 rounded-xl border border-slate-850 bg-slate-950/30 hover:border-yellow-500/30 transition-all flex items-center justify-between gap-3"
                        >
                          <div>
                            <span className="text-[9px] font-mono text-yellow-500">{ev.date}</span>
                            <h4 className="text-xs font-bold text-slate-200 group-hover:text-yellow-400">{ev.title}</h4>
                          </div>
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full border border-slate-800 ${
                            hoveredItemId === ev.id ? "bg-yellow-500 text-slate-950 animate-pulse" : "bg-slate-900 text-slate-400"
                          }`}>
                            {hoveredItemId === ev.id ? "(click me)" : ev.rarity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Challenges Highlights */}
                  <section className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-md space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <h3 className="text-xs font-bold font-mono text-yellow-400 uppercase tracking-widest">
                        🏆 Community Challenges
                      </h3>
                      <button onClick={() => setActiveView("events")} className="text-[9px] font-mono text-slate-400 hover:text-slate-200">
                        View All &rarr;
                      </button>
                    </div>

                    <div className="space-y-2">
                      {recentChallenges.map((ch) => (
                        <div
                          key={ch.id}
                          onClick={() => setSelectedHomeItem({ type: "challenge", data: ch })}
                          className="group cursor-pointer p-2.5 rounded-xl border border-slate-850 bg-slate-950/30 hover:border-yellow-500/30 transition-all flex items-center justify-between gap-3"
                        >
                          <div>
                            <span className="text-[9px] font-mono text-yellow-500">Value: +{ch.rewardXp} XP</span>
                            <h4 className="text-xs font-bold text-slate-200 group-hover:text-yellow-400">{ch.title}</h4>
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 group-hover:text-yellow-300">
                            Detail &rarr;
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* 5. Weekly Newsletter & Online Tribe elements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Newsletter subscription form */}
                  <section className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-md space-y-3">
                    <h3 className="text-xs font-bold font-mono text-yellow-400 uppercase tracking-widest">
                      📰 WEEKLY MOONBUG NEWSLETTER
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                      Receive weekly astro-transits guides, upcoming meteor shower alignments, and exclusive community challenges.
                    </p>
                    <form onSubmit={handleNewsletterSubscribe} className="flex gap-2">
                      <input
                        type="email"
                        required
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-100 flex-1 focus:outline-none"
                      />
                      <button type="submit" className="p-2.5 rounded-xl bg-yellow-500 text-slate-950 hover:bg-yellow-400 transition-colors font-bold text-xs uppercase">
                        Subscribe
                      </button>
                    </form>
                    {subscribedMsg && (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold block animate-pulse">
                        {subscribedMsg}
                      </span>
                    )}
                  </section>

                  {/* Online Tribe quick monitor */}
                  <section className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-md space-y-3">
                    <h3 className="text-xs font-bold font-mono text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>Lunar Tribe Online</span>
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {onlineUsers.length === 0 ? (
                        <span className="text-[10px] font-mono text-slate-500">Connecting real-time server stream...</span>
                      ) : (
                        onlineUsers.map((user) => (
                          <div
                            key={user.id}
                            className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/40 text-[10px] font-mono text-slate-300"
                          >
                            👤 {user.nickname} ({user.activePhase})
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              </div>
            )}

            {/* VIEW B: NOTES WORKSPACE */}
            {activeView === "notes" && (
              <NotesWorkspace xp={xp} onAddXp={handleAddXp} />
            )}

            {/* VIEW C: PROFILE DASHBOARD */}
            {activeView === "profile" && (
              <ProfileDashboard
                nickname={nickname}
                onChangeNickname={setNickname}
                xp={xp}
                onAddXp={handleAddXp}
              />
            )}

            {/* VIEW D: CALENDAR DASHBOARD */}
            {activeView === "calendar" && (
              <CalendarDashboard isOnline={isOnline} />
            )}

            {/* VIEW E: CHAT DASHBOARD */}
            {activeView === "chat" && (
              <ChatDashboard
                nickname={nickname}
                xp={xp}
                onAddXp={handleAddXp}
              />
            )}

            {/* VIEW F: EVENTS & REGISTRY FORUM */}
            {activeView === "events" && (
              <EventsDashboard
                nickname={nickname}
                onAddXp={handleAddXp}
                isOnline={isOnline}
              />
            )}
          </>
        )}
      </main>

      {/* BOTTOM PERSISTENT NAVIGATION BAR */}
      {isLoggedIn && (
        <nav className="fixed bottom-0 left-0 right-0 py-2 border-t border-slate-800/80 bg-[#0a0b10]/95 backdrop-blur-xl z-40 flex items-center justify-around shadow-2xl">
          <button
            onClick={() => setActiveView("home")}
            className={`flex flex-col items-center gap-1.5 text-[9px] font-mono font-bold transition-all duration-300 ${
              activeView === "home" ? "text-yellow-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span>🏠</span>
            <span>Home Dial</span>
          </button>

          <button
            onClick={() => setActiveView("notes")}
            className={`flex flex-col items-center gap-1.5 text-[9px] font-mono font-bold transition-all duration-300 ${
              activeView === "notes" ? "text-yellow-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span>📝</span>
            <span>Notes</span>
          </button>

          <button
            onClick={() => setActiveView("profile")}
            className={`flex flex-col items-center gap-1.5 text-[9px] font-mono font-bold transition-all duration-300 ${
              activeView === "profile" ? "text-yellow-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span>👤</span>
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveView("calendar")}
            className={`flex flex-col items-center gap-1.5 text-[9px] font-mono font-bold transition-all duration-300 ${
              activeView === "calendar" ? "text-yellow-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span>📅</span>
            <span>Calendar</span>
          </button>

          <button
            onClick={() => setActiveView("chat")}
            className={`flex flex-col items-center gap-1.5 text-[9px] font-mono font-bold transition-all duration-300 ${
              activeView === "chat" ? "text-yellow-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span>💬</span>
            <span>AI & Tribe</span>
          </button>

          <button
            onClick={() => setActiveView("events")}
            className={`flex flex-col items-center gap-1.5 text-[9px] font-mono font-bold transition-all duration-300 ${
              activeView === "events" ? "text-yellow-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span>🌌</span>
            <span>Events</span>
          </button>
        </nav>
      )}

      {/* DETAILED HIGHLIGHTS POPUP/MODAL RENDERER */}
      {selectedHomeItem && (
        <div className="fixed inset-0 bg-[#000000]/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0c0d15] p-5 space-y-4 my-8 relative">
            <button
              onClick={() => setSelectedHomeItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg focus:outline-none"
            >
              &times;
            </button>

            <div className="space-y-3 text-center">
              <span className="text-[9px] font-mono text-yellow-400 uppercase tracking-widest block">
                Highlighted Event Summary
              </span>
              <h3 className="text-base font-bold font-mono text-slate-100">
                {selectedHomeItem.data.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed text-left">
                {selectedHomeItem.data.description}
              </p>
              {selectedHomeItem.type === "challenge" && (
                <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-left text-xs font-mono">
                  <span className="font-bold text-yellow-400 uppercase block mb-1">Goal Metric:</span>
                  {selectedHomeItem.data.goal}
                </div>
              )}
              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedHomeItem(null);
                    setActiveView("events");
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-yellow-500 text-slate-950 font-bold text-xs uppercase"
                >
                  Enter Forums
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
