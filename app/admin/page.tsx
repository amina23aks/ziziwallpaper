"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { listRecentWallpapers } from "@/lib/firestore/wallpapers";
import { AdminTopBar } from "@/app/admin/_components/admin-top-bar";
import { useAuth } from "@/app/_providers/auth-provider";
import { isSuperAdminRole } from "@/lib/auth/roles";
import type { Wallpaper } from "@/types/wallpaper";

export default function AdminDashboardPage() {
  const { userProfile } = useAuth();
  const isSuperAdmin = isSuperAdminRole(userProfile);
  const [recentWallpapers, setRecentWallpapers] = useState<Wallpaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRecentWallpapers() {
      try {
        const data = await listRecentWallpapers(6);
        setRecentWallpapers(data);
      } finally {
        setIsLoading(false);
      }
    }

    loadRecentWallpapers();
  }, []);

  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-5 bg-[var(--app-bg)] px-4 pb-6 pt-0 sm:px-6 md:pr-28 lg:px-8 lg:pr-32">
      <AdminTopBar
        title="لوحة الإدارة"
        subtitle="إدارة المحتوى"
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/admin/wallpapers/new"
          className="rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-4 text-sm font-semibold text-[var(--app-text)] shadow-sm"
        >
          إضافة خلفية
        </Link>
        <Link
          href="/admin/wallpapers"
          className="rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-4 text-sm font-semibold text-[var(--app-text)] shadow-sm"
        >
          إدارة الخلفيات
        </Link>
        <Link
          href="/admin/categories"
          className="rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-4 text-sm font-semibold text-[var(--app-text)] shadow-sm"
        >
          إدارة التصنيفات
        </Link>
        <Link
          href="/admin/questions"
          className="rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-4 text-sm font-semibold text-[var(--app-text)] shadow-sm"
        >
          إدارة الأسئلة
        </Link>
        {isSuperAdmin ? (
          <Link
            href="/admin/users"
            className="rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-4 text-sm font-semibold text-[var(--app-text)] shadow-sm"
          >
            إدارة المستخدمين
          </Link>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-[var(--app-text)]">أحدث الخلفيات</h2>
        {isLoading ? (
          <p className="text-sm text-[var(--app-text-muted)]">جاري التحميل...</p>
        ) : recentWallpapers.length === 0 ? (
          <p className="text-sm text-[var(--app-text-muted)]">لا توجد خلفيات حالياً.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {recentWallpapers.map((wallpaper, index) => (
              <article key={wallpaper.id ?? index} className="space-y-2">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface-muted)]">
                  {wallpaper.images?.[0]?.secureUrl && (
                    <Image
                      src={wallpaper.images[0].secureUrl}
                      alt={wallpaper.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 45vw, 180px"
                      unoptimized
                    />
                  )}
                </div>
                <p className="line-clamp-1 text-sm font-semibold text-[var(--app-text)]">{wallpaper.title}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
