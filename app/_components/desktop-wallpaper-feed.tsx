"use client";

import { useEffect, useMemo, useState } from "react";
import { PublicWallpaperCard } from "@/app/_components/public-wallpaper-card";
import type { Wallpaper } from "@/types/wallpaper";

type DesktopWallpaperFeedProps = {
  wallpapers: Wallpaper[];
  columnCount?: number;
};

type PackedWallpaper = {
  wallpaper: Wallpaper;
  originalIndex: number;
};

const DEFAULT_CARD_RATIO = 1.2;
const CARD_CHROME_OFFSET = 0.2;

function estimateWallpaperHeight(wallpaper: Wallpaper, ratioMap: Record<string, number>) {
  const imageUrl = wallpaper.images[0]?.secureUrl;
  const ratio = imageUrl ? ratioMap[imageUrl] ?? DEFAULT_CARD_RATIO : DEFAULT_CARD_RATIO;

  return ratio + CARD_CHROME_OFFSET;
}

export function DesktopWallpaperFeed({ wallpapers, columnCount = 5 }: DesktopWallpaperFeedProps) {
  const [ratioMap, setRatioMap] = useState<Record<string, number>>({});

  useEffect(() => {
    let isCancelled = false;

    async function loadRatios() {
      const entries = await Promise.all(
        wallpapers
          .map((wallpaper) => wallpaper.images[0]?.secureUrl)
          .filter((imageUrl): imageUrl is string => Boolean(imageUrl))
          .map(
            (imageUrl) =>
              new Promise<[string, number]>((resolve) => {
                const image = new window.Image();

                image.onload = () => {
                  if (!image.naturalWidth || !image.naturalHeight) {
                    resolve([imageUrl, DEFAULT_CARD_RATIO]);
                    return;
                  }

                  resolve([imageUrl, image.naturalHeight / image.naturalWidth]);
                };

                image.onerror = () => resolve([imageUrl, DEFAULT_CARD_RATIO]);
                image.src = imageUrl;
              })
          )
      );

      if (isCancelled) {
        return;
      }

      setRatioMap(Object.fromEntries(entries));
    }

    void loadRatios();

    return () => {
      isCancelled = true;
    };
  }, [wallpapers]);

  const packedColumns = useMemo(() => {
    const columns = Array.from({ length: columnCount }, () => [] as PackedWallpaper[]);
    const columnHeights = Array.from({ length: columnCount }, () => 0);

    wallpapers.forEach((wallpaper, originalIndex) => {
      const targetColumnIndex = columnHeights.reduce((shortestIndex, height, index, heights) => {
        if (height < heights[shortestIndex]) {
          return index;
        }

        return shortestIndex;
      }, 0);

      columns[targetColumnIndex].push({ wallpaper, originalIndex });
      columnHeights[targetColumnIndex] += estimateWallpaperHeight(wallpaper, ratioMap);
    });

    return columns;
  }, [columnCount, ratioMap, wallpapers]);

  return (
    <section className="grid grid-cols-5 gap-3 [direction:rtl]">
      {packedColumns.map((column, columnIndex) => (
        <div key={columnIndex} className="flex min-w-0 flex-col gap-3">
          {column.map(({ wallpaper, originalIndex }) => (
            <div key={wallpaper.id ?? originalIndex} className="w-full">
              <PublicWallpaperCard wallpaper={wallpaper} />
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
