import {
  addDoc,
  collection,
  type DocumentData,
  deleteField,
  deleteDoc,
  doc,
  documentId,
  type QueryDocumentSnapshot,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Wallpaper } from "@/types/wallpaper";

type CreateWallpaperInput = Omit<Wallpaper, "id" | "createdAt" | "updatedAt">;
type UpdateWallpaperInput = Omit<Wallpaper, "id" | "createdAt" | "updatedAt">;

const wallpapersCollection = collection(db, "wallpapers");
const FIRESTORE_IN_LIMIT = 10;

function mapWallpaper(snapshot: { id: string; data: () => unknown }) {
  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Wallpaper, "id">),
  };
}

function sortWallpapersByNewest(items: Wallpaper[]) {
  return [...items].sort((left, right) => {
    const leftSeconds = (left.createdAt as { seconds?: number } | null | undefined)?.seconds ?? 0;
    const rightSeconds = (right.createdAt as { seconds?: number } | null | undefined)?.seconds ?? 0;

    if (rightSeconds !== leftSeconds) {
      return rightSeconds - leftSeconds;
    }

    return (right.id ?? "").localeCompare(left.id ?? "");
  });
}

function buildQuestionLookup(questionId: string, legacyQuestionIds: string[] = [], legacyQuestionPromptSlug?: string) {
  return {
    questionId,
    questionIds: Array.from(new Set([questionId, ...legacyQuestionIds].filter(Boolean))),
    questionPromptSlugs: legacyQuestionPromptSlug ? [legacyQuestionPromptSlug] : [],
  };
}

function chunkIds(ids: string[]) {
  const chunks: string[][] = [];

  for (let index = 0; index < ids.length; index += FIRESTORE_IN_LIMIT) {
    chunks.push(ids.slice(index, index + FIRESTORE_IN_LIMIT));
  }

  return chunks;
}

export async function createWallpaper(data: CreateWallpaperInput) {
  const { questionId, questionIds = [], ...rest } = data;
  const normalizedQuestionIds = Array.from(new Set([questionId, ...questionIds].filter(Boolean)));
  const docRef = await addDoc(wallpapersCollection, {
    ...rest,
    ...(normalizedQuestionIds.length > 0 ? { questionIds: normalizedQuestionIds } : { questionIds: [] }),
    ...(questionId ? { questionId } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateWallpaper(id: string, data: UpdateWallpaperInput) {
  const { questionId, questionIds = [], ...rest } = data;
  const normalizedQuestionIds = Array.from(new Set([questionId, ...questionIds].filter(Boolean)));
  await updateDoc(doc(db, "wallpapers", id), {
    ...rest,
    ...(normalizedQuestionIds.length > 0 ? { questionIds: normalizedQuestionIds } : { questionIds: [] }),
    ...(questionId ? { questionId } : { questionId: deleteField() }),
    updatedAt: serverTimestamp(),
  });
}

export async function getWallpaperById(id: string): Promise<Wallpaper | null> {
  const snapshot = await getDoc(doc(db, "wallpapers", id));

  if (!snapshot.exists()) {
    return null;
  }

  return mapWallpaper(snapshot);
}

export async function getPublishedWallpaperById(id: string): Promise<Wallpaper | null> {
  const wallpaper = await getWallpaperById(id);

  if (!wallpaper?.isPublished) {
    return null;
  }

  return wallpaper;
}

export async function listWallpapers(maxItems = 20) {
  let snapshot;

  try {
    snapshot = await getDocs(query(wallpapersCollection, orderBy("createdAt", "desc"), limit(maxItems)));
  } catch {
    snapshot = await getDocs(query(wallpapersCollection, limit(maxItems)));
  }

  return snapshot.docs.map((item) => mapWallpaper(item));
}

export async function listWallpapersByIds(ids: string[]) {
  const normalizedIds = Array.from(new Set(ids.filter(Boolean)));

  if (normalizedIds.length === 0) {
    return [];
  }

  const snapshots = await Promise.all(
    chunkIds(normalizedIds).map((group) =>
      getDocs(query(wallpapersCollection, where(documentId(), "in", group)))
    )
  );

  const wallpaperById = new Map<string, Wallpaper>();

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((item) => {
      wallpaperById.set(item.id, mapWallpaper(item));
    });
  });

  return normalizedIds.map((id) => wallpaperById.get(id)).filter(Boolean) as Wallpaper[];
}


export async function listPublishedWallpapersByIds(ids: string[]) {
  const normalizedIds = Array.from(new Set(ids.filter(Boolean)));

  if (normalizedIds.length === 0) {
    return [];
  }

  const snapshots = await Promise.all(
    chunkIds(normalizedIds).map((group) =>
      getDocs(
        query(
          wallpapersCollection,
          where(documentId(), "in", group),
          where("isPublished", "==", true)
        )
      )
    )
  );

  const wallpaperById = new Map<string, Wallpaper>();

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((item) => {
      wallpaperById.set(item.id, mapWallpaper(item));
    });
  });

  return normalizedIds.map((id) => wallpaperById.get(id)).filter(Boolean) as Wallpaper[];
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

  return sortWallpapersByNewest(snapshot.docs.map((item) => mapWallpaper(item))).slice(0, maxItems);
}

