import React, { useState, useEffect } from "react";
import { Award, Lock, CheckCircle, Flame, ShieldAlert, Archive, HelpCircle, Users, Sun, Moon, Sparkles, Plus, AlertCircle, Filter, BookOpen, Compass, Search, Heart } from "lucide-react";

interface ChallengeStage {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  question?: {
    prompt: string;
    options: string[];
    correctIndex: number;
  };
}

interface ChallengeTrack {
  id: string;
  title: string;
  category: "self-improvement" | "vocational" | "lunar-pillars" | "multiplayer";
  description: string;
  icon: string;
  stages: ChallengeStage[];
}

interface CataloguedChallenge {
  id: string;
  title: string;
  interest: "Astronomy" | "Health" | "Mindfulness" | "Tech" | "Finance" | "Creativity";
  description: string;
  xpReward: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedMinutes: number;
}

interface ChallengesDashboardProps {
  xp: number;
  onAddXp: (amount: number) => void;
}

export default function ChallengesDashboard({ xp, onAddXp }: ChallengesDashboardProps) {
  // Navigation tabs between Catalogued Workspace & Milestone Tracks
  const [activeTab, setActiveTab] = useState<"catalogued" | "milestones">("catalogued");

  // Track Selector State
  const [activeTrackCategory, setActiveTrackCategory] = useState<string>("all");
  const [completedStages, setCompletedStages] = useState<Record<string, boolean>>({});
  const [activeStreak, setActiveStreak] = useState<number>(5);
  const [archivedTasks, setArchivedTasks] = useState<Record<string, boolean>>({});
  const [selectedQuizStage, setSelectedQuizStage] = useState<{ trackId: string; stage: ChallengeStage } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizError, setQuizError] = useState<string | null>(null);
  
  // New Catalogued Challenge State
  const [cataloguedFilter, setCataloguedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [personalizedInterests, setPersonalizedInterests] = useState<string[]>(["Astronomy", "Mindfulness"]);
  const [completedCatalogued, setCompletedCatalogued] = useState<Record<string, boolean>>({});
  const [showPersonalizedFeedOnly, setShowPersonalizedFeedOnly] = useState<boolean>(false);

  // Custom Hover Metrics State
  const [hoveredMetrics, setHoveredMetrics] = useState<string | null>(null);

  // Load state from localstorage
  useEffect(() => {
    const savedCompleted = localStorage.getItem("mb_completed_stages");
    if (savedCompleted) {
      setCompletedStages(JSON.parse(savedCompleted));
    }
    const savedStreak = localStorage.getItem("mb_streak");
    if (savedStreak) {
      setActiveStreak(parseInt(savedStreak));
    } else {
      localStorage.setItem("mb_streak", "5");
    }
    const savedArchived = localStorage.getItem("mb_archived_tasks");
    if (savedArchived) {
      setArchivedTasks(JSON.parse(savedArchived));
    }
    const savedCatalogued = localStorage.getItem("mb_completed_catalogued");
    if (savedCatalogued) {
      setCompletedCatalogued(JSON.parse(savedCatalogued));
    }
    const savedInterests = localStorage.getItem("mb_personalized_interests");
    if (savedInterests) {
      setPersonalizedInterests(JSON.parse(savedInterests));
    }
  }, []);

  const saveCompletedStages = (newCompleted: Record<string, boolean>) => {
    setCompletedStages(newCompleted);
    localStorage.setItem("mb_completed_stages", JSON.stringify(newCompleted));
  };

  const handleArchiveTask = (stageId: string) => {
    const updated = { ...archivedTasks, [stageId]: true };
    setArchivedTasks(updated);
    localStorage.setItem("mb_archived_tasks", JSON.stringify(updated));
    alert("Task gracefully archived to the Vault. Streaks are securely frozen & protected!");
  };

  const handleStartStage = (trackId: string, stage: ChallengeStage) => {
    if (stage.question) {
      setSelectedQuizStage({ trackId, stage });
      setQuizError(null);
    } else {
      const updated = { ...completedStages, [stage.id]: true };
      saveCompletedStages(updated);
      onAddXp(stage.xpReward);
      alert(`🎉 Stage Completed! You earned +${stage.xpReward} XP!`);
    }
  };

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuizStage) return;
    
    const selectedOption = quizAnswers[selectedQuizStage.stage.id];
    if (selectedOption === undefined) {
      setQuizError("Please select an answer to verify your attention.");
      return;
    }

    if (selectedOption === selectedQuizStage.stage.question?.correctIndex) {
      const updated = { ...completedStages, [selectedQuizStage.stage.id]: true };
      saveCompletedStages(updated);
      onAddXp(selectedQuizStage.stage.xpReward);
      setSelectedQuizStage(null);
      alert(`🎯 Correct Answer! Stage verified and unlocked. +${selectedQuizStage.stage.xpReward} XP transferred to your escrow balance.`);
    } else {
      setQuizError("Incorrect response. Review the parameters and try again.");
    }
  };

  // Complete Catalogued Challenge
  const handleCompleteCatalogued = (id: string, reward: number) => {
    const updated = { ...completedCatalogued, [id]: true };
    setCompletedCatalogued(updated);
    localStorage.setItem("mb_completed_catalogued", JSON.stringify(updated));
    onAddXp(reward);
    alert(`🏆 Catalogued Challenge Completed! +${reward} XP awarded to your cosmic rank ledger.`);
  };

  // Toggle Personalized Interest Selectors
  const handleToggleInterest = (interest: string) => {
    let nextInterests = [...personalizedInterests];
    if (nextInterests.includes(interest)) {
      nextInterests = nextInterests.filter(i => i !== interest);
    } else {
      nextInterests.push(interest);
    }
    setPersonalizedInterests(nextInterests);
    localStorage.setItem("mb_personalized_interests", JSON.stringify(nextInterests));
  };

  // Predefined Catalogued Suggested Challenges list
  const cataloguedChallenges: CataloguedChallenge[] = [
    {
      id: "cat-1",
      title: "Celestial Constellation Mapping",
      interest: "Astronomy",
      description: "Locate and map the outlines of Ursa Major or Orion tonight using your physical observation notebook. Focus on high-contrast visual clarity.",
      xpReward: 40,
      difficulty: "Beginner",
      estimatedMinutes: 20
    },
    {
      id: "cat-2",
      title: "24-Hour Processing Digital Fast",
      interest: "Mindfulness",
      description: "Unplug from social networking channels for 24 hours. Reset dopamine triggers under a quiet evening transit.",
      xpReward: 85,
      difficulty: "Intermediate",
      estimatedMinutes: 1440
    },
    {
      id: "cat-3",
      title: "Chemical Sugar Audit Tracker",
      interest: "Health",
      description: "Thoroughly review nutrition indexes of all canned or boxed foods in your kitchen pantry. Log and throw out hidden syrups.",
      xpReward: 50,
      difficulty: "Beginner",
      estimatedMinutes: 30
    },
    {
      id: "cat-4",
      title: "Cosmic Pass Rotation Routine",
      interest: "Tech",
      description: "Regenerate your unique anonymous pass token coordinates three separate times to completely cycle your activities history ledger.",
      xpReward: 30,
      difficulty: "Beginner",
      estimatedMinutes: 5
    },
    {
      id: "cat-5",
      title: "Self-Hosted Campaign Launch",
      interest: "Finance",
      description: "Submit a mock $100 CPM campaign budget on the Advertiser Dashboard. Complete a checkout simulation and verify live ad status.",
      xpReward: 70,
      difficulty: "Intermediate",
      estimatedMinutes: 15
    },
    {
      id: "cat-6",
      title: "Astrophotography Sky Drawing",
      interest: "Creativity",
      description: "Capture an eye-safe photograph of the lunar body or sketch a high-fidelity rendering. Upload details to your profile photo album.",
      xpReward: 110,
      difficulty: "Advanced",
      estimatedMinutes: 60
    },
    {
      id: "cat-7",
      title: "ISS Moon Cross Observation",
      interest: "Astronomy",
      description: "Observe the International Space Station or another low-orbit satellite crossing the celestial sphere. Note transit angle parameters.",
      xpReward: 75,
      difficulty: "Intermediate",
      estimatedMinutes: 25
    },
    {
      id: "cat-8",
      title: "Diaphragmatic Breathing Sequence",
      interest: "Mindfulness",
      description: "Execute three full 5-minute cycles of structured box breathing (4s inhale, 4s hold, 4s exhale, 4s rest) during moonrise peak.",
      xpReward: 45,
      difficulty: "Beginner",
      estimatedMinutes: 15
    }
  ];

  // Predefined Challenge tracks of thousands of automated loops
  const tracks: ChallengeTrack[] = [
    {
      id: "track-sugar",
      title: "Processed Sugar Cessation Cycle",
      category: "self-improvement",
      description: "Purge simple artificial sugars to stabilize chemical blood metrics under the moon's gravitational pull.",
      icon: "🥦",
      stages: [
        {
          id: "sugar-1",
          title: "Intention & Pantry Sanitization",
          description: "Read nutrition cards on all processed goods in your kitchen. Throw out anything listing added syrups.",
          xpReward: 35
        },
        {
          id: "sugar-2",
          title: "The 48-Hour Fructose Audit",
          description: "Maintain a strict 100% whole-food index for two days. Log food metrics in your local notebook.",
          xpReward: 60,
          question: {
            prompt: "Which of these is considered a natural whole-food sugar replacement?",
            options: ["High-Fructose Corn Syrup", "Organic Whole Dates", "Sucralose Additive"],
            correctIndex: 1
          }
        },
        {
          id: "sugar-3",
          title: "Physical Health Check-Up",
          description: "Check your local blood glucose metric or take a physical resting heart rate scan. Log the results.",
          xpReward: 100
        }
      ]
    },
    {
      id: "track-astronomer",
      title: "Vocational: Junior Astrophysics Track",
      category: "vocational",
      description: "Accelerate your career trajectory into spatial analytics and data-plotting systems.",
      icon: "🔭",
      stages: [
        {
          id: "astro-1",
          title: "Coordinate Mapping Basics",
          description: "Align your local viewport slider until the Moon is visible above 45 degrees. Note the coordinate values.",
          xpReward: 40
        },
        {
          id: "astro-2",
          title: "Oppositional Mechanics Quiz",
          description: "Complete the orbital oppositions questionnaire to verify your comprehension of planetary alignment.",
          xpReward: 80,
          question: {
            prompt: "What is the physical geometric angle between the Sun and Moon during a Full Moon?",
            options: ["0 degrees (Conjunction)", "90 degrees (Quadrature)", "180 degrees (Opposition)"],
            correctIndex: 2
          }
        },
        {
          id: "astro-3",
          title: "Atmospheric Refraction Report",
          description: "Plot a custom note containing a clarity analysis of local sky conditions under the current transiting constellation.",
          xpReward: 120
        }
      ]
    },
    {
      id: "track-lunar",
      title: "The Four-Pillar Celestial Synchronization Loop",
      category: "lunar-pillars",
      description: "Synchronize your physiological sprints and rests with the actual synodic lunar phase state.",
      icon: "🌓",
      stages: [
        {
          id: "lunar-1",
          title: "New Moon: Intention & Planning",
          description: "During the pitch-black sky, draft exactly three high-level multi-week milestones inside your local Notebook.",
          xpReward: 30
        },
        {
          id: "lunar-2",
          title: "Waxing Moon: Sprints & Execution",
          description: "As the lunar crescent thickens, complete an intense 45-minute vocational study block or physical training sprint.",
          xpReward: 70
        },
        {
          id: "lunar-3",
          title: "Full Moon: Habit Release & Cleanse",
          description: "Cleanse your workspace. Release one unproductive digital distraction or bad habit ritual completely.",
          xpReward: 110,
          question: {
            prompt: "Which lunar pillar is traditionally associated with release, rest, and living space cleansing?",
            options: ["New Moon", "Waxing Crescent", "Waning Gibbous / Restorative Period"],
            correctIndex: 2
          }
        }
      ]
    },
    {
      id: "track-collab",
      title: "Multiplayer: Synchronized Execution",
      category: "multiplayer",
      description: "Coordinate actions simultaneously with other verified anonymous members of the Moonbug ecosystem.",
      icon: "👥",
      stages: [
        {
          id: "collab-1",
          title: "Tribe Chat Ping",
          description: "Spend 5 XP to broadcast a progress report to the Tribe Chat log to alert peers of your active focus.",
          xpReward: 25
        },
        {
          id: "collab-2",
          title: "Simultaneous Watch Verification",
          description: "Partner up with an anonymous online peer. Watch the same educational self-hosted promotion within 10 minutes.",
          xpReward: 90,
          question: {
            prompt: "What is the primary visual block filter on the Moonbug Ad Network?",
            options: ["No filters, open pop-ups", "Bans gambling, alcohol, unverified data harvesters", "Restricts to corporate retail only"],
            correctIndex: 1
          }
        }
      ]
    }
  ];

  // Filtering Catalogued list based on selection and search
  const filteredCatalogued = cataloguedChallenges.filter(ch => {
    // Search query match
    const matchesSearch = ch.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ch.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Interest filter match
    if (showPersonalizedFeedOnly) {
      return matchesSearch && personalizedInterests.includes(ch.interest);
    }
    
    if (cataloguedFilter !== "all" && ch.interest.toLowerCase() !== cataloguedFilter.toLowerCase()) {
      return false;
    }
    return matchesSearch;
  });

  const filteredTracks = tracks.filter(t => activeTrackCategory === "all" || t.category === activeTrackCategory);

  const interestOptions = ["Astronomy", "Health", "Mindfulness", "Tech", "Finance", "Creativity"];

  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto text-slate-200">
      
      {/* Metrics Header Box */}
      <div 
        className="relative bg-slate-950 border border-emerald-500/30 p-3.5 rounded-xl flex items-center justify-between gap-4 cursor-help group transition-all"
        onMouseEnter={() => setHoveredMetrics("Challenges_VM_Active_Nodes: 8 | Integration_Lag: 4ms | Personalization_Index: Active | Complete: " + Object.keys(completedCatalogued).length)}
        onMouseLeave={() => setHoveredMetrics(null)}
      >
        <div className="flex items-center gap-2.5">
          <Flame className="w-5 h-5 text-yellow-400 animate-pulse" />
          <div>
            <span className="text-xs font-mono font-bold text-slate-100 block">🚀 Gamified Celestial Focus Challenges</span>
            <span className="text-[10px] text-slate-400 font-mono">Explore catalogued attention loops, set interest tags, or personalized feeds</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-center">
            <span className="text-[9px] font-mono text-slate-500 block uppercase">STREAK CONTROL</span>
            <span className="text-sm font-bold font-mono text-yellow-400 flex items-center justify-center gap-1">
              🔥 {activeStreak} Days
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-center">
            <span className="text-[9px] font-mono text-slate-500 block uppercase">ESCROW BAL</span>
            <span className="text-sm font-bold font-mono text-emerald-400">{xp} XP</span>
          </div>
        </div>

        {/* Hover metrics CPU display */}
        {hoveredMetrics && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#070b13] border border-emerald-400/40 rounded-xl p-3 shadow-2xl font-mono text-[10px] text-emerald-400 leading-relaxed transition-all">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1 mb-1.5">
              <span className="font-bold text-slate-100 flex items-center gap-1">📊 STABLE_VM CHANNELS & CPU REGISTERS</span>
              <span className="px-1.5 py-0.2 bg-emerald-950/80 border border-emerald-500/30 text-[8px] rounded">STATUS_OK</span>
            </div>
            <span>{hoveredMetrics}</span>
          </div>
        )}
      </div>

      {/* Main Tab Switcher (Catalogued Suggested Challenges vs existing tracks) */}
      <div className="grid grid-cols-2 gap-2 bg-[#0c0d16] p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab("catalogued")}
          className={`py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
            activeTab === "catalogued"
              ? "bg-yellow-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Catalogued Suggested Challenges</span>
        </button>

        <button
          onClick={() => setActiveTab("milestones")}
          className={`py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
            activeTab === "milestones"
              ? "bg-yellow-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Sponsorship Milestone Tracks</span>
        </button>
      </div>

      {/* ----------------- TAB A: CATALOGUED WORKSPACE ----------------- */}
      {activeTab === "catalogued" && (
        <div className="space-y-6">
          
          {/* Personalization Interests config card */}
          <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-xs font-bold font-mono text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  <span>Configure Interest Coordinates</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Customize your feeds and unlock tailored daily challenges</p>
              </div>

              {/* Toggle switch for Personalised Feed Only */}
              <button
                onClick={() => setShowPersonalizedFeedOnly(!showPersonalizedFeedOnly)}
                className={`px-3 py-1.5 rounded-xl border font-mono text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
                  showPersonalizedFeedOnly
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                    : "border-slate-850 bg-slate-950 text-slate-500 hover:text-slate-300"
                }`}
              >
                <span>{showPersonalizedFeedOnly ? "Showing Personalized Feed" : "Show Personalized Feed"}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {interestOptions.map(interest => {
                const isSelected = personalizedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => handleToggleInterest(interest)}
                    className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                        : "border-slate-850 bg-slate-950/50 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <span>{isSelected ? "✓" : "+"}</span>
                    <span>{interest}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Filtering and search control block */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search catalogued loops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-yellow-500 font-mono"
              />
            </div>

            {/* Interest pills */}
            <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {["all", "Astronomy", "Health", "Mindfulness", "Tech", "Finance", "Creativity"].map(p => (
                <button
                  key={p}
                  onClick={() => {
                    setCataloguedFilter(p);
                    setShowPersonalizedFeedOnly(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl border font-mono text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                    !showPersonalizedFeedOnly && cataloguedFilter === p
                      ? "border-yellow-500 bg-yellow-500/10 text-yellow-300"
                      : "border-slate-850 bg-slate-950 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {p === "all" ? "🌐 EXPLORE ALL" : p}
                </button>
              ))}
            </div>
          </div>

          {/* Catalogued Grid display */}
          {filteredCatalogued.length === 0 ? (
            <div className="p-8 rounded-2xl border border-slate-800/60 bg-slate-950/20 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">No Catalogued Matches</h4>
              <p className="text-[10px] text-slate-500 max-w-sm mx-auto font-sans">
                No challenges align with your search parameter or personalized interest checkboxes. Toggle your config tags above to expand matches.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCatalogued.map(ch => {
                const isCompleted = completedCatalogued[ch.id];
                return (
                  <div
                    key={ch.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3.5 ${
                      isCompleted
                        ? "border-emerald-950 bg-emerald-950/5 text-slate-400"
                        : "border-slate-850 bg-slate-950/40 hover:border-slate-700/60 hover:bg-slate-950/80"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-yellow-400 uppercase tracking-widest font-semibold px-2 py-0.5 bg-yellow-500/5 rounded border border-yellow-500/10">
                          {ch.interest}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                          <span className={`px-1.5 py-0.2 rounded border ${
                            ch.difficulty === "Beginner" ? "border-emerald-900 text-emerald-400 bg-emerald-950/10" :
                            ch.difficulty === "Intermediate" ? "border-amber-900 text-amber-400 bg-amber-950/10" :
                            "border-rose-900 text-rose-400 bg-rose-950/10"
                          }`}>
                            {ch.difficulty}
                          </span>
                          <span>• {ch.estimatedMinutes} mins</span>
                        </div>
                      </div>

                      <h4 className={`text-xs font-bold font-mono ${isCompleted ? "line-through text-slate-500" : "text-slate-100"}`}>
                        {ch.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                        {ch.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        🎁 Reward: +{ch.xpReward} XP
                      </span>

                      {isCompleted ? (
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold uppercase">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Complete</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCompleteCatalogued(ch.id, ch.xpReward)}
                          className="px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold font-mono text-[10px] uppercase transition-all"
                        >
                          Complete Challenge
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ----------------- TAB B: EXISTING MILESTONE TRACKS ----------------- */}
      {activeTab === "milestones" && (
        <div className="space-y-6">
          
          {/* Track Category Filter Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
            <div className="flex gap-1.5 overflow-x-auto">
              {["all", "self-improvement", "vocational", "lunar-pillars", "multiplayer"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTrackCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl border font-mono text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                    activeTrackCategory === cat
                      ? "border-yellow-500 bg-yellow-500/10 text-yellow-400 shadow-inner"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat === "all" ? "🌐 ALL TRACKS" : cat.replace("-", " ")}
                </button>
              ))}
            </div>

            <div className="text-[9.5px] font-mono text-slate-400 flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
              <span>Completed stages automatically update escrow balance</span>
            </div>
          </div>

          {/* Main Tracks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTracks.map(track => {
              const completedCount = track.stages.filter(s => completedStages[s.id]).length;
              const progressPct = Math.round((completedCount / track.stages.length) * 100);

              return (
                <div 
                  key={track.id}
                  className="bg-[#0b0c15]/80 border border-slate-800/80 rounded-2xl p-5 space-y-4 hover:border-slate-700/80 transition-all flex flex-col justify-between group"
                  onMouseEnter={() => setHoveredMetrics(`Track_ID: ${track.id} | Progress: ${progressPct}% | Thread_Concurrency: Active_Stream`)}
                  onMouseLeave={() => setHoveredMetrics(null)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">{track.icon}</span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-100 group-hover:text-yellow-400 transition-colors">{track.title}</h3>
                          <span className="text-[9px] font-mono text-yellow-500 uppercase tracking-widest">{track.category}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-2 py-0.5 rounded-full">
                        {progressPct}% Done
                      </span>
                    </div>

                    <p className="text-[11.5px] text-slate-400 leading-relaxed font-mono">
                      {track.description}
                    </p>

                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500" 
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    <div className="space-y-2.5 pt-2">
                      {track.stages.map((stage, sIdx) => {
                        const isCompleted = completedStages[stage.id];
                        const isArchived = archivedTasks[stage.id];
                        
                        let isLocked = false;
                        if (sIdx > 0) {
                          const prevStage = track.stages[sIdx - 1];
                          if (!completedStages[prevStage.id]) {
                            isLocked = true;
                          }
                        }

                        return (
                          <div 
                            key={stage.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                              isCompleted
                                ? "bg-emerald-950/10 border-emerald-500/20 text-slate-300"
                                : isArchived
                                ? "bg-slate-950 border-slate-850 opacity-40"
                                : isLocked
                                ? "bg-slate-950/50 border-slate-900 text-slate-500 cursor-not-allowed select-none"
                                : "bg-slate-950 border-slate-800 hover:border-slate-750 text-slate-200"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="mt-0.5">
                                {isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                                ) : isArchived ? (
                                  <Archive className="w-4 h-4 text-slate-500" />
                                ) : isLocked ? (
                                  <Lock className="w-4 h-4 text-slate-700" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-yellow-500/40 flex items-center justify-center text-[9px] font-mono font-bold text-yellow-500 bg-yellow-500/5">
                                    {sIdx + 1}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="text-xs font-bold font-mono text-slate-200 flex items-center gap-1.5">
                                  <span>{stage.title}</span>
                                  {isLocked && <span className="text-[8px] font-normal uppercase text-slate-600 bg-slate-950 px-1 rounded border border-slate-900">Locked</span>}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-sans leading-normal">
                                  {stage.description}
                                </p>
                                <span className="text-[9px] font-mono text-emerald-400 block font-bold">
                                  🪙 reward: +{stage.xpReward} XP
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1 items-end shrink-0">
                              {!isCompleted && !isArchived && !isLocked && (
                                <>
                                  <button
                                    onClick={() => handleStartStage(track.id, stage)}
                                    className="px-2 py-1 rounded bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-[10px] font-mono font-extrabold uppercase transition-colors"
                                  >
                                    {stage.question ? "Take Quiz" : "Start"}
                                  </button>
                                  <button
                                    onClick={() => handleArchiveTask(stage.id)}
                                    title="Freeze & safe archive"
                                    className="text-[8px] font-mono text-slate-500 hover:text-red-400 flex items-center gap-0.5"
                                  >
                                    <Archive className="w-2.5 h-2.5" />
                                    <span>Archive</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Active Quiz Overlay Modal */}
      {selectedQuizStage && (
        <div className="fixed inset-0 bg-[#000000]/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleQuizSubmit}
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#080911] p-6 shadow-2xl space-y-4 relative"
          >
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[9px] font-mono text-yellow-500 uppercase tracking-widest block">ATTENTION VERIFICATION LOOP</span>
                <h3 className="text-sm font-bold text-slate-100 font-mono">{selectedQuizStage.stage.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuizStage(null)}
                className="text-slate-500 hover:text-white text-lg focus:outline-none"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-850">
              💡 <span className="text-yellow-400 font-bold">Verify Engagement:</span> Please answer this random verification questionnaire based on the track educational syllabus.
            </p>

            <div className="space-y-3">
              <span className="text-xs font-mono text-slate-200 block font-semibold">
                {selectedQuizStage.stage.question?.prompt}
              </span>

              <div className="space-y-2">
                {selectedQuizStage.stage.question?.options.map((opt, oIdx) => (
                  <label
                    key={oIdx}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                      quizAnswers[selectedQuizStage.stage.id] === oIdx
                        ? "border-yellow-500 bg-yellow-500/10 text-yellow-300"
                        : "border-slate-800 bg-slate-950 hover:border-slate-750 text-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`quiz-${selectedQuizStage.stage.id}`}
                      checked={quizAnswers[selectedQuizStage.stage.id] === oIdx}
                      onChange={() => setQuizAnswers({ ...quizAnswers, [selectedQuizStage.stage.id]: oIdx })}
                      className="accent-yellow-400 hidden"
                    />
                    <span className="w-5 h-5 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center font-bold text-[9px] text-slate-400">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {quizError && (
              <p className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{quizError}</span>
              </p>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedQuizStage(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 font-bold text-xs uppercase font-mono"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-extrabold text-xs uppercase font-mono shadow-lg shadow-yellow-500/10"
              >
                Verify & complete
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
