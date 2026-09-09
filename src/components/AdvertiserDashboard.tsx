import React, { useState, useEffect } from "react";
import {
  Tv,
  ExternalLink,
  Plus,
  Play,
  X,
  Heart,
  MessageSquare,
  Share2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface AdCampaign {
  id: string;
  brandName: string;
  creatorName: string;
  category: "Environment" | "Astronomy & STEM" | "Health & Vitality" | "Clean Energy" | "Community";
  title: string;
  description: string;
  mediaUrl: string;
  redirectUrl: string;
  views: number;
  likes: number;
  commentsCount: number;
  comments?: Array<{ author: string; text: string; time: string }>;
}

export const INITIAL_CAMPAIGNS: AdCampaign[] = [
  {
    id: "ad-1",
    brandName: "Stars for Schools Initiative",
    creatorName: "Global Astronomy Outreach",
    category: "Astronomy & STEM",
    title: "Bringing Dobsonian Telescopes to Rural Classrooms",
    description:
      "Every child deserves to gaze at Saturn's rings. Our non-profit delivers open-source reflector telescopes and celestial field guides to community schools across East Africa.",
    mediaUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
    redirectUrl: "https://example.com/stars-for-schools",
    views: 8420,
    likes: 612,
    commentsCount: 34,
    comments: [
      { author: "NebulaRae", text: "Incredible initiative! Star clubs make a huge difference.", time: "2h ago" },
      { author: "OrbitKai", text: "Supported this in my local district!", time: "1d ago" },
    ],
  },
  {
    id: "ad-2",
    brandName: "Clean Air Coalition",
    creatorName: "Community Air Labs",
    category: "Environment",
    title: "Open-Source Micro-Sensors for Urban Air Quality",
    description:
      "Citizen-led particulate matter monitoring networks. We deploy low-cost solar-powered sensors so neighborhoods can track circadian air health in real time.",
    mediaUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop",
    redirectUrl: "https://example.com/clean-air",
    views: 12100,
    likes: 890,
    commentsCount: 45,
    comments: [
      { author: "CalmSol", text: "Essential for morning outdoor exercise.", time: "3d ago" },
    ],
  },
  {
    id: "ad-3",
    brandName: "Solaris Lunar Power",
    creatorName: "Solaris Energy",
    category: "Clean Energy",
    title: "High-Efficiency Perovskite Solar Cells for Off-Grid Living",
    description:
      "Next-generation solar films designed for variable sunlight and twilight conditions. Lightweight, flexible, and 100% recyclable silicon-free composition.",
    mediaUrl:
      "https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop",
    redirectUrl: "https://example.com/solaris-energy",
    views: 9340,
    likes: 540,
    commentsCount: 19,
    comments: [],
  },
  {
    id: "ad-4",
    brandName: "Mind Matters Global",
    creatorName: "Youth Wellbeing Alliance",
    category: "Health & Vitality",
    title: "Free Peer Support Circles for Mental Vitality",
    description:
      "Confidential, volunteer-facilitated listening rooms held under the evening sky. Connect with compassionate peers without stigma or costly therapy barriers.",
    mediaUrl:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1200&auto=format&fit=crop",
    redirectUrl: "https://example.com/mind-matters",
    views: 14200,
    likes: 1320,
    commentsCount: 82,
    comments: [],
  },
];

export const DEFAULT_ADS = INITIAL_CAMPAIGNS;

export interface AdvertiserDashboardProps {
  nickname?: string;
  onNavigateToView?: (view: string) => void;
}

export default function AdvertiserDashboard({ nickname = "stargazer", onNavigateToView }: AdvertiserDashboardProps) {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(() => {
    try {
      const raw = localStorage.getItem("moonrise_campaigns");
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_CAMPAIGNS;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeModalCampaign, setActiveModalCampaign] = useState<AdCampaign | null>(null);
  const [commentText, setCommentText] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // New campaign form state (no fees, no payments, pure submission per §2)
  const [formTitle, setFormTitle] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formCategory, setFormCategory] = useState<AdCampaign["category"]>("Environment");
  const [formDescription, setFormDescription] = useState("");
  const [formMediaUrl, setFormMediaUrl] = useState("");
  const [formRedirectUrl, setFormRedirectUrl] = useState("");

  useEffect(() => {
    localStorage.setItem("moonrise_campaigns", JSON.stringify(campaigns));
  }, [campaigns]);

  const categories = ["All", "Environment", "Astronomy & STEM", "Health & Vitality", "Clean Energy", "Community"];

  const filteredCampaigns =
    selectedCategory === "All"
      ? campaigns
      : campaigns.filter((c) => c.category === selectedCategory);

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c))
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeModalCampaign) return;

    const newComment = {
      author: nickname || "Stargazer",
      text: commentText.trim(),
      time: "Just now",
    };

    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === activeModalCampaign.id
          ? {
              ...c,
              commentsCount: c.commentsCount + 1,
              comments: [newComment, ...(c.comments || [])],
            }
          : c
      )
    );

    setActiveModalCampaign((prev) =>
      prev
        ? {
            ...prev,
            commentsCount: prev.commentsCount + 1,
            comments: [newComment, ...(prev.comments || [])],
          }
        : null
    );

    setCommentText("");
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBrand.trim()) return;

    const newCamp: AdCampaign = {
      id: `camp-${Date.now()}`,
      brandName: formBrand.trim(),
      creatorName: nickname || "Anonymous",
      category: formCategory,
      title: formTitle.trim(),
      description: formDescription.trim(),
      mediaUrl:
        formMediaUrl.trim() ||
        "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop",
      redirectUrl: formRedirectUrl.trim() || "https://moonrise.org",
      views: 1,
      likes: 1,
      commentsCount: 0,
      comments: [],
    };

    setCampaigns((prev) => [newCamp, ...prev]);
    setShowSubmitModal(false);
    setFormTitle("");
    setFormBrand("");
    setFormDescription("");
    setFormMediaUrl("");
    setFormRedirectUrl("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-100 font-sans">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c0d16]/80 backdrop-blur-md p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-turquoise-500/30 bg-turquoise-950/40 text-turquoise text-[10px] font-mono uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Curated Awareness Showcases
          </div>
          <h2 className="text-xl font-bold font-mono text-slate-100">
            Nature-Conscious &amp; Educational Campaigns
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl font-sans">
            Transparent brand and non-profit showcases. Zero micro-reward gimmicks, intrusive
            trackers, or paywall traps — pure informational discoverability for meaningful causes.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider transition-all"
        >
          <Plus className="w-4 h-4" />
          Submit Showcase
        </button>
      </div>

      {/* Categories Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                active
                  ? "bg-turquoise-500 text-slate-950 font-bold shadow-md"
                  : "border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((camp) => (
          <div
            key={camp.id}
            onClick={() => setActiveModalCampaign(camp)}
            className="rounded-2xl border border-slate-800 bg-[#0c0d16]/80 hover:border-turquoise-500/40 overflow-hidden shadow-md flex flex-col justify-between transition-all cursor-pointer group"
          >
            <div>
              <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                <img
                  src={camp.mediaUrl}
                  alt={camp.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-turquoise font-bold uppercase tracking-wider">
                  {camp.category}
                </div>
              </div>

              <div className="p-5 space-y-2">
                <span className="text-[11px] font-mono text-slate-400 block font-semibold">
                  {camp.brandName}
                </span>

                <h3 className="font-mono font-bold text-sm text-slate-100 leading-snug group-hover:text-turquoise transition-colors">
                  {camp.title}
                </h3>

                <p className="text-xs text-slate-300 font-sans line-clamp-3 leading-relaxed">
                  {camp.description}
                </p>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => handleLike(camp.id, e)}
                  className="flex items-center gap-1 hover:text-rose-400 transition-colors"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
                  <span>{camp.likes}</span>
                </button>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{camp.commentsCount}</span>
                </span>
              </div>

              <span className="text-turquoise text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                View &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* DETAIL VIEW MODAL */}
      <AnimatePresence>
        {activeModalCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-5 text-slate-100"
            >
              <button
                onClick={() => setActiveModalCampaign(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden max-h-72 border border-slate-800">
                  <img
                    src={activeModalCampaign.mediaUrl}
                    alt={activeModalCampaign.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full border border-turquoise-500/30 text-turquoise text-[10px] font-mono uppercase tracking-wider font-bold">
                    {activeModalCampaign.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Presented by {activeModalCampaign.brandName}
                  </span>
                </div>

                <h3 className="text-lg font-bold font-mono text-slate-100">
                  {activeModalCampaign.title}
                </h3>

                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {activeModalCampaign.description}
                </p>

                {activeModalCampaign.redirectUrl && (
                  <div className="pt-2">
                    <a
                      href={activeModalCampaign.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit Initiative Website
                    </a>
                  </div>
                )}
              </div>

              {/* Community comments thread */}
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Community Dialogue ({activeModalCampaign.commentsCount})
                </h4>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a constructive thought or question..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-turquoise-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-medium"
                  >
                    Reply
                  </button>
                </form>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(activeModalCampaign.comments || []).map((c, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="font-bold text-slate-300">{c.author}</span>
                        <span>{c.time}</span>
                      </div>
                      <p className="text-slate-300">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUBMIT SHOWCASE MODAL (Pure submission without fake payments per §2) */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-4 text-slate-100 font-mono"
            >
              <button
                onClick={() => setShowSubmitModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Submit Awareness Showcase
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Publish an educational or environmental initiative to the Moonrise community. No payment or auction required.
                </p>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                    Campaign / Initiative Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Solar Pumping for Drought Relief"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-turquoise-500 font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                      Organization / Brand Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="e.g. EcoSolar Africa"
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-turquoise-500 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                      Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e: any) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-turquoise-500"
                    >
                      <option value="Environment">Environment</option>
                      <option value="Astronomy & STEM">Astronomy &amp; STEM</option>
                      <option value="Health & Vitality">Health &amp; Vitality</option>
                      <option value="Clean Energy">Clean Energy</option>
                      <option value="Community">Community</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                    Description &amp; Impact
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe the mission, technology, or community impact..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-turquoise-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                    Banner / Media URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formMediaUrl}
                    onChange={(e) => setFormMediaUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-turquoise-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                    Destination / Action URL
                  </label>
                  <input
                    type="url"
                    required
                    value={formRedirectUrl}
                    onChange={(e) => setFormRedirectUrl(e.target.value)}
                    placeholder="https://your-initiative.org"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-turquoise-500 font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 text-slate-950 font-bold uppercase tracking-wider"
                  >
                    Submit Showcase
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
