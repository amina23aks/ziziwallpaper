"use client";

import { PublicWallpaperCard } from "@/app/_components/public-wallpaper-card";
import type { Wallpaper } from "@/types/wallpaper";

type DesktopWallpaperFeedProps = {
  wallpapers: Wallpaper[];
  columnCount?: number;
};

function splitWallpapersIntoColumns(wallpapers: Wallpaper[], totalColumns: number) {
  return Array.from({ length: totalColumns }, (_, columnIndex) =>
    wallpapers.filter((_, wallpaperIndex) => wallpaperIndex % totalColumns === columnIndex)
  );
}

export function DesktopWallpaperFeed({ wallpapers, columnCount = 5 }: DesktopWallpaperFeedProps) {
  const mobileColumns = splitWallpapersIntoColumns(wallpapers, 2);
  const desktopColumns = splitWallpapersIntoColumns(wallpapers, columnCount);
  const desktopColumnClass = columnCount === 5 ? "xl:grid-cols-5" : "xl:grid-cols-4";

  return (
    <>
      <section className="grid grid-cols-2 gap-3 [direction:rtl] xl:hidden">
        {mobileColumns.map((columnWallpapers, columnIndex) => (
          <div key={`mobile-column-${columnIndex}`} className="flex min-w-0 flex-col gap-3">
            {columnWallpapers.map((wallpaper, wallpaperIndex) => (
              <div key={wallpaper.id ?? `${columnIndex}-${wallpaperIndex}`} className="min-w-0">
                <PublicWallpaperCard wallpaper={wallpaper} />
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className={`hidden gap-3 [direction:rtl] xl:grid ${desktopColumnClass}`}>
        {desktopColumns.map((columnWallpapers, columnIndex) => (
          <div key={`desktop-column-${columnIndex}`} className="flex min-w-0 flex-col gap-3">
            {columnWallpapers.map((wallpaper, wallpaperIndex) => (
              <div key={wallpaper.id ?? `${columnIndex}-${wallpaperIndex}`} className="min-w-0">
                <PublicWallpaperCard wallpaper={wallpaper} />
              </div>
            ))}
          </div>
        ))}
      </section>
    </>
  );
}
