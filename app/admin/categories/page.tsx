"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  deleteCategory,
  listCategories,
  updateCategoryName,
} from "@/lib/firestore/categories";
import type { Category } from "@/types/category";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>("");

  async function loadCategories() {
    setIsLoading(true);
    try {
      const data = await listCategories();
      setCategories(data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const hasCategories = useMemo(() => categories.length > 0, [categories.length]);

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id ?? null);
    setEditingName(category.nameAr);
    setStatusMessage("");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    const nameAr = editingName.trim();
    if (!nameAr) {
      setStatusMessage("يرجى إدخال الاسم العربي.");
      return;
    }

    const slug = slugify(nameAr);
    if (!slug) {
      setStatusMessage("تعذر إنشاء رابط للتصنيف. استخدم اسماً أوضح.");
      return;
    }

    try {
      await updateCategoryName(editingId, nameAr, slug);
      setCategories((prev) =>
        prev.map((item) => (item.id === editingId ? { ...item, nameAr, slug, nameEn: slug } : item))
      );
      setEditingId(null);
      setEditingName("");
      setStatusMessage("تم تحديث التصنيف.");
    } catch {
      setStatusMessage("تعذر تحديث التصنيف حالياً.");
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;

    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((item) => item.id !== id));
      setStatusMessage("تم حذف التصنيف.");
      if (editingId === id) {
        setEditingId(null);
        setEditingName("");
      }
    } catch {
      setStatusMessage("تعذر حذف التصنيف حالياً.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin"
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-zinc-900 px-3 text-sm font-semibold text-white"
        >
          لوحة التحكم
        </Link>
        <Link href="/" className="inline-flex min-h-9 items-center justify-center text-xs font-semibold text-zinc-700 hover:underline">
          عرض الموقع
        </Link>
      </header>

      <section>
        <h1 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl">التصنيفات</h1>
        <p className="mt-1 text-sm text-zinc-800">تعديل الأسماء أو حذف التصنيفات غير المطلوبة.</p>
      </section>

      {statusMessage && (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800">
          {statusMessage}
        </div>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        {isLoading ? (
          <p className="text-sm text-zinc-600">جاري تحميل التصنيفات...</p>
        ) : !hasCategories ? (
          <p className="text-sm text-zinc-600">لا توجد تصنيفات حالياً. أضف تصنيفاً أثناء إنشاء خلفية جديدة.</p>
        ) : (
          <div className="space-y-3">
            {categories.map((category, index) => {
              const isEditing = editingId === category.id;
              return (
                <article
                  key={category.id ?? index}
                  className="space-y-3 rounded-xl border border-zinc-200 p-3 sm:flex sm:items-center sm:justify-between sm:space-y-0"
                >
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                        placeholder="اسم التصنيف"
                      />
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-zinc-900">{category.nameAr}</p>
                        <p className="text-xs text-zinc-600">{category.slug}</p>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          حفظ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                          }}
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700"
                        >
                          إلغاء
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(category)}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700"
                      >
                        تعديل
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(category.id)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                    >
                      حذف
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
