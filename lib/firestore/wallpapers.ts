import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Wallpaper } from "@/types/wallpaper";

type CreateWallpaperInput = Omit<Wallpaper, "id" | "createdAt" | "updatedAt">;

const wallpapersCollection = collection(db, "wallpapers");

export async function createWallpaper(data: CreateWallpaperInput) {
  const docRef = await addDoc(wallpapersCollection, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function listWallpapers(maxItems = 20) {
  const snapshot = await getDocs(
    query(wallpapersCollection, orderBy("createdAt", "desc"), limit(maxItems))
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<Wallpaper, "id">),
  }));
}

export async function listRecentWallpapers(maxItems = 6) {
  return listWallpapers(maxItems);
}

export async function listPublishedWallpapers(maxItems = 18) {
  const snapshot = await getDocs(
    query(
      wallpapersCollection,
      where("isPublished", "==", true),
      orderBy("createdAt", "desc"),
      limit(maxItems)
    )
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<Wallpaper, "id">),
  }));
}

export async function getWallpaperStats() {
  const [allCount, publishedCount] = await Promise.all([
    getCountFromServer(wallpapersCollection),
    getCountFromServer(query(wallpapersCollection, where("isPublished", "==", true))),
  ]);

  return {
    total: allCount.data().count,
    published: publishedCount.data().count,
  };
}

export async function deleteWallpaper(id: string) {
  await deleteDoc(doc(db, "wallpapers", id));
}