type PublishedWallpapersPage = {
  items: Wallpaper[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
};

export async function listPublishedWallpapersPage(
  maxItems = 18,
  cursor?: QueryDocumentSnapshot<DocumentData> | null
): Promise<PublishedWallpapersPage> {
  const paginationConstraint = cursor ? [startAfter(cursor)] : [];
  let snapshot;

  try {
    snapshot = await getDocs(
      query(
        wallpapersCollection,
        where("isPublished", "==", true),
        orderBy("createdAt", "desc"),
        ...paginationConstraint,
        limit(maxItems)
      )
    );
  } catch {
    snapshot = await getDocs(
      query(wallpapersCollection, where("isPublished", "==", true), ...paginationConstraint, limit(maxItems))
    );
  }

  const items = snapshot.docs.map((item) => mapWallpaper(item));
  const lastVisible = snapshot.docs.at(-1) ?? null;

  return {
    items: sortWallpapersByNewest(items).slice(0, maxItems),
    cursor: lastVisible,
    hasMore: snapshot.docs.length === maxItems,
  };
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

  return sortWallpapersByNewest(snapshot.docs.map((item) => mapWallpaper(item))).slice(0, maxItems);
}

export async function listPublishedWallpapersByQuestionPrompt(questionPromptSlug: string, maxItems = 50) {
  const snapshot = await getDocs(
    query(
      wallpapersCollection,
      where("isPublished", "==", true),
      where("questionPromptSlugs", "array-contains", questionPromptSlug),
      limit(maxItems)
    )
  );

  return sortWallpapersByNewest(snapshot.docs.map((item) => mapWallpaper(item))).slice(0, maxItems);
}

export async function listPublishedWallpapersByQuestion(questionId: string, questionSlug?: string, maxItems = 50) {
  const lookups: Array<() => Promise<Wallpaper[]>> = [
    async () => {
      const snapshot = await getDocs(
        query(
          wallpapersCollection,
          where("isPublished", "==", true),
          where("questionId", "==", questionId),
          limit(maxItems)
        )
      );

      return snapshot.docs.map((item) => mapWallpaper(item));
    },
    async () => {
      const snapshot = await getDocs(
        query(
          wallpapersCollection,
          where("isPublished", "==", true),
          where("questionIds", "array-contains", questionId),
          limit(maxItems)
        )
      );

      return snapshot.docs.map((item) => mapWallpaper(item));
    },
  ];

  if (questionSlug) {
    lookups.push(() => listPublishedWallpapersByQuestionPrompt(questionSlug, maxItems));
  }

  const results = await Promise.all(lookups.map((run) => run()));
  const merged = new Map<string, Wallpaper>();

  results.flat().forEach((item) => {
    if (item.id) {
      merged.set(item.id, item);
    }
  });

  const mergedItems = sortWallpapersByNewest(Array.from(merged.values())).slice(0, maxItems);

  if (mergedItems.length > 0) {
    return mergedItems;
  }

  const fallbackScanSize = Math.max(maxItems, 60);
  const recentPublished = await listPublishedWallpapers(fallbackScanSize);

  return sortWallpapersByNewest(
    recentPublished.filter((item) => {
      const matchesQuestionId = item.questionId === questionId || item.questionIds?.includes(questionId);
      const matchesSlug = questionSlug
        ? item.questionPromptSlugs?.includes(questionSlug) || item.questionPromptSlugs?.includes(questionId)
        : false;

      return matchesQuestionId || matchesSlug;
    })
  ).slice(0, maxItems);
}

export function buildWallpaperQuestionFields(input: {
  questionId?: string;
  legacyQuestionIds?: string[];
  legacyQuestionPromptSlug?: string;
}) {
  if (!input.questionId) {
    return {
      questionIds: [],
      questionPromptSlugs: [],
    };
  }

  return buildQuestionLookup(input.questionId, input.legacyQuestionIds, input.legacyQuestionPromptSlug);
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
