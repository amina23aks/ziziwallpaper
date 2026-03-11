import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { Wallpaper } from "@/types/wallpaper";

type CreateWallpaperInput = Omit<Wallpaper, "id" | "createdAt" | "updatedAt">;

export async function createWallpaper(data: CreateWallpaperInput) {
  const wallpapersRef = collection(db, "wallpapers");

  return addDoc(wallpapersRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
