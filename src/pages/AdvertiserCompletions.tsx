import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { advertiserApi } from "@/lib/api";

type Completion = {
  id: string;
  userId: string;
  campaignId: string;
  nonce: string;
  signature: string;
  claimed: boolean;
  createdAt: string;
};

export default function AdvertiserCompletions() {
  const [items, setItems] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    advertiserApi
      .listCompletions()
      .then((data) => setItems(data.completions || []))
      .catch((e) => setError(e?.message || "failed to load completions"))
      .finally(() => setLoading(false));
  }, []);

  const claim = async (id: string) => {
    setClaiming(id);
    try {
      await advertiserApi.claimToken(id);
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, claimed: true } : c)));
    } catch (e: any) {
      setError(e?.message || "claim failed");
    } finally {
      setClaiming(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/advertiser/campaigns" className="flex items-center gap-1.5 text-sm text-moon-dim transition hover:text-moon">
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <h1 className="font-display text-2xl font-semibold text-gradient">Completions</h1>
      </div>

      {loading && (
        <div className="glass rounded-3xl p-10 text-center text-moon-dim">
          <span className="animate-pulse font-display tracking-wide">consulting the ledger…</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-glow/30 bg-rose-glow/10 px-4 py-3 text-sm text-rose-200">{error}</div>
      )}

      {!loading && !error && (
        <div className="glass-strong rounded-3xl border border-violet-glow/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-violet-glow/10 text-xs uppercase tracking-wide text-moon-dim">
                <tr>
                  <th className="px-5 py-3">Token</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Campaign</th>
                  <th className="px-5 py-3">Nonce</th>
                  <th className="px-5 py-3">Claimed</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-glow/10">
                {items.map((c) => (
                  <tr key={c.id} className="transition hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-moon-dim">{c.id.slice(0, 8)}…</td>
                    <td className="px-5 py-3 text-xs text-moon">{c.userId.slice(0, 8)}…</td>
                    <td className="px-5 py-3 text-xs text-moon">{c.campaignId.slice(0, 8)}…</td>
                    <td className="px-5 py-3 font-mono text-xs text-moon-dim">{c.nonce}</td>
                    <td className="px-5 py-3">
                      {c.claimed ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-200">
                          <CheckCircle2 className="h-4 w-4" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-200">
                          <XCircle className="h-4 w-4" /> No
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-moon-dim">{new Date(c.createdAt).toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      {!c.claimed && (
                        <button
                          disabled={claiming === c.id}
                          onClick={() => claim(c.id)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-glow/25 bg-emerald-glow/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-glow/20 disabled:opacity-50"
                        >
                          {claiming === c.id ? "Claiming…" : "Mark Claimed"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-moon-dim">
                      no completions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
