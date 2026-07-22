import { useEffect, useState, type ComponentType } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import type { ChallengeDefinition, ChallengeState } from "@/types";
import type { ModuleProps } from "@/components/challenges/shared";
import NewMoonReflection from "@/components/challenges/NewMoonReflection";
import WaxingCrescentFocus from "@/components/challenges/WaxingCrescentFocus";
import FullMoonRelease from "@/components/challenges/FullMoonRelease";
import WaningGratitude from "@/components/challenges/WaningGratitude";
import BalsamicRest from "@/components/challenges/BalsamicRest";
import ChallengeChat from "@/components/challenges/ChallengeChat";

const MODULES: Record<string, ComponentType<ModuleProps>> = {
  "new-moon-reflection": NewMoonReflection,
  "waxing-crescent-focus": WaxingCrescentFocus,
  "full-moon-release": FullMoonRelease,
  "waning-gratitude": WaningGratitude,
  "balsamic-rest": BalsamicRest,
};

export default function ChallengeDetail() {
  const { slug = "" } = useParams();
  const [challenge, setChallenge] = useState<ChallengeDefinition | null>(null);
  const [state, setState] = useState<ChallengeState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<{ challenge: ChallengeDefinition; userState: ChallengeState | null }>(
        `/challenges/${slug}`,
      )
      .then((d) => {
        setChallenge(d.challenge);
        setState(d.userState);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <p className="text-moon-dim">summoning the ritual…</p>;
  }
  if (!challenge) {
    return (
      <div className="text-center text-moon-dim">
        Challenge not found.{" "}
        <Link to="/challenges" className="text-violet-glow underline">
          Back to challenges
        </Link>
      </div>
    );
  }

  const Module = MODULES[slug];

  const onSave = async (data: Record<string, unknown>, completed: boolean) => {
    const res = await api.put<{ userState: ChallengeState }>(`/challenges/${slug}`, {
      data,
      completed,
    });
    setState(res.userState);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        to="/challenges"
        className="inline-flex items-center gap-1.5 text-sm text-moon-dim transition hover:text-moon"
      >
        <ArrowLeft className="h-4 w-4" /> All challenges
      </Link>
      {Module && <Module challenge={challenge} state={state} onSave={onSave} />}
      <ChallengeChat challengeSlug={slug} />
    </div>
  );
}
