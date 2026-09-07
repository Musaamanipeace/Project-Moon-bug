import React, { useState } from "react";
import { Sparkles, ArrowRight, Telescope, Compass, BookOpen, Shield, Play } from "lucide-react";
import StarryBackground from "./StarryBackground";
import InfoPage from "./InfoPage";
import { supabase } from "../lib/supabase";

const VIDEO_URL = "https://example.com/hero-video.mp4";

const PREVIEW_RESOURCES = [
  { cat: "course", title: "Intro to Astrophotography", author: "StarGazer Academy" },
  { cat: "book", title: "Cosmos by Carl Sagan", author: "Carl Sagan" },
  { cat: "product", title: "Orion SkyQuest XT8", author: "AstroGear Reviews" },
];

export default function LandingPage({ onExplorePublic }: { onExplorePublic: () => void }) {
  const [subView, setSubView] = useState<"home" | "policy" | "guidelines" | "about">("home");
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg, setOtpMsg] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setOtpLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
      if (error) throw error;
      setOtpSent(true);
      setOtpMsg(`✓ Magic link sent to ${email}. Check your inbox.`);
    } catch (err) {
      console.error(err);
      setOtpMsg("Failed to send magic link. Please try again.");
    }
    setOtpLoading(false);
  };

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (subView !== "home") {
    return (
      <div className="relative min-h-screen text-slate-100">
        <StarryBackground />
        <div
          className="fixed inset-0 -z-9 pointer-events-none"
          style={{ background: "linear-gradient(165deg, rgba(26,27,58,0.55), rgba(10,11,20,0.35))" }}
        />
        <div className="relative z-10">
          <InfoPage page={subView} />
          <div className="max-w-2xl mx-auto px-4 pb-10">
            <button
              onClick={() => setSubView("home")}
              className="text-turquoise hover:text-turquoise-bright font-mono text-xs uppercase tracking-wider transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-slate-100">
      <StarryBackground />
      <div
        className="fixed inset-0 -z-9 pointer-events-none"
        style={{ background: "linear-gradient(165deg, rgba(26,27,58,0.55), rgba(10,11,20,0.35))" }}
      />

      <div className="relative z-10">
        {/* HERO WITH VIDEO */}
        <section id="hero" className="relative min-h-screen flex items-center justify-center text-center">
          <div className="absolute inset-0 overflow-hidden">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={VIDEO_URL} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b10] via-[#0a0b10]/70 to-transparent" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 pt-24 space-y-8">
            <h1 className="text-4xl sm:text-5xl font-bold font-mono tracking-wider">
              <span className="bg-gradient-to-r from-turquoise-200 via-turquoise-300 to-turquoise-500 bg-clip-text text-transparent">
                Project-moonrise
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 font-mono">
              Track the moon. Discover resources. Rise together.
            </p>

            <p className="text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
              A paywall-free community where citizens discover health, skill, and relationship
              resources together — recommended by people, not algorithms-for-sale.
            </p>

            {/* Email-OTP auth */}
            <div className="mt-8 space-y-3 max-w-md mx-auto">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-700 bg-slate-950/60 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-turquoise-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={otpLoading || !email.trim()}
                    className="px-5 py-3 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    {otpLoading ? "Sending..." : <><Sparkles className="w-4 h-4" /> Send Link</>}
                  </button>
                </form>
              ) : (
                <p className="text-xs font-mono text-turquoise-dim text-center">{otpMsg}</p>
              )}
            </div>

            {otpMsg && otpSent && (
              <p className="text-xs font-mono text-turquoise-dim text-center">{otpMsg}</p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
              <button
                onClick={onExplorePublic}
                className="px-6 py-3 rounded-xl border border-turquoise-500/40 text-turquoise hover:bg-turquoise-500/10 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                Explore Public Content
              </button>
              <button
                onClick={() => handleScrollTo("features")}
                className="px-6 py-3 rounded-xl text-slate-300 hover:text-white text-xs font-mono transition-all flex items-center gap-2"
              >
                Learn more <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-20 px-4 max-w-5xl mx-auto">
          <h2 className="text-center text-sm font-mono uppercase text-turquoise tracking-widest mb-2">Features</h2>
          <h3 className="text-center text-lg font-bold font-mono text-slate-200 mb-12">Paywall-free discovery for the curious.</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 text-center space-y-3">
              <Telescope className="w-8 h-8 text-turquoise mx-auto" />
              <h4 className="text-sm font-bold font-mono text-slate-100">Moon Tracking</h4>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">Observe lunar phases, rise/set times, and astro events with an interactive 3D dial.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 text-center space-y-3">
              <Compass className="w-8 h-8 text-turquoise mx-auto" />
              <h4 className="text-sm font-bold font-mono text-slate-100">Resource Discovery</h4>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">Community-curated courses, books, videos, and products — no paywalls, no algorithms-for-sale.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 text-center space-y-3">
              <Play className="w-8 h-8 text-turquoise mx-auto" />
              <h4 className="text-sm font-bold font-mono text-slate-100">Ethical Ads</h4>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">Watch nature-conscious campaigns and support causes that matter to your community.</p>
            </div>
          </div>
        </section>

        {/* PREVIEW RESOURCES */}
        <section id="resources" className="py-20 px-4 max-w-5xl mx-auto">
          <h2 className="text-center text-sm font-mono uppercase text-turquoise tracking-widest mb-4">🌟 Community-Recommended Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {PREVIEW_RESOURCES.map((rec, i) => (
              <div key={i} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1">
                <span className="text-[9px] font-mono text-turquoise-dim uppercase block">{rec.cat}</span>
                <h4 className="text-xs font-bold text-slate-200">{rec.title}</h4>
                <span className="text-[9px] text-slate-500 font-mono block">by {rec.author}</span>
                <button className="mt-2 text-[10px] font-mono text-turquoise hover:text-turquoise-bright transition-colors">
                  Subscribe
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* BORDERLESS TEXT LINKS */}
        <section className="flex flex-wrap items-center justify-center gap-6 border-t border-slate-800/60 pt-6 pb-10">
          <button
            onClick={() => setSubView("policy")}
            className="text-slate-400 hover:text-turquoise transition-colors font-mono text-xs flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            Platform Policy
          </button>
          <button
            onClick={() => setSubView("guidelines")}
            className="text-slate-400 hover:text-turquoise transition-colors font-mono text-xs flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Community Guidelines
          </button>
          <button
            onClick={() => setSubView("about")}
            className="text-slate-400 hover:text-turquoise transition-colors font-mono text-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            About
          </button>
        </section>

        <div className="text-center text-[10px] font-mono text-slate-600 pb-10">
          <ArrowRight className="w-3 h-3 inline mr-1" />
          Paywall-free community discovery — launching in Kenya &amp; Africa.
        </div>
      </div>
    </div>
  );
}
