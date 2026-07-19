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

export type NotebookType = "journal" | "dream" | "logbook" | "goal" | "schedule" | "idea";

export interface NotebookEntry {
  id: string;
  entryType: NotebookType;
  title: string;
  body: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MoonEvent {
  id: string;
  title: string;
  eventDate: string;
  rarity: string;
  synopsis: string;
  category: string;
  source: string;
}

export type ProfileFieldType = "text" | "integer" | "multi" | "nested";

export interface ProfileField {
  id: string;
  parentId: string | null;
  title: string;
  valueText: string;
  valueInt: number | null;
  valueJson: unknown[];
  fieldType: ProfileFieldType;
  sortOrder: number;
  children?: ProfileField[];
}

export type UserAssetKind = "car" | "bicycle" | "pets" | "jewelry" | "clothing";

export interface UserAsset {
  id: string;
  kind: UserAssetKind;
  title: string;
  detail: unknown;
  sortOrder: number;
}

export interface UserFavorite {
  id: string;
  kind: string;
  label: string;
  value: string;
  sortOrder: number;
}

export interface UserLink {
  id: string;
  url: string;
  label: string;
  isLinktree: boolean;
  sortOrder: number;
}

export interface PortfolioData {
  fields: ProfileField[];
  assets: UserAsset[];
  favorites: UserFavorite[];
  links: UserLink[];
}
