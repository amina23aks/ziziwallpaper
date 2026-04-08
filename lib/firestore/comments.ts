import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { CommentDisplayIdentityMode, WallpaperComment } from "@/types/comment";

const commentsCollection = collection(db, "comments");
const DEFAULT_ROOT_PAGE_SIZE = 12;

type CommentDoc = Omit<WallpaperComment, "id">;

type RootCommentsPageResult = {
  comments: WallpaperComment[];
  cursor: QueryDocumentSnapshot<CommentDoc> | null;
  hasMore: boolean;
};

export function toClientTimestamp(date = new Date()) {
  return Timestamp.fromDate(date);
}

function mapCommentSnapshot(snapshot: DocumentSnapshot<CommentDoc>): WallpaperComment {
  return { id: snapshot.id, ...(snapshot.data() as CommentDoc) };
}

export async function listWallpaperRootCommentsPage(input: {
  wallpaperId: string;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<CommentDoc> | null;
  loadedCount?: number;
}): Promise<RootCommentsPageResult> {
  const pageSize = Math.max(1, input.pageSize ?? DEFAULT_ROOT_PAGE_SIZE);
  const constraints = [
    where("wallpaperId", "==", input.wallpaperId),
    where("parentId", "==", null),
    orderBy("createdAt", "desc"),
    orderBy(documentId(), "desc"),
  ] as const;

  try {
    const pageQuery = input.cursor
      ? query(commentsCollection, ...constraints, startAfter(input.cursor), limit(pageSize + 1))
      : query(commentsCollection, ...constraints, limit(pageSize + 1));
    const snapshot = await getDocs(pageQuery);
    const docs = snapshot.docs as QueryDocumentSnapshot<CommentDoc>[];
    const hasMore = docs.length > pageSize;
    const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;
    const rootComments = pageDocs.map((item) => mapCommentSnapshot(item));
    const cursor = pageDocs.at(-1) ?? input.cursor ?? null;

    return {
      comments: rootComments,
      cursor,
      hasMore,
    };
  } catch (error) {
    const errorCode = (error as { code?: string } | null)?.code ?? "";
    const errorMessage = (error as { message?: string } | null)?.message ?? "";
    const isIndexError = errorCode === "failed-precondition" || /index/i.test(errorMessage);
    if (isIndexError) {
      throw error;
    }

    const loadedCount = Math.max(0, input.loadedCount ?? 0);
    const fallbackSnapshot = await getDocs(
      query(
        commentsCollection,
        where("wallpaperId", "==", input.wallpaperId),
        where("parentId", "==", null),
        limit(loadedCount + pageSize + 1)
      )
    );
    const fallbackItems = fallbackSnapshot.docs
      .map((item) => ({ id: item.id, ...(item.data() as CommentDoc) }))
      .sort((left, right) => {
        const leftSeconds = (left.createdAt as { seconds?: number } | null | undefined)?.seconds ?? 0;
        const rightSeconds = (right.createdAt as { seconds?: number } | null | undefined)?.seconds ?? 0;
        if (leftSeconds !== rightSeconds) return rightSeconds - leftSeconds;
        return (right.id ?? "").localeCompare(left.id ?? "");
      });
    const paged = fallbackItems.slice(loadedCount, loadedCount + pageSize);

    return {
      comments: paged,
      cursor: null,
      hasMore: fallbackItems.length > loadedCount + pageSize,
    };
  }
}

export async function listCommentDirectReplies(input: {
  wallpaperId: string;
  parentId: string;
}): Promise<WallpaperComment[]> {
  try {
    const snapshot = await getDocs(
      query(
        commentsCollection,
        where("wallpaperId", "==", input.wallpaperId),
        where("parentId", "==", input.parentId),
        orderBy("createdAt", "asc"),
        orderBy(documentId(), "asc")
      )
    );

    return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as CommentDoc) }));
  } catch {
    const fallbackSnapshot = await getDocs(
      query(
        commentsCollection,
        where("wallpaperId", "==", input.wallpaperId),
        where("parentId", "==", input.parentId)
      )
    );

    return fallbackSnapshot.docs
      .map((item) => ({ id: item.id, ...(item.data() as CommentDoc) }))
      .sort((left, right) => {
        const leftSeconds = (left.createdAt as { seconds?: number } | null | undefined)?.seconds ?? 0;
        const rightSeconds = (right.createdAt as { seconds?: number } | null | undefined)?.seconds ?? 0;
        if (leftSeconds !== rightSeconds) return leftSeconds - rightSeconds;
        return (left.id ?? "").localeCompare(right.id ?? "");
      });
  }
}

export async function listCommentReplyTree(input: {
  wallpaperId: string;
  parentId: string;
}): Promise<WallpaperComment[]> {
  const collected = new Map<string, WallpaperComment>();
  let frontier = [input.parentId];

  while (frontier.length > 0) {
    const chunk = frontier.slice(0, 10);
    frontier = frontier.slice(10);

    const snapshot = await getDocs(
      query(
        commentsCollection,
        where("wallpaperId", "==", input.wallpaperId),
        where("parentId", "in", chunk)
      )
    );

    const children = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as CommentDoc) }));
    children.forEach((child) => {
      if (child.id) {
        collected.set(child.id, child);
        frontier.push(child.id);
      }
    });
  }

  return [...collected.values()].sort((left, right) => {
    const leftSeconds = (left.createdAt as { seconds?: number } | null | undefined)?.seconds ?? 0;
    const rightSeconds = (right.createdAt as { seconds?: number } | null | undefined)?.seconds ?? 0;
    if (leftSeconds !== rightSeconds) return leftSeconds - rightSeconds;
    return (left.id ?? "").localeCompare(right.id ?? "");
  });
}

export async function checkCommentHasDirectReplies(input: {
  wallpaperId: string;
  parentId: string;
}): Promise<boolean> {
  const snapshot = await getDocs(
    query(
      commentsCollection,
      where("wallpaperId", "==", input.wallpaperId),
      where("parentId", "==", input.parentId),
      limit(1)
    )
  );
  return !snapshot.empty;
}

export async function listCommentDescendantIds(input: {
  wallpaperId: string;
  parentId: string;
}): Promise<string[]> {
  const descendants: string[] = [];
  let frontier = [input.parentId];

  while (frontier.length > 0) {
    const parentChunk = frontier.slice(0, 10);
    frontier = frontier.slice(10);

    const snapshot = await getDocs(
      query(
        commentsCollection,
        where("wallpaperId", "==", input.wallpaperId),
        where("parentId", "in", parentChunk)
      )
    );

    const childIds = snapshot.docs.map((item) => item.id);
    if (childIds.length === 0) continue;

    descendants.push(...childIds);
    frontier.push(...childIds);
  }

  return descendants;
}

export async function createWallpaperComment(input: {
  wallpaperId: string;
  userId: string;
  userDisplayName: string;
  displayIdentityMode?: CommentDisplayIdentityMode;
  content: string;
  parentId?: string | null;
  isAdminReply?: boolean;
  isAdminAuthor?: boolean;
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
    isAdminAuthor: Boolean(input.isAdminAuthor ?? input.isAdminReply),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateWallpaperComment(input: {
  commentId: string;
  content: string;
}) {
  await updateDoc(doc(commentsCollection, input.commentId), {
    content: input.content.trim(),
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

  for (let index = 0; index < ids.length; index += 500) {
    const batch = writeBatch(db);
    ids.slice(index, index + 500).forEach((id) => {
      batch.delete(doc(commentsCollection, id));
    });
    await batch.commit();
  }
}
