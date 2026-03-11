import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Wallpaper } from "@/types/wallpaper";

type CreateWallpaperInput = Omit<Wallpaper, "id" | "createdAt" | "updatedAt">;

export async function createWallpaper(data: CreateWallpaperInput) {
  const docRef = await addDoc(collection(db, "wallpapers"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}
