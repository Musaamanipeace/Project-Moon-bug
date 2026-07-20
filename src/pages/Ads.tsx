import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Gift, Image as ImageIcon, Play, ExternalLink, ArrowRight, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { listAds, completeAd } from "@/lib/ads";
import type { AdCampaign, CompletionToken } from "@/types";

const NSFW_KEY = "moonbug:nsfw";

export default function Ads() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeNsfw, setIncludeNsfw] = useState<boolean>(() => {
    return localStorage.getItem(NSFW_KEY) === "1";
  });

  const load = useCallback(
    (nsfw: boolean) => {
      setLoading(true);
      setError(null);
      listAds(nsfw)
        .then((d) => setCampaigns(d.campaigns))
        .catch((e) => setError(e instanceof Error ? e.message : "Could not load ads."))
        .finally(() => setLoading(false));
    },
    [],
  );

  useEffect(() => {
    load(includeNsfw);
  }, [includeNsfw, load]);

  const toggleNsfw = () => {
    setIncludeNsfw((prev) => {
      const next = !prev;
      localStorage.setItem(NSFW_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-gradient">Ads & Rewards</h1>
          <p className="mt-1 text-sm text-moon-dim">
            Watch, complete, and earn direct crypto payouts from advertisers.
          </p>
        </div>
        <button
          onClick={toggleNsfw}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
            includeNsfw
              ? "border-rose-glow/40 bg-rose-glow/10 text-rose-glow"
              : "border-violet-glow/15 bg-obsidian-soft/60 text-moon-dim hover:text-moon"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          {includeNsfw ? "NSFW: on" : "NSFW: off"}
        </button>
      </div>

      {error && (
        <div className="glass rounded-2xl border border-rose-glow/30 p-4 text-sm text-rose-glow">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-moon-dim">Scanning the ad galaxy…</p>
      ) : campaigns.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center text-moon-dim">
          No campaigns available{includeNsfw ? "" : " in safe mode"}. Try toggling NSFW.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {campaigns.map((c, i) => (
            <AdCard key={c.id} campaign={c} index={i} user={user} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function AdCard({
  campaign,
  index,
  user,
  navigate,
}: {
  campaign: AdCampaign;
  index: number;
  user: ReturnType<typeof useAuth>["user"];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [completing, setCompleting] = useState(false);
  const [token, setToken] = useState<CompletionToken | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rewardLabel = `${campaign.rewardPerAction} ${campaign.rewardCurrency}`;

  const requiresDetail = campaign.format === "paid_challenge" || campaign.format === "survey";

  const handleComplete = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setCompleting(true);
    setError(null);
    try {
      const res = await completeAd(campaign.id);
      setToken(res.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not complete this action.");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass flex flex-col overflow-hidden rounded-3xl"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-obsidian-soft/60">
        {campaign.format === "video" ? (
          <video src={campaign.payloadUrl} controls className="h-full w-full object-cover" />
        ) : campaign.format === "picture" ? (
          <img src={campaign.payloadUrl} alt={campaign.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-moon-dim">
            {campaign.format === "survey" ? (
              <ImageIcon className="h-10 w-10" />
            ) : (
              <Play className="h-10 w-10" />
            )}
            <span className="text-sm uppercase tracking-wide text-violet-glow/80">
              {campaign.format.replace("_", " ")}
            </span>
          </div>
        )}
        {campaign.nsfw && (
          <span className="absolute left-3 top-3 rounded-full bg-rose-glow/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-rose-glow ring-1 ring-rose-glow/40">
            NSFW
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-display text-lg font-semibold text-moon">{campaign.title}</h3>
          <p className="mt-1 text-sm text-aurora">Reward: {rewardLabel}</p>
        </div>

        {campaign.targetCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
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

        {token ? (
          <div className="mt-auto rounded-2xl border border-aurora/30 bg-aurora/10 p-3 text-sm text-aurora">
            Reward claimed — token issued ({rewardLabel}).
            <p className="mt-1 truncate font-mono text-[11px] text-moon-dim">
              sig: {token.signature}
            </p>
          </div>
        ) : (
          <div className="mt-auto flex flex-wrap gap-2">
            {requiresDetail ? (
              <Link
                to={`/ads/${campaign.id}`}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-glow to-indigo-glow px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-glow/30 transition hover:brightness-110"
              >
                <ExternalLink className="h-4 w-4" /> Open
              </Link>
            ) : (
              <button
                onClick={handleComplete}
                disabled={completing || !user}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-glow to-indigo-glow px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-glow/30 transition hover:brightness-110 disabled:opacity-50"
              >
                <Gift className="h-4 w-4" /> {completing ? "Claiming…" : "Complete & claim"}
              </button>
            )}
            {requiresDetail && !user && (
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-full border border-violet-glow/15 px-4 py-2 text-sm text-moon-dim transition hover:text-moon"
              >
                Sign in to open <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}

        {error && <p className="text-sm text-rose-glow">{error}</p>}
      </div>
    </motion.div>
  );
}
