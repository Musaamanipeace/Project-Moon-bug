import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { advertiserApi } from "@/lib/api";

type FormInput = {
  format: string;
  title: string;
  payloadUrl: string;
  rewardPerAction: number;
  rewardCurrency: string;
  targetCategories: string[];
  nsfw: boolean;
  status: string;
};

const DEFAULT_FORM: FormInput = {
  format: "picture",
  title: "",
  payloadUrl: "",
  rewardPerAction: 0,
  rewardCurrency: "USDC",
  targetCategories: [],
  nsfw: false,
  status: "active",
};

export default function AdvertiserCampaignForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormInput>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    advertiserApi
      .getCampaign(id)
      .then((data) => {
        const c = data.campaign;
        setForm({
          format: c.format,
          title: c.title,
          payloadUrl: c.payloadUrl,
          rewardPerAction: c.rewardPerAction,
          rewardCurrency: c.rewardCurrency,
          targetCategories: Array.isArray(c.targetCategories) ? c.targetCategories : [],
          nsfw: c.nsfw,
          status: c.status,
        });
      })
      .catch((e) => setError(e?.message || "failed to load campaign"))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (patch: Partial<FormInput>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (id) {
        await advertiserApi.updateCampaign(id, form);
      } else {
        await advertiserApi.createCampaign(form);
      }
      navigate("/advertiser/campaigns");
    } catch (e: any) {
      setError(e?.message || "save failed");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="glass rounded-3xl p-10 text-center text-moon-dim">
          <span className="animate-pulse font-display tracking-wide">loading campaign…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/advertiser/campaigns")}
          className="flex items-center gap-1.5 text-sm text-moon-dim transition hover:text-moon"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="font-display text-2xl font-semibold text-gradient">{id ? "Edit Campaign" : "New Campaign"}</h1>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="glass-strong space-y-5 rounded-3xl border border-violet-glow/15 p-6 sm:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-moon">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              className="h-11 w-full rounded-2xl border border-violet-glow/15 bg-obsidian-soft/60 px-4 text-sm text-moon outline-none focus:border-violet-glow/40 focus:ring-1 focus:ring-violet-glow/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-moon">Format</label>
            <select
              value={form.format}
              onChange={(e) => update({ format: e.target.value })}
              className="h-11 w-full rounded-2xl border border-violet-glow/15 bg-obsidian-soft/60 px-4 text-sm text-moon outline-none focus:border-violet-glow/40 focus:ring-1 focus:ring-violet-glow/40"
            >
              <option value="video">Video</option>
              <option value="picture">Picture</option>
              <option value="paid_challenge">Paid Challenge</option>
              <option value="survey">Survey</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-moon">Status</label>
            <select
              value={form.status}
              onChange={(e) => update({ status: e.target.value })}
              className="h-11 w-full rounded-2xl border border-violet-glow/15 bg-obsidian-soft/60 px-4 text-sm text-moon outline-none focus:border-violet-glow/40 focus:ring-1 focus:ring-violet-glow/40"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="ended">Ended</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-moon">Payload URL</label>
            <input
              required
              value={form.payloadUrl}
              onChange={(e) => update({ payloadUrl: e.target.value })}
              placeholder="https://..."
              className="h-11 w-full rounded-2xl border border-violet-glow/15 bg-obsidian-soft/60 px-4 text-sm text-moon outline-none focus:border-violet-glow/40 focus:ring-1 focus:ring-violet-glow/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-moon">Reward Amount</label>
            <input
              type="number"
              step="0.01"
              required
              value={form.rewardPerAction}
              onChange={(e) => update({ rewardPerAction: parseFloat(e.target.value || "0") })}
              className="h-11 w-full rounded-2xl border border-violet-glow/15 bg-obsidian-soft/60 px-4 text-sm text-moon outline-none focus:border-violet-glow/40 focus:ring-1 focus:ring-violet-glow/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-moon">Currency</label>
            <input
              required
              value={form.rewardCurrency}
              onChange={(e) => update({ rewardCurrency: e.target.value })}
              className="h-11 w-full rounded-2xl border border-violet-glow/15 bg-obsidian-soft/60 px-4 text-sm text-moon outline-none focus:border-violet-glow/40 focus:ring-1 focus:ring-violet-glow/40"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-moon">Target Categories (comma-separated)</label>
            <input
              value={form.targetCategories.join(", ")}
              onChange={(e) =>
                update({
                  targetCategories: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="creative, humorous, wellness"
              className="h-11 w-full rounded-2xl border border-violet-glow/15 bg-obsidian-soft/60 px-4 text-sm text-moon outline-none focus:border-violet-glow/40 focus:ring-1 focus:ring-violet-glow/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="nsfw"
              type="checkbox"
              checked={form.nsfw}
              onChange={(e) => update({ nsfw: e.target.checked })}
              className="h-4 w-4 rounded border-violet-glow/30 bg-obsidian-soft/60 text-violet-glow focus:ring-violet-glow/40"
            />
            <label htmlFor="nsfw" className="text-sm text-moon">
              NSFW content
            </label>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-glow/30 bg-rose-glow/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/advertiser/campaigns")}
            className="rounded-full border border-violet-glow/15 bg-white/[0.03] px-5 py-2.5 text-sm text-moon transition hover:border-violet-glow/30"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-glow to-indigo-glow px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-glow/30 transition hover:brightness-110 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : id ? "Update Campaign" : "Create Campaign"}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
