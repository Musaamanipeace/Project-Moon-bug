import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Shield, CheckCircle2, XCircle, ClipboardList } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { auditApi } from "@/lib/api";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function AuditReview() {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Awaited<ReturnType<typeof auditApi.getAssignments>> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!slug || !user) return;
    setLoading(true);
    auditApi
      .getAssignments(slug)
      .then((data) => {
        setResult(data);
      })
      .catch((e) => {
        setToast({ type: "error", text: e instanceof Error ? e.message : "failed to load audits" });
      })
      .finally(() => setLoading(false));
  }, [slug, user?.id]);

  const submit = async (logId: string, decision: "approve" | "reject") => {
    if (!slug) return;
    setBusy(logId);
    try {
      const res = await auditApi.submitDecision(slug, logId, decision);
      setResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          assignments: prev.assignments.map((a) =>
            a.challengeLogId === logId ? { ...a, status: res.assignment.status } : a,
          ),
        };
      });
      setToast({ type: "success", text: decision === "approve" ? "approved" : "rejected" });
    } catch (e: any) {
      setToast({ type: "error", text: e?.message || "decision failed" });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="glass rounded-3xl p-10 text-center text-moon-dim">
          <span className="animate-pulse font-display tracking-wide">consulting the council…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-violet-glow" />
        <h1 className="font-display text-3xl font-semibold text-gradient">Peer Audit Review</h1>
      </div>

      {toast && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-emerald-glow/30 bg-emerald-glow/10 text-emerald-200"
              : "border-rose-glow/30 bg-rose-glow/10 text-rose-200"
          }`}
        >
          {toast.text}
        </div>
      )}

      {!result || result.assignments.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center text-moon-dim">
          no pending audits right now
        </div>
      ) : (
        <div className="space-y-4">
          {result.assignments.map((a) => {
            const done = a.status !== "pending";
            return (
              <div
                key={a.id}
                className="glass rounded-3xl border border-violet-glow/15 p-6 transition hover:border-violet-glow/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 grid h-8 w-8 place-items-center rounded-full border ${
                        done
                          ? "border-emerald-glow/30 bg-emerald-glow/10"
                          : "border-violet-glow/20 bg-violet-glow/10"
                      }`}
                    >
                      <ClipboardList
                        className={`h-4 w-4 ${
                          done ? "text-emerald-200" : "text-violet-glow"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-moon">
                        Challenge: {a.slug}
                      </p>
                      <p className="text-xs text-moon-dim">
                        created {formatDate(a.createdAt)}
                        {a.decidedAt ? ` · decided ${formatDate(a.decidedAt)}` : ""}
                      </p>
                      {a.log && (
                        <div className="mt-3 space-y-2 rounded-xl border border-violet-glow/10 bg-white/[0.02] p-3">
                          <div className="flex items-center gap-2 text-xs text-moon-dim">
                            <span className="uppercase tracking-wide">log date</span>
                            <span className="text-moon">{formatDate(a.log.logDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-moon-dim">
                            <span className="uppercase tracking-wide">status</span>
                            <span
                              className={`rounded-full px-2 py-0.5 ${
                                a.log.completed
                                  ? "bg-emerald-glow/15 text-emerald-200"
                                  : "bg-amber-glow/15 text-amber-200"
                              }`}
                            >
                              {a.log.completed ? "completed" : "in progress"}
                            </span>
                          </div>
                          {a.log.data && Object.keys(a.log.data).length > 0 && (
                            <div className="rounded-lg bg-obsidian-soft/50 p-2.5">
                              <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-moon-dim">
                                {JSON.stringify(a.log.data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {done ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-glow/15 bg-white/[0.02] px-3 py-1.5 text-xs text-moon-dim capitalize">
                        {a.status}
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => submit(a.challengeLogId, "approve")}
                          disabled={busy === a.challengeLogId}
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-glow/25 bg-emerald-glow/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-glow/20 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => submit(a.challengeLogId, "reject")}
                          disabled={busy === a.challengeLogId}
                          className="inline-flex items-center gap-1.5 rounded-full border border-rose-glow/25 bg-rose-glow/10 px-3 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-glow/20 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}