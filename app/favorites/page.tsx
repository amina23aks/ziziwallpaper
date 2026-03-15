"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MasonryGrid } from "@/app/_components/masonry-grid";
import { MobileBottomNav } from "@/app/_components/mobile-bottom-nav";
import { PublicWallpaperCard } from "@/app/_components/public-wallpaper-card";
import { useAuth } from "@/app/_providers/auth-provider";
import { useCurrentUserFavorites } from "@/lib/hooks/use-favorites";

export default function FavoritesPage() {
  const router = useRouter();
  const { isSignedIn, isAuthLoading } = useAuth();
  const { wallpapers, isLoading } = useCurrentUserFavorites();

  useEffect(() => {
    if (!isAuthLoading && !isSignedIn) {
      router.replace("/login");
    }
  }, [isAuthLoading, isSignedIn, router]);

  if (isAuthLoading || (!isSignedIn && !isAuthLoading)) {
    return null;
  }

  return (
    <main className="min-h-screen w-full bg-zinc-50 pb-24 pt-16 md:pr-24 md:pt-6">
      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-5 sm:px-6 lg:px-8">
        <header className="space-y-1">
          <p className="text-xs font-semibold text-zinc-600">ZIZI</p>
          <h1 className="text-xl font-extrabold text-zinc-900">المفضلة</h1>
        </header>

        {isLoading ? (
          <p className="text-sm text-zinc-600">جاري تحميل المفضلة...</p>
        ) : wallpapers.length === 0 ? (
          <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-8 text-center">
            <p className="text-sm font-medium text-zinc-700">لا توجد عناصر في المفضلة حتى الآن.</p>
            <p className="mt-1 text-xs text-zinc-500">احفظ الخلفيات التي تعجبك لتظهر هنا.</p>
          </section>
        ) : (
          <MasonryGrid>
            {wallpapers.map((wallpaper, index) => (
              <div key={wallpaper.id ?? index} className="mb-3 break-inside-avoid">
                <PublicWallpaperCard wallpaper={wallpaper} />
              </div>
            ))}
          </MasonryGrid>
        )}
      </div>

      <MobileBottomNav activeTab="favorites" />
    </main>
  );
}
