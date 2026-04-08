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
}): Promise<RootCommentsPageResult> {
  const pageSize = Math.max(1, input.pageSize ?? DEFAULT_ROOT_PAGE_SIZE);

  const constraints = [
    where("wallpaperId", "==", input.wallpaperId),
    where("parentId", "==", null),
    orderBy("createdAt", "asc"),
    orderBy(documentId(), "asc"),
    limit(pageSize + 1),
  ] as const;

  const baseQuery = input.cursor
    ? query(commentsCollection, ...constraints, startAfter(input.cursor))
    : query(commentsCollection, ...constraints);

  const snapshot = await getDocs(baseQuery);
  const docs = snapshot.docs as QueryDocumentSnapshot<CommentDoc>[];
  const hasMore = docs.length > pageSize;
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

  return {
    comments: pageDocs.map(mapCommentSnapshot),
    cursor: pageDocs.at(-1) ?? null,
    hasMore,
  };
}

export async function listCommentDirectReplies(input: {
  wallpaperId: string;
  parentId: string;
}): Promise<WallpaperComment[]> {
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
