import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Navigate } from "react-router-dom";
import { Briefcase, Rocket } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { advertiserApi } from "@/lib/api";

export default function AdvertiserOnboard() {
  const { user, loading } = useAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (!user || registered) return;
    advertiserApi
      .me()
      .then(() => setRegistered(true))
      .catch(() => {});
  }, [user, registered]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="glass rounded-3xl p-10 text-center text-moon-dim">
          <span className="animate-pulse font-display tracking-wide">checking your profile…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (registered) {
    return <Navigate to="/advertiser/campaigns" replace />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await advertiserApi.register(name.trim() || user.displayName);
      window.location.href = "/advertiser/campaigns";
    } catch (err: any) {
      setError(err?.message || "registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl border border-violet-glow/15 p-8 sm:p-12"
      >
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-violet-glow/15 ring-1 ring-violet-glow/30">
          <Briefcase className="h-7 w-7 text-violet-glow" />
        </div>
        <h1 className="text-center font-display text-3xl font-semibold text-gradient">
          Advertiser Onboarding
        </h1>
        <p className="mt-3 text-center text-moon-dim">
          Create your advertiser profile to launch campaigns and track payouts directly.
        </p>

        <form onSubmit={submit} className="mx-auto mt-8 max-w-md space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-moon">Business / Brand Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={user.displayName}
              className="h-11 w-full rounded-2xl border border-violet-glow/15 bg-obsidian-soft/60 px-4 text-sm text-moon outline-none focus:border-violet-glow/40 focus:ring-1 focus:ring-violet-glow/40"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-glow/30 bg-rose-glow/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mx-auto flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-glow to-indigo-glow px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-glow/30 transition hover:brightness-110 disabled:opacity-50"
          >
            <Rocket className="h-4 w-4" />
            {submitting ? "Launching…" : "Launch Advertiser Account"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
