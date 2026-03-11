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
  images: WallpaperImage[];
  isPublished: boolean;
  // Firestore timestamp shape can vary between client/server reads at this stage.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updatedAt?: any;
};
