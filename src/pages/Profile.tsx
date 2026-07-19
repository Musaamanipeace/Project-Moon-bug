import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Flame, CalendarClock, Award, Bell, KeyRound, Mail, Trophy, Plus, Trash2, Save, LayoutGrid } from "lucide-react";
import { api } from "@/lib/api";
import { getPortfolio, savePortfolio } from "@/lib/portfolio";
import { useAuth } from "@/context/AuthContext";
import type {
  Badge,
  ChallengeDefinition,
  ProfileData,
  PortfolioData,
  ProfileField,
  UserAsset,
  UserAssetKind,
  UserFavorite,
  UserLink,
} from "@/types";

const ALL_CHALLENGES = [
  { id: "", slug: "new-moon-reflection", title: "New Moon Reflection", icon: "🌑" },
  { id: "", slug: "waxing-crescent-focus", title: "Waxing Crescent Focus", icon: "🌒" },
  { id: "", slug: "full-moon-release", title: "Full Moon Release", icon: "🌕" },
  { id: "", slug: "waning-gratitude", title: "Waning Gibbous Gratitude", icon: "🌖" },
  { id: "", slug: "balsamic-rest", title: "Balsamic Moon Rest", icon: "🌘" },
];

const FAVORITE_SEEDS: { kind: string; label: string }[] = [
  { kind: "book", label: "Favorite book" },
  { kind: "movie", label: "Favorite movie" },
  { kind: "meal", label: "Favorite meal" },
  { kind: "place", label: "Place to visit" },
  { kind: "color", label: "Favorite color" },
  { kind: "superhero", label: "Favorite superhero" },
  { kind: "junkfood", label: "Favorite junk food" },
  { kind: "fruit", label: "Favorite fruit" },
  { kind: "videogame", label: "Favorite video game" },
  { kind: "day", label: "Favorite day of the week" },
  { kind: "challenge", label: "Moonbug challenge" },
];

const ASSET_GROUPS: { kind: UserAssetKind; title: string; icon: ReactNode }[] = [
  { kind: "car", title: "My Car", icon: "🚗" },
  { kind: "bicycle", title: "My Bicycle", icon: "🚲" },
  { kind: "pets", title: "My Pets", icon: "🐾" },
  { kind: "jewelry", title: "My Jewelry", icon: "💍" },
  { kind: "clothing", title: "Clothing Collections", icon: "👕" },
];

type Tab = "overview" | "portfolio";

