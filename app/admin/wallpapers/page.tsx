"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DeleteConfirmDialog } from "@/app/_components/delete-confirm-dialog";
import { AdminTopBar } from "@/app/admin/_components/admin-top-bar";
import { deleteWallpaper, listWallpapers } from "@/lib/firestore/wallpapers";
import type { Wallpaper } from "@/types/wallpaper";

export default function AdminWallpapersPage() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadWallpapers() {
    setIsLoading(true);
    try {
      const data = await listWallpapers(30);
      setWallpapers(data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadWallpapers();
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteWallpaper(deletingId);
      setWallpapers((prev) => prev.filter((item) => item.id !== deletingId));
      setStatusMessage("تم حذف الخلفية بنجاح.");
    } catch {
      setStatusMessage("تعذر حذف الخلفية حالياً.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-5 bg-[var(--app-bg)] px-4 pb-6 pt-0 sm:px-6 md:pr-28 lg:px-8 lg:pr-32">
      <AdminTopBar title="الخلفيات" subtitle="إدارة الخلفيات" backHref="/admin" />

      <section className="mt-3 flex items-center justify-start [direction:ltr] md:mt-5">
        <Link
          href="/admin/wallpapers/new"
          data-admin-action="true"
          className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--app-text)] dark:border-white dark:bg-white dark:text-black"
        >
          <Plus size={13} />
          <span>إضافة خلفية</span>
        </Link>
      </section>

      {statusMessage && (
        <div className="rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-medium text-[var(--app-text)]">
          {statusMessage}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] shadow-sm">
        {isLoading ? (
          <p className="p-4 text-sm text-[var(--app-text-muted)]">جاري تحميل الخلفيات...</p>
        ) : wallpapers.length === 0 ? (
          <p className="p-4 text-sm text-[var(--app-text-muted)]">لا توجد خلفيات محفوظة حتى الآن.</p>
        ) : (
          <div className="divide-y divide-[color:var(--app-border)]">
            {wallpapers.map((wallpaper, index) => (
              <article
                key={wallpaper.id ?? index}
                className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 p-3 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-[color:var(--app-border)] bg-[var(--app-surface-muted)]">
                  {wallpaper.images?.[0]?.secureUrl ? (
                    <Image
                      src={wallpaper.images[0].secureUrl}
                      alt={wallpaper.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                    />
                  ) : null}
                </div>

                <div className="min-w-0 space-y-1">
                  <p className="line-clamp-1 text-sm font-semibold text-[var(--app-text)]">{wallpaper.title}</p>
                  <p className="line-clamp-1 text-xs text-[var(--app-text-muted)]">
                    {wallpaper.categorySlugs?.join("، ") || "بدون تصنيف"}
                  </p>
                  <p className="text-xs text-[var(--app-text-muted)]">
                    الحالة: {wallpaper.isPublished ? "منشورة" : "غير منشورة"}
                  </p>
                </div>

                <div className="col-span-2 flex gap-2 sm:col-auto sm:justify-end">
                  <Link
                    href={wallpaper.id ? `/admin/wallpapers/${wallpaper.id}/edit` : "#"}
                    data-admin-action="true"
                    className="inline-flex flex-1 items-center justify-center rounded-lg border border-[color:var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-semibold text-[var(--app-text)] dark:border-white dark:bg-white dark:text-black sm:flex-none"
                  >
                    تعديل
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeletingId(wallpaper.id ?? null)}
                    className="inline-flex flex-1 items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 sm:flex-none"
                  >
                    حذف
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <DeleteConfirmDialog
        isOpen={Boolean(deletingId)}
        title="تأكيد حذف الخلفية"
        description="هل أنت متأكد من حذف هذه الخلفية؟ لا يمكن التراجع عن هذا الإجراء."
        confirmVariant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </main>
  );
}
