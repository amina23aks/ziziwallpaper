"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  listPublishedWallpapersPage,
  type PublishedWallpapersCursor,
} from "@/lib/firestore/wallpapers";
import type { Wallpaper } from "@/types/wallpaper";

export const WALLPAPER_PAGE_SIZE = 6;

type FeedState = {
  items: Wallpaper[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadError: boolean;
};

type CachedFeed = {
  state: FeedState;
  cursor: PublishedWallpapersCursor | null;
  loading: boolean;
};

const INITIAL_STATE: FeedState = {
  items: [],
  isLoading: true,
  isLoadingMore: false,
  hasMore: true,
  loadError: false,
};

export function useWallpaperFeed(categorySlug: string) {
  const cacheRef = useRef(new Map<string, CachedFeed>());
  const [feeds, setFeeds] = useState<Record<string, FeedState>>({});

  const loadMore = useCallback(async () => {
    let feed = cacheRef.current.get(categorySlug);
    if (!feed) {
      feed = { state: INITIAL_STATE, cursor: null, loading: false };
      cacheRef.current.set(categorySlug, feed);
    }
    if (feed.loading || !feed.state.hasMore) return;

    const currentFeed = feed;
    const publish = (state: FeedState) => {
      currentFeed.state = state;
      setFeeds((previous) => ({ ...previous, [categorySlug]: state }));
    };

    // Lock before awaiting so scroll events cannot request the same page twice.
    currentFeed.loading = true;
    publish({ ...currentFeed.state, isLoadingMore: true, loadError: false });
    try {
      const page = await listPublishedWallpapersPage(
        WALLPAPER_PAGE_SIZE,
        currentFeed.cursor,
        categorySlug === "all" ? undefined : categorySlug
      );
      const existingIds = new Set(currentFeed.state.items.map((item) => item.id));
      const newItems = page.items.filter((item) => !item.id || !existingIds.has(item.id));
      currentFeed.cursor = page.cursor;
      publish({
        items: [...currentFeed.state.items, ...newItems],
        isLoading: false,
        isLoadingMore: false,
        hasMore: page.hasMore && page.cursor !== null,
        loadError: false,
      });
    } catch {
      publish({ ...currentFeed.state, isLoading: false, isLoadingMore: false, loadError: true });
    } finally {
      currentFeed.loading = false;
    }
  }, [categorySlug]);

  useEffect(() => {
    // Revisit a category without re-reading pages already loaded in this session.
    if (!cacheRef.current.has(categorySlug)) void loadMore();
  }, [categorySlug, loadMore]);

  return { ...(feeds[categorySlug] ?? INITIAL_STATE), loadMore };
}
