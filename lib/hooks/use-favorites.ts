"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_providers/auth-provider";
import {
  addFavorite,
  getFavoriteDocumentId,
  isWallpaperFavoritedByUser,
  listFavoriteWallpaperIdsByUser,
  removeFavorite,
} from "@/lib/firestore/favorites";
import { getWallpaperById } from "@/lib/firestore/wallpapers";
import type { Wallpaper } from "@/types/wallpaper";

function isWallpaper(item: Wallpaper | null): item is Wallpaper {
  return item !== null;
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
        const favorited = await isWallpaperFavoritedByUser(user.uid, wallpaperId);
        if (isMounted) {
          setIsFavorited(favorited);
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

export function useToggleFavorite(wallpaperId?: string) {
  const router = useRouter();
  const { user, isSignedIn } = useAuth();
  const { isFavorited, setIsFavorited, isLoading } = useFavoriteStatus(wallpaperId);
  const [isToggling, setIsToggling] = useState(false);

  const toggleFavorite = useCallback(async () => {
    if (!wallpaperId) {
      return;
    }

    if (!isSignedIn || !user) {
      router.push("/login");
      return;
    }

    setIsToggling(true);

    try {
      if (isFavorited) {
        await removeFavorite(user.uid, wallpaperId);
        setIsFavorited(false);
      } else {
        await addFavorite(user.uid, wallpaperId);
        setIsFavorited(true);
      }
    } finally {
      setIsToggling(false);
    }
  }, [isFavorited, isSignedIn, router, setIsFavorited, user, wallpaperId]);

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
      const favoriteIds = await listFavoriteWallpaperIdsByUser(user.uid, 300);
      const results = await Promise.all(favoriteIds.map((id) => getWallpaperById(id)));
      const wallpapersOnly = results.filter(isWallpaper);
      setWallpapers(wallpapersOnly);
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
