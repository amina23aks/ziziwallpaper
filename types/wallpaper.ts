import type { FieldValue, Timestamp } from "firebase/firestore";

export type WallpaperImage = {
  secureUrl: string;
  alt: string;
};

export type Wallpaper = {
  id?: string;
  title: string;
  description: string;
  categorySlugs: string[];
  searchKeywords: string[];
  moodTags: string[];
  questionPromptSlugs?: string[];
  questionIds?: string[];
  images: WallpaperImage[];
  isPublished: boolean;
  createdAt?: Timestamp | FieldValue | null;
  updatedAt?: Timestamp | FieldValue | null;
};
