import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Flame, CalendarClock, Award, Bell, KeyRound, Mail, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Badge, ChallengeDefinition, ProfileData } from "@/types";

const ALL_CHALLENGES = [
  { id: "", slug: "new-moon-reflection", title: "New Moon Reflection", icon: "🌑" },
  { id: "", slug: "waxing-crescent-focus", title: "Waxing Crescent Focus", icon: "🌒" },
  { id: "", slug: "full-moon-release", title: "Full Moon Release", icon: "🌕" },
  { id: "", slug: "waning-gratitude", title: "Waning Gibbous Gratitude", icon: "🌖" },
  { id: "", slug: "balsamic-rest", title: "Balsamic Moon Rest", icon: "🌘" },
];

export default function Profile() {
  const { user, updateSettings } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [challenges, setChallenges] = useState<ChallengeDefinition[]>([]);
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-semibold text-gradient">Your Profile</h1>

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
                  earned
                    ? "border-aurora/40 bg-aurora/10"
                    : "border-white/5 bg-white/[0.02] opacity-50"
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
            className={`relative h-6 w-11 rounded-full transition ${
              user?.notificationsEnabled ? "bg-aurora/70" : "bg-white/15"
            }`}
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
    </div>
  );
}

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
