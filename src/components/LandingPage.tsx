import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Telescope,
  Users,
  Compass,
  BookOpen,
  Shield,
  Play,
  Mail,
  CheckCircle2,
  X,
  KeyRound,
  Gamepad2,
  Tv,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import StarryBackground from "./StarryBackground";
import InfoPage from "./InfoPage";
import { supabase } from "../lib/supabase";

interface LandingPageProps {
  onExplorePublic?: () => void;
  onLoginSuccess: (user: any) => void;
}

const HERO_VIDEO =
  "https://cdn.coverr.co/videos/coverr-stars-in-the-night-sky-5231/1080p.mp4";
const HERO_POSTER =
  "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1920&auto=format&fit=crop";

export default function LandingPage({ onExplorePublic, onLoginSuccess }: LandingPageProps) {
  const [subView, setSubView] = useState<"home" | "policy" | "guidelines" | "about">("home");
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Supabase Auth Email + OTP state
  const [email, setEmail] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Newsletter state (no XP)
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });
      if (error) throw error;
      setOtpSent(true);
      setAuthMessage({
        text: `A 6-digit verification code was dispatched to ${email}. Please check your inbox or spam.`,
      });
    } catch (err: any) {
      console.warn("OTP request failed:", err);
      // If Supabase email rate limits or project is in sandbox, gracefully inform
      setAuthMessage({
        text: err?.message || "Failed to send verification code. You may also use instant preview below.",
        isError: true,
      });
    } finally {
      setAuthLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken.trim()) return;
    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpToken.trim(),
        type: "email",
      });

      if (error) throw error;

      const user = data.user || {
        id: "usr_" + Date.now(),
        email: email.trim(),
        user_metadata: { nickname: email.split("@")[0] },
      };

      setShowAuthModal(false);
      onLoginSuccess(user);
    } catch (err: any) {
      console.warn("OTP verification error:", err);
      setAuthMessage({
        text: err?.message || "Invalid or expired token. Please check the code and try again.",
        isError: true,
      });
    } finally {
      setAuthLoading(false);
    }
  };

  // Quick Guest / Demo entry for frictionless testing
  const handleGuestDemoLogin = () => {
    const guestUser = {
      id: "guest_" + Math.random().toString(36).substring(2, 8),
      email: "stargazer@moonrise.org",
      user_metadata: { nickname: "Stargazer_" + Math.floor(Math.random() * 900 + 100) },
    };
    setShowAuthModal(false);
    onLoginSuccess(guestUser);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubscribed(true);
    setNewsletterEmail("");
  };

  const scrollToPillars = () => {
    const el = document.getElementById("pillars");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  if (subView !== "home") {
    return (
      <div className="relative min-h-screen text-slate-100 bg-[#07080d]">
        <StarryBackground />
        <div className="relative z-10 py-12">
          <InfoPage page={subView} />
          <div className="max-w-2xl mx-auto px-4 pb-12 pt-6">
            <button
              onClick={() => setSubView("home")}
              className="text-turquoise hover:text-turquoise-bright font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              ← Back to Overview
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-slate-100 bg-[#07080d] selection:bg-turquoise-500/30 selection:text-turquoise-200">
      {/* Starry ambient background - scoped strictly to Landing Page (§6) */}
      <StarryBackground />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(20, 26, 45, 0.45) 0%, rgba(7, 8, 13, 0.85) 100%)",
        }}
      />

      {/* Top Marketing Navigation */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full border border-turquoise-500/40 bg-turquoise-500/10 flex items-center justify-center text-turquoise shadow-[0_0_12px_rgba(79,209,197,0.2)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-mono text-base font-bold tracking-wider text-slate-100">
            Project Moonrise
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={scrollToPillars}
            className="hidden sm:inline-block px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
          >
            Pillars
          </button>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-5 py-2 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(79,209,197,0.25)] hover:shadow-[0_0_20px_rgba(79,209,197,0.4)]"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* 1. HERO SECTION (Full-bleed soundless looping video, headline, one-line value prop, primary CTA) */}
      <section className="relative min-h-[85vh] flex items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={HERO_POSTER}
            className="w-full h-full object-cover opacity-35 filter brightness-90 contrast-110"
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-[#07080d]/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-6 pt-12 pb-16">
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight font-mono text-slate-50 leading-[1.15]"
          >
            Synchronize your life with the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-turquoise-300 via-turquoise-400 to-teal-200">
              lunar rhythm.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-base sm:text-lg text-slate-300 font-sans max-w-2xl mx-auto leading-relaxed"
          >
            A paywall-free social ecosystem combining real-time astronomical timetables,
            habit challenges, symmetric tribe collaboration, and curated community recommendations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 text-slate-950 font-mono text-sm font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(79,209,197,0.3)] hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={scrollToPillars}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900/40 text-slate-300 hover:text-white font-mono text-sm transition-all"
            >
              Explore Pillars
            </button>
          </motion.div>
        </div>
      </section>

      {/* 2. SCROLL-TRIGGERED FEATURE SECTIONS (One per pillar) */}
      <section id="pillars" className="relative z-10 max-w-6xl mx-auto px-6 py-20 space-y-28">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-[10px] font-mono text-turquoise uppercase tracking-widest font-semibold">
            Core Foundations
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-mono text-slate-100">
            Four pillars designed for human vitality, not ad extraction.
          </h2>
        </div>

        {/* Pillar 1: Feed & Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
        >
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-teal-950/60 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-turquoise uppercase tracking-wider font-bold">
              Pillar 01
            </span>
            <h3 className="text-2xl font-bold font-mono text-slate-100">
              Community Recommendations &amp; Activity Feed
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Discover paywall-free books, courses, documentaries, and tools recommended
              by real people. Once connected to your tribe, their insights and activity milestones
              gracefully surface first in your personal stream.
            </p>
            <ul className="space-y-2 pt-2 text-xs text-slate-400 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-turquoise" />
                Zero algorithm gaming — genuine peer curation
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-turquoise" />
                Category filters for books, videos, courses, and astronomy equipment
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 overflow-hidden shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1000&auto=format&fit=crop"
              alt="Community Feed"
              className="rounded-xl w-full h-72 object-cover"
            />
          </div>
        </motion.div>

        {/* Pillar 2: Activities (Challenges, Games, Moon Clock) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center lg:flex-row-reverse"
        >
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 overflow-hidden shadow-2xl lg:order-2">
            <img
              src="https://images.unsplash.com/photo-1532635241-17e820acc59f?q=80&w=1000&auto=format&fit=crop"
              alt="Activities and Games"
              className="rounded-xl w-full h-72 object-cover"
            />
          </div>
          <div className="space-y-4 lg:order-1">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-turquoise uppercase tracking-wider font-bold">
              Pillar 02
            </span>
            <h3 className="text-2xl font-bold font-mono text-slate-100">
              Activities, Live Games &amp; Moon Clock
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Step-by-step challenges for circadian health, mindfulness, and astronomy.
              Engage in live multiplayer games like Cosmic Word Quest and Deep Space Chess,
              or calibrate your observation times using the 3D Moon Clock with integrated calendar
              and celestial event catalogues.
            </p>
            <ul className="space-y-2 pt-2 text-xs text-slate-400 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-turquoise" />
                Host custom games with community review
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-turquoise" />
                Three integrated astronomical lenses: 3D Dial, Lunar Calendar &amp; Sky Events
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Pillar 3: Tribe */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
        >
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-turquoise uppercase tracking-wider font-bold">
              Pillar 03
            </span>
            <h3 className="text-2xl font-bold font-mono text-slate-100">
              Mutual Tribe Collaboration
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              No hierarchies or competitive leaderboards. Tribe membership is strictly mutual:
              send an invite, accept, and form reciprocal bonds. Discover peers through
              shared interests, chat privately or in group rooms, and start cooperative game sessions.
            </p>
            <ul className="space-y-2 pt-2 text-xs text-slate-400 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-turquoise" />
                Symmetric relationships without arbitrary ranking
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-turquoise" />
                Integrated 1:1 and tribe group chat
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 overflow-hidden shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1000&auto=format&fit=crop"
              alt="Mutual Tribe"
              className="rounded-xl w-full h-72 object-cover"
            />
          </div>
        </motion.div>

        {/* Pillar 4: Watch Ads */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center lg:flex-row-reverse"
        >
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 overflow-hidden shadow-2xl lg:order-2">
            <img
              src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000&auto=format&fit=crop"
              alt="Ethical Awareness Campaigns"
              className="rounded-xl w-full h-72 object-cover"
            />
          </div>
          <div className="space-y-4 lg:order-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Tv className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-turquoise uppercase tracking-wider font-bold">
              Pillar 04
            </span>
            <h3 className="text-2xl font-bold font-mono text-slate-100">
              Informational Awareness Campaigns
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Ethical brand and cause showcases stripped of predatory payout loops,
              intrusive trackers, and gamified point traps. Purely informational campaigns
              focusing on environmental stewardship, global education, and clean tech.
            </p>
            <ul className="space-y-2 pt-2 text-xs text-slate-400 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-turquoise" />
                Zero commercial gamification or micro-reward traps
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-turquoise" />
                Direct links to verified organizations and open-source initiatives
              </li>
            </ul>
          </div>
        </motion.div>
      </section>

      {/* 3. FOOTER (Newsletter subscribe without XP reward, policy links, license/about) */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md pt-16 pb-12">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          {/* Newsletter section */}
          <div className="max-w-xl mx-auto text-center space-y-4">
            <h4 className="text-lg font-bold font-mono text-slate-100">
              Celestial Bulletins &amp; Astronomical Alerts
            </h4>
            <p className="text-xs text-slate-400">
              Receive updates on major meteor showers, lunar eclipses, and platform improvements.
              No spam, ever.
            </p>
            {newsletterSubscribed ? (
              <div className="p-3 rounded-xl bg-turquoise-950/40 border border-turquoise-500/40 text-turquoise text-xs font-mono flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Thank you for subscribing to Project Moonrise bulletins.
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-turquoise-500"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>

          {/* Links and License */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-800/60 pt-8 text-xs font-mono text-slate-500">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setSubView("policy")}
                className="hover:text-turquoise transition-colors"
              >
                Platform Policy
              </button>
              <button
                onClick={() => setSubView("guidelines")}
                className="hover:text-turquoise transition-colors"
              >
                Community Guidelines
              </button>
              <button
                onClick={() => setSubView("about")}
                className="hover:text-turquoise transition-colors"
              >
                About &amp; License
              </button>
            </div>
            <div>
              Project Moonrise &copy; {new Date().getFullYear()} — Built for open sky exploration.
            </div>
          </div>
        </div>
      </footer>

      {/* REAL AUTH MODAL: EMAIL + OTP (§3) */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl text-slate-100 font-sans"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-turquoise-500/10 border border-turquoise-500/30 flex items-center justify-center text-turquoise">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-mono text-slate-100">
                    Sign in to Moonrise
                  </h3>
                  <p className="text-xs text-slate-400">
                    Passwordless email authentication with Supabase
                  </p>
                </div>
              </div>

              {authMessage && (
                <div
                  className={`p-3 rounded-xl mb-4 text-xs font-mono leading-relaxed ${
                    authMessage.isError
                      ? "bg-rose-950/40 border border-rose-800/60 text-rose-300"
                      : "bg-turquoise-950/40 border border-turquoise-800/60 text-turquoise-300"
                  }`}
                >
                  {authMessage.text}
                </div>
              )}

              {!otpSent ? (
                /* Step 1: Input Email */
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1.5">
                      Your Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="stargazer@domain.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-turquoise-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading || !email.trim()}
                    className="w-full py-3 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 disabled:opacity-50 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    {authLoading ? "Dispatching Code..." : "Send Verification Code"}
                  </button>
                </form>
              ) : (
                /* Step 2: Input 6-Digit OTP Token */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400">
                        Enter 6-Digit Code
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpToken("");
                          setAuthMessage(null);
                        }}
                        className="text-[10px] font-mono text-turquoise hover:underline"
                      >
                        Change Email
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value)}
                      placeholder="e.g. 123456"
                      maxLength={8}
                      className="w-full px-4 py-3 text-center tracking-widest text-lg font-mono rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-turquoise-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading || !otpToken.trim()}
                    className="w-full py-3 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 disabled:opacity-50 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    {authLoading ? "Verifying Session..." : "Verify & Enter"}
                  </button>
                </form>
              )}

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono">
                  <span className="bg-slate-900 px-2 text-slate-500">or preview immediately</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGuestDemoLogin}
                className="w-full py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-300 hover:text-white font-mono text-xs transition-colors"
              >
                Instant Stargazer Preview
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