function uid(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function Profile() {
  const { user, updateSettings } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [challenges, setChallenges] = useState<ChallengeDefinition[]>([]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    api.get<ProfileData>("/profile").then(setProfile).catch(() => {});
    api.get<{ challenges: ChallengeDefinition[] }>("/challenges").then((d) => setChallenges(d.challenges)).catch(() => {});
  }, []);

  const earnedIds = new Set((profile?.badges ?? []).map((b: Badge) => b.challengeId));
  const memberSince = user ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

  const toggleNotifications = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateSettings({ notificationsEnabled: !user.notificationsEnabled });
    } finally {
      setSaving(false);
    }
  };

  const setMethod = async (m: "otp" | "password") => {
    if (!user || user.preferredMethod === m) return;
    setSaving(true);
    try {
      await updateSettings({ preferredMethod: m });
    } finally {
      setSaving(false);
    }
  };

  const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <UserGroup /> },
    { id: "portfolio", label: "Portfolio", icon: <LayoutGrid className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-semibold text-gradient">Your Profile</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-full border border-violet-glow/15 bg-obsidian-soft/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm transition ${
              tab === t.id ? "bg-violet-glow/25 text-moon ring-1 ring-violet-glow/40" : "text-moon-dim hover:text-moon"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <>
          {/* Identity + stats */}
          <div className="glass-strong rounded-3xl p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-glow/30 to-indigo-glow/20 text-3xl ring-1 ring-violet-glow/40">
                {user?.displayName?.charAt(0).toUpperCase() ?? "🌙"}
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-moon">{user?.displayName}</h2>
                <p className="text-sm text-moon-dim">{user?.email}</p>
                <p className="mt-0.5 text-xs text-moon-dim">Member since {memberSince}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <Stat icon={<Flame className="h-5 w-5 text-rose-glow" />} label="Current streak" value={profile?.streak ?? 0} />
              <Stat icon={<Trophy className="h-5 w-5 text-aurora" />} label="Longest streak" value={profile?.longestStreak ?? 0} />
              <Stat icon={<Award className="h-5 w-5 text-violet-glow" />} label="Completed" value={profile?.totalCompleted ?? 0} />
            </div>
          </div>

          {/* Badges */}
          <div className="glass rounded-3xl p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-moon">
              <Award className="h-5 w-5 text-violet-glow" /> Lunar Badges
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {ALL_CHALLENGES.map((c) => {
                const def = challenges.find((x) => x.slug === c.slug);
                const earned = def ? earnedIds.has(def.id) : false;
                return (
                  <motion.div
                    key={c.slug}
                    whileHover={{ y: -4 }}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition ${
                      earned ? "border-aurora/40 bg-aurora/10" : "border-white/5 bg-white/[0.02] opacity-50"
                    }`}
                  >
                    <span className="text-3xl grayscale-[0.3]">{c.icon}</span>
                    <span className="text-xs text-moon-dim">{c.title}</span>
                    {earned && <span className="text-[10px] uppercase tracking-wide text-aurora">Earned</span>}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Settings */}
          <div className="glass rounded-3xl p-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-moon">Settings</h3>

            <div className="flex items-center justify-between border-b border-white/5 py-3">
              <div className="flex items-center gap-2 text-sm text-moon">
                <Bell className="h-4 w-4 text-violet-glow" /> Lunar notifications
              </div>
              <button
                onClick={toggleNotifications}
                disabled={saving}
                className={`relative h-6 w-11 rounded-full transition ${user?.notificationsEnabled ? "bg-aurora/70" : "bg-white/15"}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    user?.notificationsEnabled ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-sm text-moon">
                <KeyRound className="h-4 w-4 text-violet-glow" /> Preferred sign-in
              </div>
              <div className="flex gap-1 rounded-full border border-violet-glow/15 bg-obsidian-soft/60 p-1 text-sm">
                <MethodBtn active={user?.preferredMethod === "otp"} onClick={() => setMethod("otp")} icon={<Mail className="h-3.5 w-3.5" />} label="Magic code" />
                <MethodBtn active={user?.preferredMethod === "password"} onClick={() => setMethod("password")} icon={<KeyRound className="h-3.5 w-3.5" />} label="Password" />
              </div>
            </div>
          </div>

          {/* Recent activity */}
          {profile && profile.recentActivity.length > 0 && (
            <div className="glass rounded-3xl p-6">
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-moon">
                <CalendarClock className="h-5 w-5 text-violet-glow" /> Recent activity
              </h3>
              <ul className="space-y-2">
                {profile.recentActivity.slice(0, 8).map((a, i) => {
                  const def = challenges.find((c) => c.slug === a.slug);
                  return (
                    <li key={i} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-4 py-2.5 text-sm">
                      <span className="flex items-center gap-2 text-moon">
                        <span>{def?.icon ?? "🌙"}</span>
                        {def?.title ?? a.slug}
                      </span>
                      <span className="text-xs text-moon-dim">
                        {new Date(a.logDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      ) : (
        <PortfolioTab />
      )}
    </div>
  );
}

function UserGroup() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Portfolio tab                                                      */
/* ------------------------------------------------------------------ */

function PortfolioTab() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPortfolio()
      .then((d) => setData(seedDefaults(d)))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load your portfolio."))
      .finally(() => setLoading(false));
  }, []);

  function seedDefaults(d: PortfolioData): PortfolioData {
    if (d.favorites.length > 0) return d;
    return {
      ...d,
      favorites: FAVORITE_SEEDS.map((s, i) => ({
        id: uid(),
        kind: s.kind,
        label: s.label,
        value: "",
        sortOrder: i,
      })),
    };
  }

  async function persist(next: PortfolioData) {
    setSaving(true);
    setError(null);
    try {
      const saved = await savePortfolio(next);
      setData(seedDefaults(saved));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your portfolio.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-moon-dim">Summoning your portfolio…</p>;
  if (!data) {
    return (
      <div className="glass rounded-3xl p-6">
        <p className="text-moon-dim">Your portfolio could not be loaded.</p>
        {error && <p className="mt-2 text-sm text-rose-glow">{error}</p>}
      </div>
    );
  }

  const update = (patch: Partial<PortfolioData>) => setData({ ...data, ...patch });

  return (
    <div className="space-y-6">
      <div className="glass-strong rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-moon">Your Portfolio</h2>
          <button
            onClick={() => persist(data)}
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-glow to-indigo-glow px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-glow/30 transition hover:brightness-110 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save portfolio"}
          </button>
        </div>
        <p className="mt-1 text-sm text-moon-dim">
          Organize your life: custom fields, possessions, favorites, and links.
        </p>
        {error && <p className="mt-3 text-sm text-rose-glow">{error}</p>}
      </div>

      {/* Fields */}
      <div className="glass rounded-3xl p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-moon">Fields</h3>
        <FieldTree
          fields={data.fields}
          onChange={(fields) => update({ fields })}
          onSave={(next) => persist({ ...data, fields: next })}
        />
      </div>

      {/* Assets */}
      <div className="glass rounded-3xl p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-moon">Assets</h3>
        <div className="space-y-5">
          {ASSET_GROUPS.map((g) => (
            <AssetGroup
              key={g.kind}
              kind={g.kind}
              title={g.title}
              icon={g.icon}
              assets={data.assets.filter((a) => a.kind === g.kind)}
              onAdd={(asset) => update({ assets: [...data.assets, asset] })}
              onUpdate={(assets) => update({ assets: data.assets.map((a) => assets.find((x) => x.id === a.id) ?? a) })}
              onRemove={(id) => update({ assets: data.assets.filter((a) => a.id !== id) })}
            />
          ))}
        </div>
      </div>

      {/* Favorites */}
      <div className="glass rounded-3xl p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-moon">Favorites</h3>
        <div className="space-y-3">
          {data.favorites.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-xl border border-violet-glow/15 bg-white/[0.02] px-4 py-2.5">
              <span className="w-40 shrink-0 text-sm text-moon-dim">{f.label}</span>
              <input
                value={f.value}
                onChange={(e) =>
                  update({ favorites: data.favorites.map((x) => (x.id === f.id ? { ...x, value: e.target.value } : x)) })
                }
                placeholder="Your answer"
                className="w-full rounded-lg border border-violet-glow/15 bg-obsidian-soft/60 px-3 py-1.5 text-sm text-moon placeholder:text-moon-dim/60 outline-none focus:ring-1 focus:ring-violet-glow/40"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="glass rounded-3xl p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-moon">Links</h3>
        <div className="space-y-4">
          {data.links.map((link) => (
            <div key={link.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-violet-glow/15 bg-white/[0.02] px-4 py-2.5">
              <input
                value={link.label}
                onChange={(e) =>
                  update({ links: data.links.map((x) => (x.id === link.id ? { ...x, label: e.target.value } : x)) })
                }
                placeholder="Label"
                className="w-40 rounded-lg border border-violet-glow/15 bg-obsidian-soft/60 px-3 py-1.5 text-sm text-moon placeholder:text-moon-dim/60 outline-none focus:ring-1 focus:ring-violet-glow/40"
              />
              <input
                value={link.url}
                onChange={(e) =>
                  update({ links: data.links.map((x) => (x.id === link.id ? { ...x, url: e.target.value } : x)) })
                }
                placeholder="https://…"
                className="flex-1 rounded-lg border border-violet-glow/15 bg-obsidian-soft/60 px-3 py-1.5 text-sm text-moon placeholder:text-moon-dim/60 outline-none focus:ring-1 focus:ring-violet-glow/40"
              />
              <label className="flex items-center gap-1.5 text-xs text-moon-dim">
                <input
                  type="checkbox"
                  checked={link.isLinktree}
                  onChange={(e) =>
                    update({ links: data.links.map((x) => (x.id === link.id ? { ...x, isLinktree: e.target.checked } : x)) })
                  }
                  className="accent-aurora"
                />
                Linktree
              </label>
              <button
                onClick={() => update({ links: data.links.filter((x) => x.id !== link.id) })}
                className="grid h-8 w-8 place-items-center rounded-full text-moon-dim transition hover:text-rose-glow"
                title="Remove link"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              update({
                links: [
                  ...data.links,
                  { id: uid(), url: "", label: "", isLinktree: false, sortOrder: data.links.length },
                ],
              })
            }
            className="flex items-center gap-2 rounded-full border border-violet-glow/15 px-4 py-2 text-sm text-moon-dim transition hover:text-moon"
          >
            <Plus className="h-4 w-4" /> Add link
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fields (recursive tree)                                            */
/* ------------------------------------------------------------------ */

function FieldTree({
  fields,
  onChange,
  onSave,
}: {
  fields: ProfileField[];
  onChange: (fields: ProfileField[]) => void;
  onSave: (fields: ProfileField[]) => void;
}) {
  function updateField(list: ProfileField[], id: string, patch: Partial<ProfileField>): ProfileField[] {
    return list.map((f) => {
      if (f.id === id) return { ...f, ...patch };
      if (f.children) return { ...f, children: updateField(f.children, id, patch) };
      return f;
    });
  }

  function addChild(list: ProfileField[], parentId: string): ProfileField[] {
    return list.map((f) => {
      if (f.id === parentId) {
        const child: ProfileField = {
          id: uid(),
          parentId,
          title: "",
          valueText: "",
          valueInt: null,
          valueJson: [],
          fieldType: "text",
          sortOrder: (f.children?.length ?? 0),
          children: [],
        };
        return { ...f, children: [...(f.children ?? []), child] };
      }
      if (f.children) return { ...f, children: addChild(f.children, parentId) };
      return f;
    });
  }

  function removeField(list: ProfileField[], id: string): ProfileField[] {
    return list
      .filter((f) => f.id !== id)
      .map((f) => (f.children ? { ...f, children: removeField(f.children, id) } : f));
  }

  return (
    <div className="space-y-3">
      {fields.map((f) => (
        <div key={f.id} className="rounded-xl border border-violet-glow/15 bg-white/[0.02] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={f.title}
              onChange={(e) => onChange(updateField(fields, f.id, { title: e.target.value }))}
              placeholder="Field title"
              className="flex-1 rounded-lg border border-violet-glow/15 bg-obsidian-soft/60 px-3 py-1.5 text-sm text-moon placeholder:text-moon-dim/60 outline-none focus:ring-1 focus:ring-violet-glow/40"
            />
            {f.fieldType === "integer" ? (
              <input
                type="number"
                value={f.valueInt ?? ""}
                onChange={(e) =>
                  onChange(updateField(fields, f.id, { valueInt: e.target.value === "" ? null : Number(e.target.value) }))
                }
                placeholder="Number"
                className="w-24 rounded-lg border border-violet-glow/15 bg-obsidian-soft/60 px-3 py-1.5 text-sm text-moon outline-none focus:ring-1 focus:ring-violet-glow/40"
              />
            ) : (
              <input
                value={f.valueText}
                onChange={(e) => onChange(updateField(fields, f.id, { valueText: e.target.value }))}
                placeholder="Value"
                className="flex-1 rounded-lg border border-violet-glow/15 bg-obsidian-soft/60 px-3 py-1.5 text-sm text-moon placeholder:text-moon-dim/60 outline-none focus:ring-1 focus:ring-violet-glow/40"
              />
            )}
            <button
              onClick={() => onChange(addChild(fields, f.id))}
              className="grid h-8 w-8 place-items-center rounded-full text-moon-dim transition hover:text-aurora"
              title="Add sub-field"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => onChange(removeField(fields, f.id))}
              className="grid h-8 w-8 place-items-center rounded-full text-moon-dim transition hover:text-rose-glow"
              title="Remove field"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {f.children && f.children.length > 0 && (
            <div className="ml-4 mt-3 border-l border-violet-glow/15 pl-4">
              <FieldTree fields={f.children} onChange={(children) => onChange(updateField(fields, f.id, { children }))} onSave={onSave} />
            </div>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <button
          onClick={() =>
            onChange([
              ...fields,
              {
                id: uid(),
                parentId: null,
                title: "",
                valueText: "",
                valueInt: null,
                valueJson: [],
                fieldType: "text",
                sortOrder: fields.length,
                children: [],
              },
            ])
          }
          className="flex items-center gap-2 rounded-full border border-violet-glow/15 px-4 py-2 text-sm text-moon-dim transition hover:text-moon"
        >
          <Plus className="h-4 w-4" /> Add field
        </button>
        <button
          onClick={() => onSave(fields)}
          className="flex items-center gap-2 rounded-full border border-violet-glow/15 px-4 py-2 text-sm text-moon-dim transition hover:text-moon"
        >
          <Save className="h-4 w-4" /> Save fields
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Assets group                                                       */
/* ------------------------------------------------------------------ */

function AssetGroup({
  kind,
  title,
  icon,
  assets,
  onAdd,
  onUpdate,
  onRemove,
}: {
  kind: UserAssetKind;
  title: string;
  icon: ReactNode;
  assets: UserAsset[];
  onAdd: (asset: UserAsset) => void;
  onUpdate: (assets: UserAsset[]) => void;
  onRemove: (id: string) => void;
}) {
  const [titleText, setTitleText] = useState("");
  const [detail, setDetail] = useState("");

  function add() {
    if (!titleText.trim()) return;
    onAdd({
      id: uid(),
      kind,
      title: titleText.trim(),
      detail,
      sortOrder: assets.length,
    });
    setTitleText("");
    setDetail("");
  }

  return (
    <div>
      <h4 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-moon">
        <span className="text-lg">{icon}</span> {title}
      </h4>
      <div className="space-y-2">
        {assets.map((a) => (
          <div key={a.id} className="flex items-start gap-3 rounded-xl border border-violet-glow/15 bg-white/[0.02] px-4 py-2.5">
            <div className="flex-1">
              <input
                value={a.title}
                onChange={(e) => onUpdate(assets.map((x) => (x.id === a.id ? { ...x, title: e.target.value } : x)))}
                className="w-full rounded-lg border border-violet-glow/15 bg-obsidian-soft/60 px-3 py-1.5 text-sm text-moon outline-none focus:ring-1 focus:ring-violet-glow/40"
              />
              <textarea
                value={typeof a.detail === "string" ? a.detail : JSON.stringify(a.detail ?? "")}
                onChange={(e) => onUpdate(assets.map((x) => (x.id === a.id ? { ...x, detail: e.target.value } : x)))}
                rows={2}
                placeholder="Details"
                className="mt-2 w-full resize-y rounded-lg border border-violet-glow/15 bg-obsidian-soft/60 px-3 py-1.5 text-sm text-moon placeholder:text-moon-dim/60 outline-none focus:ring-1 focus:ring-violet-glow/40"
              />
            </div>
            <button
              onClick={() => onRemove(a.id)}
              className="grid h-8 w-8 place-items-center rounded-full text-moon-dim transition hover:text-rose-glow"
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          value={titleText}
          onChange={(e) => setTitleText(e.target.value)}
          placeholder="Title"
          className="w-40 rounded-lg border border-violet-glow/15 bg-obsidian-soft/60 px-3 py-1.5 text-sm text-moon placeholder:text-moon-dim/60 outline-none focus:ring-1 focus:ring-violet-glow/40"
        />
        <input
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Detail"
          className="flex-1 rounded-lg border border-violet-glow/15 bg-obsidian-soft/60 px-3 py-1.5 text-sm text-moon placeholder:text-moon-dim/60 outline-none focus:ring-1 focus:ring-violet-glow/40"
        />
        <button
          onClick={add}
          className="flex items-center gap-2 rounded-full border border-violet-glow/15 px-3 py-1.5 text-sm text-moon-dim transition hover:text-moon"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared small components                                            */
/* ------------------------------------------------------------------ */

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-violet-glow/15 bg-white/[0.02] p-4 text-center">
      <div className="mb-1 flex justify-center">{icon}</div>
      <div className="font-display text-2xl font-semibold text-moon">{value}</div>
      <div className="text-xs text-moon-dim">{label}</div>
    </div>
  );
}

function MethodBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
        active ? "bg-violet-glow/30 text-moon" : "text-moon-dim hover:text-moon"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
