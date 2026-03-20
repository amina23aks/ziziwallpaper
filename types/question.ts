import type { FieldValue, Timestamp } from "firebase/firestore";

export type Question = {
  id?: string;
  title: string;
  imageUrl: string;
  wallpaperId?: string;
  wallpaperTitle?: string;
  slug: string;
  isActive: boolean;
  createdAt?: Timestamp | FieldValue | null;
  updatedAt?: Timestamp | FieldValue | null;
};
