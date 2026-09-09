import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  Play,
  ShoppingBag,
  Film,
  Plus,
  ExternalLink,
  Heart,
  Bookmark,
  MessageSquare,
  Trophy,
  Users,
  Compass,
  CheckCircle2,
  X,
  Share2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api, FeedItem, RecommendationItem } from "../lib/api";

type FilterType = "all" | "tribe" | "course" | "youtube" | "book" | "movie" | "product";

export interface HomeFeedProps {
  currentNickname?: string;
  nickname?: string;
  onNavigateToChallenges?: () => void;
  onNavigateToGames?: () => void;
  onNavigateToView?: (view: string) => void;
}

export default function HomeFeed({
  currentNickname,
  nickname,
  onNavigateToChallenges,
  onNavigateToGames,
  onNavigateToView,
}: HomeFeedProps) {
  const activeUser = currentNickname || nickname || "stargazer";
  const [filter, setFilter] = useState<FilterType>("all");
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Post state
  const [quickPostText, setQuickPostText] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // Resource Share Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [recTitle, setRecTitle] = useState("");
  const [recAuthor, setRecAuthor] = useState("");
  const [recCategory, setRecCategory] = useState<"course" | "youtube" | "book" | "movie" | "product">("course");
  const [recDescription, setRecDescription] = useState("");
  const [recUrl, setRecUrl] = useState("");
  const [recBannerUrl, setRecBannerUrl] = useState("");

  // Subscribed/bookmarked items (stored in localStorage)
  const [savedItemIds, setSavedItemIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("moonrise_saved_items");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Fetch feed and recommendations
  const loadData = async () => {
    try {
      const [feedsRes, recsRes] = await Promise.all([
        api.feed().catch(() => []),
        api.recommendations().catch(() => []),
      ]);
      setFeedItems(feedsRes);
      setRecommendations(recsRes);
    } catch (err) {
      console.warn("Error fetching home stream:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to real-time events via EventSource
    const eventSource = new EventSource("/api/stream");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "feed_new") {
          setFeedItems((prev) => [data.payload, ...prev]);
        } else if (data.type === "recommendation_new") {
          setRecommendations((prev) => [data.payload, ...prev]);
        }
      } catch (err) {
        // non-json or ping
      }
    };

    return () => eventSource.close();
  }, []);

  const toggleSaveItem = (id: string) => {
    setSavedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem("moonrise_saved_items", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  // Quick note post
  const handleQuickPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPostText.trim() || isPosting) return;
    setIsPosting(true);

    try {
      const newItem = await api.postFeed({
        author: activeUser,
        kind: "catalogue_share",
        title: "Tribe Observation",
        body: quickPostText.trim(),
      });
      setFeedItems((prev) => [newItem, ...prev]);
      setQuickPostText("");
    } catch (err) {
      console.warn("Failed to post update:", err);
    } finally {
      setIsPosting(false);
    }
  };

  // Submit shared recommendation
  const handleShareRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim() || !recDescription.trim() || isPosting) return;
    setIsPosting(true);

    try {
      const newRec = await api.postRecommendation({
        title: recTitle.trim(),
        author: recAuthor.trim() || activeUser,
        category: recCategory,
        description: recDescription.trim(),
        url: recUrl.trim(),
        bannerUrl: recBannerUrl.trim(),
      });

      // Also post a feed entry so it shows in the unified stream
      await api.postFeed({
        author: currentNickname || "Stargazer",
        kind: "catalogue_share",
        title: `Recommended: ${recTitle.trim()}`,
        body: recDescription.trim(),
        refId: newRec.id,
        refType: recCategory,
        bannerUrl: recBannerUrl.trim(),
      });

      setRecommendations((prev) => [newRec, ...prev]);
      setShowShareModal(false);
      setRecTitle("");
      setRecAuthor("");
      setRecDescription("");
      setRecUrl("");
      setRecBannerUrl("");
    } catch (err) {
      console.warn("Failed to share recommendation:", err);
    } finally {
      setIsPosting(false);
    }
  };

  // Filter Stream Items
  const filteredRecommendations = recommendations.filter((r) => {
    if (filter === "all") return true;
    if (filter === "tribe") return false;
    return r.category === filter;
  });

  const filteredFeedItems = feedItems.filter((f) => {
    if (filter === "all" || filter === "tribe") return true;
    return false;
  });

  const categoryIcons: Record<string, React.ReactNode> = {
    course: <BookOpen className="w-3.5 h-3.5" />,
    youtube: <Play className="w-3.5 h-3.5" />,
    book: <BookOpen className="w-3.5 h-3.5" />,
    movie: <Film className="w-3.5 h-3.5" />,
    product: <ShoppingBag className="w-3.5 h-3.5" />,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* 1. Header & Quick Post Bar (§4) */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d0e17]/80 backdrop-blur-md p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-turquoise-500/10 border border-turquoise-500/30 flex items-center justify-center text-turquoise">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-mono font-bold text-sm text-slate-100">
                Community Stream &amp; Recommendations
              </h2>
              <p className="text-xs text-slate-400">
                Living tribe updates, milestone accomplishments, and paywall-free resources.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-turquoise-500/15 border border-turquoise-500/40 text-turquoise hover:bg-turquoise-500 hover:text-slate-950 font-mono text-xs font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Share Resource</span>
          </button>
        </div>

        {/* Quick Post form */}
        <form onSubmit={handleQuickPost} className="flex gap-2">
          <input
            type="text"
            value={quickPostText}
            onChange={(e) => setQuickPostText(e.target.value)}
            placeholder="Share an observation, thought, or book snippet with your tribe..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700/60 bg-slate-950/60 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-turquoise-500"
          />
          <button
            type="submit"
            disabled={!quickPostText.trim() || isPosting}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-mono text-xs font-medium transition-colors"
          >
            Post
          </button>
        </form>
      </div>

      {/* 2. Filter Pills (§4) */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: "all", label: "All" },
            { id: "tribe", label: "Tribe Activity", icon: <Users className="w-3.5 h-3.5" /> },
            { id: "course", label: "Courses", icon: <BookOpen className="w-3.5 h-3.5" /> },
            { id: "youtube", label: "Videos", icon: <Play className="w-3.5 h-3.5" /> },
            { id: "book", label: "Books", icon: <BookOpen className="w-3.5 h-3.5" /> },
            { id: "movie", label: "Movies", icon: <Film className="w-3.5 h-3.5" /> },
            { id: "product", label: "Products", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
          ] as { id: FilterType; label: string; icon?: React.ReactNode }[]
        ).map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                active
                  ? "bg-turquoise-500 text-slate-950 shadow-md font-bold"
                  : "border border-slate-800 bg-slate-900/40 text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Unified Stream Items */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-slate-500">
          Loading community transmissions...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Feed Tribe Activity Cards (shown if filter is all or tribe) */}
          {(filter === "all" || filter === "tribe") &&
            filteredFeedItems.map((feed) => (
              <motion.div
                key={feed.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-800 bg-[#0c0d16]/80 backdrop-blur-md p-5 shadow-md space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-mono text-xs text-turquoise">
                      {feed.author ? feed.author[0].toUpperCase() : "S"}
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {feed.author}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 block">
                        {new Date(feed.timestamp).toLocaleDateString()} &bull;{" "}
                        {feed.kind.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full border border-turquoise-500/30 text-turquoise text-[10px] font-mono uppercase tracking-wider">
                    Tribe Activity
                  </span>
                </div>

                {feed.title && (
                  <h4 className="font-mono font-semibold text-sm text-slate-100">
                    {feed.title}
                  </h4>
                )}

                {feed.body && (
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {feed.body}
                  </p>
                )}

                {feed.bannerUrl && (
                  <div className="rounded-xl overflow-hidden max-h-56">
                    <img
                      src={feed.bannerUrl}
                      alt={feed.title || "feed media"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {feed.experience && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 italic font-sans">
                    &ldquo;{feed.experience}&rdquo;
                  </div>
                )}
              </motion.div>
            ))}

          {/* Recommendations Cards */}
          {(filter === "all" || filter !== "tribe") &&
            filteredRecommendations.map((rec) => {
              const isSaved = savedItemIds.has(rec.id);
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-slate-800 bg-[#0c0d16]/80 backdrop-blur-md p-5 shadow-md flex flex-col md:flex-row gap-5"
                >
                  {rec.bannerUrl && (
                    <div className="w-full md:w-48 h-32 shrink-0 rounded-xl overflow-hidden border border-slate-800">
                      <img
                        src={rec.bannerUrl}
                        alt={rec.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-turquoise-500/30 text-turquoise text-[10px] font-mono uppercase tracking-wider font-bold">
                          {categoryIcons[rec.category] || <Compass className="w-3 h-3" />}
                          {rec.category}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleSaveItem(rec.id)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isSaved
                                ? "border-turquoise-500/40 text-turquoise bg-turquoise-500/10"
                                : "border-slate-800 text-slate-400 hover:text-slate-200"
                            }`}
                            title={isSaved ? "Saved to your list" : "Bookmark this item"}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>

                          {rec.url && (
                            <a
                              href={rec.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-turquoise hover:border-turquoise-500/30 transition-colors"
                              title="Visit external source"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <h3 className="font-mono font-bold text-sm text-slate-100 leading-snug">
                        {rec.title}
                      </h3>

                      <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-3 mt-1">
                        {rec.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                      <span>Curated by {rec.author}</span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Heart className="w-3 h-3 text-rose-400 fill-rose-400/20" />
                        <span>{rec.likes} recommendations</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

          {filteredFeedItems.length === 0 && filteredRecommendations.length === 0 && (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400 font-mono text-xs">
              No entries found in this category. Be the first to share one!
            </div>
          )}
        </div>
      )}

      {/* SHARE RECOMMENDATION MODAL (§4) */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-4 text-slate-100 font-mono"
            >
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Share a Resource with Moonrise
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Help fellow stargazers discover impactful courses, books, documentaries, and tools.
                </p>
              </div>

              <form onSubmit={handleShareRecommendation} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                    Resource Title
                  </label>
                  <input
                    type="text"
                    required
                    value={recTitle}
                    onChange={(e) => setRecTitle(e.target.value)}
                    placeholder="e.g. The Right Stuff (Documentary) or Cosmos"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-turquoise-500 font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                      Category
                    </label>
                    <select
                      value={recCategory}
                      onChange={(e: any) => setRecCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-turquoise-500"
                    >
                      <option value="course">Course</option>
                      <option value="youtube">Video / Doc</option>
                      <option value="book">Book</option>
                      <option value="movie">Movie</option>
                      <option value="product">Product / Tool</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                      Author / Creator
                    </label>
                    <input
                      type="text"
                      value={recAuthor}
                      onChange={(e) => setRecAuthor(e.target.value)}
                      placeholder="e.g. Carl Sagan"
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-turquoise-500 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                    Description &amp; Why You Recommend It
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={recDescription}
                    onChange={(e) => setRecDescription(e.target.value)}
                    placeholder="What makes this worth exploring? What did you learn?"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-turquoise-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                    External URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={recUrl}
                    onChange={(e) => setRecUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-turquoise-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                    Banner Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={recBannerUrl}
                    onChange={(e) => setRecBannerUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-turquoise-500 font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowShareModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPosting}
                    className="px-5 py-2 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 text-slate-950 font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {isPosting ? "Posting..." : "Share Resource"}
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
