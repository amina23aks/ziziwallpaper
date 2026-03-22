"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_providers/auth-provider";
import {
  addFavorite,
  getFavoriteDocumentId,
  listFavoriteWallpaperIdsByUser,
  removeFavorite,
} from "@/lib/firestore/favorites";
import { listWallpapersByIds } from "@/lib/firestore/wallpapers";
import type { Wallpaper } from "@/types/wallpaper";

const favoriteIdsCache = new Map<string, string[]>();
const favoriteIdsRequests = new Map<string, Promise<string[]>>();

async function ensureFavoriteIdsLoaded(userId: string) {
  const cached = favoriteIdsCache.get(userId);
  if (cached) {
    return cached;
  }

  const existingRequest = favoriteIdsRequests.get(userId);
  if (existingRequest) {
    return existingRequest;
  }

  const request = listFavoriteWallpaperIdsByUser(userId, 300)
    .then((ids) => {
      favoriteIdsCache.set(userId, ids);
      favoriteIdsRequests.delete(userId);
      return ids;
    })
    .catch((error) => {
      favoriteIdsRequests.delete(userId);
      throw error;
    });

  favoriteIdsRequests.set(userId, request);
  return request;
}

function updateFavoriteIdCache(userId: string, wallpaperId: string, shouldSave: boolean) {
  const existing = favoriteIdsCache.get(userId) ?? [];

  if (shouldSave) {
    favoriteIdsCache.set(userId, [wallpaperId, ...existing.filter((id) => id !== wallpaperId)]);
    return;
  }

  favoriteIdsCache.set(
    userId,
    existing.filter((id) => id !== wallpaperId)
  );
}

export function useFavoriteStatus(wallpaperId?: string) {
  const { user, isSignedIn } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      if (!isSignedIn || !user || !wallpaperId) {
        if (isMounted) {
          setIsFavorited(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const ids = await ensureFavoriteIdsLoaded(user.uid);
        if (isMounted) {
          setIsFavorited(ids.includes(wallpaperId));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    setIsLoading(true);
    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [isSignedIn, user, wallpaperId]);

  return { isFavorited, setIsFavorited, isLoading };
}

export function useToggleFavorite(wallpaperId?: string, options?: { onAuthRequired?: () => void }) {
  const router = useRouter();
  const { user, isSignedIn } = useAuth();
  const { isFavorited, setIsFavorited, isLoading } = useFavoriteStatus(wallpaperId);
  const [isToggling, setIsToggling] = useState(false);

  const toggleFavorite = useCallback(async () => {
    if (!wallpaperId) {
      return "noop" as const;
    }

    if (!isSignedIn || !user) {
      if (options?.onAuthRequired) {
        options.onAuthRequired();
      } else {
        router.push("/login");
      }
      return "auth_required" as const;
    }

    setIsToggling(true);

    try {
      if (isFavorited) {
        await removeFavorite(user.uid, wallpaperId);
        updateFavoriteIdCache(user.uid, wallpaperId, false);
        setIsFavorited(false);
      } else {
        await addFavorite(user.uid, wallpaperId);
        updateFavoriteIdCache(user.uid, wallpaperId, true);
        setIsFavorited(true);
      }
      return "ok" as const;
    } finally {
      setIsToggling(false);
    }
  }, [isFavorited, isSignedIn, options, router, setIsFavorited, user, wallpaperId]);

  const favoriteDocumentId = useMemo(() => {
    if (!isSignedIn || !user || !wallpaperId) return null;
    return getFavoriteDocumentId(user.uid, wallpaperId);
  }, [isSignedIn, user, wallpaperId]);

  return {
    isFavorited,
    isLoading,
    isToggling,
    toggleFavorite,
    favoriteDocumentId,
  };
}

export function useCurrentUserFavorites() {
  const { user, isSignedIn } = useAuth();
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!isSignedIn || !user) {
      setWallpapers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const favoriteIds = await ensureFavoriteIdsLoaded(user.uid);
      const results = await listWallpapersByIds(favoriteIds);
      setWallpapers(results.filter((item) => item.isPublished));
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    wallpapers,
    isLoading,
    reload,
  };
}
