import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Wallpaper } from "@/types/wallpaper";

type CreateWallpaperInput = Omit<Wallpaper, "id" | "createdAt" | "updatedAt">;
type UpdateWallpaperInput = Omit<Wallpaper, "id" | "createdAt" | "updatedAt">;

const wallpapersCollection = collection(db, "wallpapers");

export async function createWallpaper(data: CreateWallpaperInput) {
  const docRef = await addDoc(wallpapersCollection, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateWallpaper(id: string, data: UpdateWallpaperInput) {
  await updateDoc(doc(db, "wallpapers", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getWallpaperById(id: string): Promise<Wallpaper | null> {
  const snapshot = await getDoc(doc(db, "wallpapers", id));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Wallpaper, "id">),
  };
}

export async function listWallpapers(maxItems = 20) {
  let snapshot;

  try {
    snapshot = await getDocs(
      query(wallpapersCollection, orderBy("createdAt", "desc"), limit(maxItems))
    );
  } catch {
    snapshot = await getDocs(query(wallpapersCollection, limit(maxItems)));
  }

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<Wallpaper, "id">),
  }));
}

export async function listRecentWallpapers(maxItems = 6) {
  return listWallpapers(maxItems);
}

export async function listPublishedWallpapers(maxItems = 30) {
  let snapshot;

  try {
    snapshot = await getDocs(
      query(
        wallpapersCollection,
        where("isPublished", "==", true),
        orderBy("createdAt", "desc"),
        limit(maxItems)
      )
    );
  } catch {
    snapshot = await getDocs(
      query(wallpapersCollection, where("isPublished", "==", true), limit(maxItems))
    );
  }

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<Wallpaper, "id">),
  }));
}



export async function listPublishedWallpapersByCategory(categorySlug: string, maxItems = 12) {
  let snapshot;

  try {
    snapshot = await getDocs(
      query(
        wallpapersCollection,
        where("isPublished", "==", true),
        where("categorySlugs", "array-contains", categorySlug),
        orderBy("createdAt", "desc"),
        limit(maxItems)
      )
    );
  } catch {
    snapshot = await getDocs(
      query(
        wallpapersCollection,
        where("isPublished", "==", true),
        where("categorySlugs", "array-contains", categorySlug),
        limit(maxItems)
      )
    );
  }

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<Wallpaper, "id">),
  }));
}

export async function listPublishedWallpapersByQuestionPrompt(
  questionPromptSlug: string,
  maxItems = 50
) {
  let snapshot;

  try {
    snapshot = await getDocs(
      query(
        wallpapersCollection,
        where("isPublished", "==", true),
        where("questionPromptSlugs", "array-contains", questionPromptSlug),
        orderBy("createdAt", "desc"),
        limit(maxItems)
      )
    );
  } catch {
    snapshot = await getDocs(
      query(
        wallpapersCollection,
        where("isPublished", "==", true),
        where("questionPromptSlugs", "array-contains", questionPromptSlug),
        limit(maxItems)
      )
    );
  }

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<Wallpaper, "id">),
  }));
}

export async function listPublishedWallpapersByQuestionId(questionId: string, maxItems = 50) {
  let snapshot;

  try {
    snapshot = await getDocs(
      query(
        wallpapersCollection,
        where("isPublished", "==", true),
        where("questionIds", "array-contains", questionId),
        orderBy("createdAt", "desc"),
        limit(maxItems)
      )
    );
  } catch {
    snapshot = await getDocs(
      query(
        wallpapersCollection,
        where("isPublished", "==", true),
        where("questionIds", "array-contains", questionId),
        limit(maxItems)
      )
    );
  }

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
