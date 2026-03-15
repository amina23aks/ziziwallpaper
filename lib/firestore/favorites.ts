import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type FavoriteRecord = {
  id: string;
  userId: string;
  wallpaperId: string;
  createdAt?: unknown;
};

const favoritesCollection = collection(db, "favorites");

function getFavoriteDocId(userId: string, wallpaperId: string) {
  return `${userId}_${wallpaperId}`;
}

export function getFavoriteDocumentId(userId: string, wallpaperId: string) {
  return getFavoriteDocId(userId, wallpaperId);
}

export async function addFavorite(userId: string, wallpaperId: string) {
  const favoriteId = getFavoriteDocId(userId, wallpaperId);

  await setDoc(doc(db, "favorites", favoriteId), {
    userId,
    wallpaperId,
    createdAt: serverTimestamp(),
  });

  return favoriteId;
}

export async function removeFavorite(userId: string, wallpaperId: string) {
  const favoriteId = getFavoriteDocId(userId, wallpaperId);
  await deleteDoc(doc(db, "favorites", favoriteId));
}


export async function isWallpaperFavoritedByUser(userId: string, wallpaperId: string) {
  const favoriteId = getFavoriteDocId(userId, wallpaperId);
  const snapshot = await getDoc(doc(db, "favorites", favoriteId));
  return snapshot.exists();
}
export async function listFavoritesByUser(userId: string, maxItems = 200) {
  let snapshot;

  try {
    snapshot = await getDocs(
      query(favoritesCollection, where("userId", "==", userId), orderBy("createdAt", "desc"), limit(maxItems))
    );
  } catch {
    snapshot = await getDocs(query(favoritesCollection, where("userId", "==", userId), limit(maxItems)));
  }

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<FavoriteRecord, "id">),
  }));
}

export async function listFavoriteWallpaperIdsByUser(userId: string, maxItems = 200) {
  const favorites = await listFavoritesByUser(userId, maxItems);
  return favorites.map((item) => item.wallpaperId).filter(Boolean);
}
