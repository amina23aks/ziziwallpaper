"use client";

import Link from "next/link";
import { MasonryGrid } from "@/app/_components/masonry-grid";
import { MobileBottomNav } from "@/app/_components/mobile-bottom-nav";
import { PublicWallpaperCard } from "@/app/_components/public-wallpaper-card";
import { useAuth } from "@/app/_providers/auth-provider";
import { useCurrentUserFavorites } from "@/lib/hooks/use-favorites";

export default function FavoritesPage() {
  const { isSignedIn, isAuthLoading } = useAuth();
  const { wallpapers, isLoading } = useCurrentUserFavorites();

  return (
    <main className="min-h-screen w-full bg-zinc-50 pb-24 pt-16 md:pr-24 md:pt-6">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="space-y-1">
          <p className="text-xs font-semibold text-zinc-600">ZIZI</p>
          <h1 className="text-xl font-extrabold text-zinc-900">المفضلة</h1>
        </header>

        {isAuthLoading ? (
          <p className="mt-4 text-sm text-zinc-600">جاري التحقق من تسجيل الدخول...</p>
        ) : !isSignedIn ? (
          <section className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white px-6 py-10 text-center shadow-sm">
              <p className="text-base font-bold text-zinc-900">أنت لم تسجل الدخول بعد</p>
              <p className="mt-2 text-sm text-zinc-600">سجّل الدخول لرؤية الخلفيات المفضلة لديك</p>
              <Link
                href="/login"
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white"
              >
                تسجيل الدخول
              </Link>
            </div>
          </section>
        ) : isLoading ? (
          <p className="mt-4 text-sm text-zinc-600">جاري تحميل المفضلة...</p>
        ) : wallpapers.length === 0 ? (
          <section className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-8 text-center">
            <p className="text-sm font-medium text-zinc-700">لا توجد عناصر في المفضلة حتى الآن.</p>
            <p className="mt-1 text-xs text-zinc-500">احفظ الخلفيات التي تعجبك لتظهر هنا.</p>
          </section>
        ) : (
          <div className="mt-4">
            <MasonryGrid>
              {wallpapers.map((wallpaper, index) => (
                <div key={wallpaper.id ?? index} className="mb-2 inline-block w-full break-inside-avoid align-top sm:mb-3">
                  <PublicWallpaperCard wallpaper={wallpaper} />
                </div>
              ))}
            </MasonryGrid>
          </div>
        )}
      </div>

      <MobileBottomNav activeTab="favorites" />
    </main>
  );
}
