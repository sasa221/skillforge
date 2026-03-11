export type Profile = {
  id: string;
  userId: string;
  fullName: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  learningGoals: string | null;
  interests: string[];
  xp: number;
  level: number;
  streakDays: number;
  streakUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

