"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WallpaperForm } from "@/app/admin/wallpapers/_components/wallpaper-form";
import { getWallpaperById } from "@/lib/firestore/wallpapers";
import type { Wallpaper } from "@/types/wallpaper";

export default function EditWallpaperPage() {
  const params = useParams<{ id: string }>();
  const wallpaperId = params.id;
  const [wallpaper, setWallpaper] = useState<Wallpaper | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadWallpaper() {
      try {
        const data = await getWallpaperById(wallpaperId);
        setWallpaper(data);
      } finally {
        setIsLoading(false);
      }
    }

    if (wallpaperId) {
      loadWallpaper();
    }
  }, [wallpaperId]);

  if (isLoading) {
    return <main className="bg-zinc-50 px-4 py-8 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">جاري تحميل بيانات الخلفية...</main>;
  }

  if (!wallpaper) {
    return <main className="bg-zinc-50 px-4 py-8 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">لم يتم العثور على الخلفية المطلوبة.</main>;
  }

  return <WallpaperForm mode="edit" wallpaperId={wallpaperId} initialWallpaper={wallpaper} />;
}
