import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { WallpaperComment } from "@/types/comment";

const commentsCollection = collection(db, "comments");

export async function listWallpaperComments(wallpaperId: string, maxItems = 200) {
  let snapshot;

  try {
    snapshot = await getDocs(
      query(
        commentsCollection,
        where("wallpaperId", "==", wallpaperId),
        orderBy("createdAt", "asc"),
        limit(maxItems)
      )
    );
  } catch {
    snapshot = await getDocs(
      query(commentsCollection, where("wallpaperId", "==", wallpaperId), limit(maxItems))
    );
  }

  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<WallpaperComment, "id">) }))
    .sort((a, b) => {
      const aSec = (a.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
      const bSec = (b.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
      return aSec - bSec;
    });
}

export async function createWallpaperComment(input: {
  wallpaperId: string;
  userId: string;
  userDisplayName: string;
  content: string;
  parentId?: string | null;
  isAdminReply?: boolean;
}) {
  const docRef = await addDoc(commentsCollection, {
    wallpaperId: input.wallpaperId,
    userId: input.userId,
    userDisplayName: input.userDisplayName,
    content: input.content.trim(),
    parentId: input.parentId ?? null,
    isAdminReply: Boolean(input.isAdminReply),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}
