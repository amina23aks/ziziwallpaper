import type { FieldValue, Timestamp } from "firebase/firestore";

export type WallpaperComment = {
  id?: string;
  wallpaperId: string;
  parentId?: string | null;
  userId: string;
  userDisplayName: string;
  content: string;
  isAdminReply?: boolean;
  createdAt?: Timestamp | FieldValue | null;
  updatedAt?: Timestamp | FieldValue | null;
};
