import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Plus,
  Trash2,
  Edit3,
  Image,
  Video,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { advertiserApi } from "@/lib/api";

const FORMAT_ICON: Record<string, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  picture: <Image className="h-4 w-4" />,
  paid_challenge: <BarChart3 className="h-4 w-4" />,
  survey: <ClipboardList className="h-4 w-4" />,
};

export default function AdvertiserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [adv, setAdv] = useState<{ advertiser: { id: string; name: string; verified: boolean; createdAt: string }; isAdvertiser: boolean } | null>(null);
  const [campaigns, setCampaigns] = useState<
    Array<{
      id: string;
      advertiserId: string;
      format: string;
      title: string;
      payloadUrl: string;
      rewardPerAction: number;
      rewardCurrency: string;
      targetCategories: string[];
      nsfw: boolean;
      status: string;
      createdAt: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isAdvertiser) return;
    Promise.all([advertiserApi.me(), advertiserApi.listCampaigns()])
      .then(([me, list]) => {
        setAdv(me);
        setCampaigns(list.campaigns || []);
      })
      .catch((e) => setError(e?.message || "failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [user?.isAdvertiser]);

  if (!user?.isAdvertiser) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="glass rounded-3xl p-10 text-center text-moon-dim">
          You are not registered as an advertiser.{" "}
          <Link to="/advertiser" className="text-violet-glow underline">
            Register here
          </Link>
          .
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="glass rounded-3xl p-10 text-center text-moon-dim">
          <span className="animate-pulse font-display tracking-wide">summoning your campaigns…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="glass rounded-3xl border border-rose-glow/30 bg-rose-glow/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      </div>
    );
  }

  const active = campaigns.filter((c) => c.status === "active").length;

  const remove = async (id: string) => {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    try {
      await advertiserApi.deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      setError(e?.message || "delete failed");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-violet-glow/15 ring-1 ring-violet-glow/30">
            <Briefcase className="h-5 w-5 text-violet-glow" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-gradient">{adv?.advertiser.name || "Advertiser"}</h1>
            <p className="text-xs text-moon-dim">
              {adv?.advertiser.verified ? "Verified advertiser" : "Pending verification"} ·{" "}
              {campaigns.length} campaigns · {active} active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/advertiser/completions"
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-glow/15 bg-white/[0.03] px-4 py-2 text-sm text-moon transition hover:border-violet-glow/30"
          >
            <BarChart3 className="h-4 w-4" />
            Completions
          </Link>
          <Link
            to="/advertiser/campaigns/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-glow to-indigo-glow px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-glow/30 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </Link>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center text-moon-dim">
          no campaigns yet — launch your first one
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl border border-violet-glow/15 p-5 transition hover:border-violet-glow/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-moon-dim">
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-glow/15 bg-white/[0.03] px-2 py-1 text-[11px] uppercase tracking-wide text-violet-glow">
                    {FORMAT_ICON[c.format] || <Briefcase className="h-3 w-3" />}
                    {c.format}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-wide ${
                      c.status === "active"
                        ? "bg-emerald-glow/15 text-emerald-200"
                        : c.status === "paused"
                          ? "bg-amber-glow/15 text-amber-200"
                          : "bg-rose-glow/15 text-rose-200"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-moon">{c.title}</h3>
              <p className="mt-1 text-xs text-moon-dim line-clamp-2">{c.payloadUrl}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-moon-dim">
                <span>
                  {c.rewardPerAction} {c.rewardCurrency}
                </span>
                <span>{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  to={`/advertiser/campaigns/${c.id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-violet-glow/15 bg-white/[0.03] px-3 py-1.5 text-xs text-moon transition hover:border-violet-glow/30"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </Link>
                <button
                  onClick={() => remove(c.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-glow/15 bg-rose-glow/10 px-3 py-1.5 text-xs text-rose-200 transition hover:bg-rose-glow/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
