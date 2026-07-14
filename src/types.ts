export interface User {
  id: string;
  email: string;
  displayName: string;
  authMethod: "otp" | "password";
  preferredMethod: "otp" | "password";
  notificationsEnabled: boolean;
  streak: number;
  longestStreak: number;
  createdAt: string;
}

export interface ChallengeDefinition {
  id: string;
  slug: string;
  title: string;
  description: string;
  prompt: string;
  moonPhase: string;
  icon: string;
  sortOrder: number;
}

export interface ChallengeState {
  challengeId: string;
  slug: string;
  logDate: string;
  data: Record<string, unknown>;
  completed: boolean;
  updatedAt: string;
}

export interface ChallengeWithState extends ChallengeDefinition {
  userState: ChallengeState | null;
}

export interface Badge {
  challengeId: string;
  title: string;
  icon: string;
  awardedAt: string;
}

export interface CalendarDay {
  date: string;
  day: number;
  phase: string;
  phaseCode: string;
  phaseEmoji: string;
  illumination: number;
  completedChallenges: string[] | null;
}

export interface ProfileData {
  user: User;
  badges: Badge[];
  streak: number;
  longestStreak: number;
  totalCompleted: number;
  recentActivity: Array<{
    slug: string;
    logDate: string;
    completed: boolean;
    data: Record<string, unknown>;
  }>;
}
