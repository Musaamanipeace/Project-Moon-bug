import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { Gift, ArrowLeft, ExternalLink, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getAd, completeAd } from "@/lib/ads";
import type { AdCampaignDetail, CompletionToken } from "@/types";

export default function AdDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<AdCampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [completing, setCompleting] = useState(false);
  const [token, setToken] = useState<CompletionToken | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getAd(id)
      .then((d) => setCampaign(d.campaign))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load this ad."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleComplete = async () => {
    if (!id) return;
    if (!user) {
      navigate("/login");
      return;
    }
    setCompleting(true);
    setCompleteError(null);
    try {
      const res = await completeAd(id);
      setToken(res.token);
    } catch (e) {
      setCompleteError(e instanceof Error ? e.message : "Could not complete this action.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <p className="text-moon-dim">Summoning the campaign…</p>;

  if (error || !campaign) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link to="/ads" className="flex items-center gap-1 text-sm text-aurora transition hover:text-moon">
          <ArrowLeft className="h-4 w-4" /> Back to ads
        </Link>
        <div className="glass rounded-2xl border border-rose-glow/30 p-4 text-sm text-rose-glow">
          {error ?? "Campaign not found."}
        </div>
      </div>
    );
  }

  const rewardLabel = `${campaign.rewardPerAction} ${campaign.rewardCurrency}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/ads" className="flex items-center gap-1 text-sm text-aurora transition hover:text-moon">
        <ArrowLeft className="h-4 w-4" /> Back to ads
      </Link>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-violet-glow/80">
            {campaign.format.replace("_", " ")}
          </span>
          {campaign.nsfw && (
            <span className="rounded-full bg-rose-glow/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-rose-glow ring-1 ring-rose-glow/40">
              <ShieldAlert className="mr-1 inline h-3 w-3" /> NSFW
            </span>
          )}
        </div>

        <h1 className="font-display text-2xl font-semibold text-moon">{campaign.title}</h1>
        <p className="mt-1 text-sm text-aurora">Reward: {rewardLabel}</p>

        <div className="my-5 overflow-hidden rounded-2xl border border-violet-glow/15 bg-obsidian-soft/60">
          {campaign.format === "video" ? (
            <video src={campaign.payloadUrl} controls className="aspect-video w-full object-cover" />
          ) : campaign.format === "picture" ? (
            <img src={campaign.payloadUrl} alt={campaign.title} className="w-full object-cover" />
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-moon-dim">
              <ExternalLink className="h-10 w-10" />
              <span className="text-sm">Interactive {campaign.format.replace("_", " ")}</span>
            </div>
          )}
        </div>

        {campaign.targetCategories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {campaign.targetCategories.map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-violet-glow/15 bg-white/[0.02] px-2 py-0.5 text-[11px] text-moon-dim"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {campaign.survey && (
          <div className="mb-4 rounded-2xl border border-violet-glow/15 bg-white/[0.02] p-4">
            <p className="text-sm text-moon">Survey with {campaign.survey.questions.length} question(s).</p>
            <p className="mt-1 text-xs text-aurora">Minimum payout: {campaign.survey.minPayout} {campaign.rewardCurrency}</p>
          </div>
        )}

        {token ? (
          <div className="rounded-2xl border border-aurora/30 bg-aurora/10 p-4 text-sm text-aurora">
            Reward claimed — token issued ({rewardLabel}).
            <p className="mt-1 truncate font-mono text-[11px] text-moon-dim">sig: {token.signature}</p>
          </div>
        ) : (
          <button
            onClick={handleComplete}
            disabled={completing || !user}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-glow to-indigo-glow px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-glow/30 transition hover:brightness-110 disabled:opacity-50"
          >
            <Gift className="h-4 w-4" /> {completing ? "Claiming…" : "Complete & claim"}
          </button>
        )}

        {!user && !token && (
          <Link
            to="/login"
            className="ml-3 text-sm text-aurora transition hover:text-moon"
          >
            Sign in to claim rewards
          </Link>
        )}
        {completeError && <p className="mt-3 text-sm text-rose-glow">{completeError}</p>}
      </motion.div>
    </div>
  );
}
