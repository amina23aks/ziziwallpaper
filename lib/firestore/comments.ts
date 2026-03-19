import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { CommentDisplayIdentityMode, WallpaperComment } from "@/types/comment";

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
  displayIdentityMode?: CommentDisplayIdentityMode;
  content: string;
  parentId?: string | null;
  isAdminReply?: boolean;
}) {
  const identityMode = input.displayIdentityMode ?? "real";

  const docRef = await addDoc(commentsCollection, {
    wallpaperId: input.wallpaperId,
    userId: input.userId,
    userDisplayName: input.userDisplayName,
    displayIdentityMode: identityMode,
    isAnonymous: identityMode !== "real",
    content: input.content.trim(),
    parentId: input.parentId ?? null,
    isAdminReply: Boolean(input.isAdminReply),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateWallpaperComment(input: {
  commentId: string;
  content: string;
  displayIdentityMode: CommentDisplayIdentityMode;
}) {
  await updateDoc(doc(commentsCollection, input.commentId), {
    content: input.content.trim(),
    displayIdentityMode: input.displayIdentityMode,
    isAnonymous: input.displayIdentityMode !== "real",
    updatedAt: serverTimestamp(),
  });
}

export async function deleteWallpaperComment(input: {
  commentId: string;
  replyIds?: string[];
}) {
  const ids = [input.commentId, ...(input.replyIds ?? [])];

  if (ids.length <= 1) {
    await deleteDoc(doc(commentsCollection, input.commentId));
    return;
  }

  const batch = writeBatch(db);
  ids.forEach((id) => {
    batch.delete(doc(commentsCollection, id));
  });
  await batch.commit();
}
