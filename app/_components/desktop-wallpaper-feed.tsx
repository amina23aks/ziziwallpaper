"use client";

import { PublicWallpaperCard } from "@/app/_components/public-wallpaper-card";
import type { Wallpaper } from "@/types/wallpaper";

type DesktopWallpaperFeedProps = {
  wallpapers: Wallpaper[];
  columnCount?: number;
};

export function DesktopWallpaperFeed({ wallpapers, columnCount = 5 }: DesktopWallpaperFeedProps) {
  const desktopColumnClass = columnCount === 5 ? "xl:grid-cols-5" : "xl:grid-cols-4";

  return (
    <section className={`grid grid-cols-2 gap-3 [direction:rtl] ${desktopColumnClass}`}>
      {wallpapers.map((wallpaper, index) => (
        <div key={wallpaper.id ?? index} className="min-w-0">
          <PublicWallpaperCard wallpaper={wallpaper} />
        </div>
      ))}
    </section>
  );
}
