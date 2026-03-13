"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteCategory, listCategories, updateCategory } from "@/lib/firestore/categories";
import type { Category } from "@/types/category";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
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

  const startEdit = (category: Category) => {
    if (!category.id) return;
    setEditingId(category.id);
    setEditingName(category.nameAr);
    setStatusMessage("");
  };

  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) {
      setStatusMessage("يرجى إدخال اسم عربي صالح.");
      return;
    }

    try {
      await updateCategory(editingId, { nameAr: editingName.trim(), nameEn: editingName.trim() });
      setCategories((prev) =>
        prev.map((category) =>
          category.id === editingId
            ? { ...category, nameAr: editingName.trim(), nameEn: editingName.trim() }
            : category
        )
      );
      setStatusMessage("تم تحديث التصنيف.");
      setEditingId(null);
      setEditingName("");
    } catch {
      setStatusMessage("تعذر تحديث التصنيف حالياً.");
    }
  };

  const handleDelete = async (category: Category) => {
    if (!category.id) return;

    try {
      await deleteCategory(category.id);
      setCategories((prev) => prev.filter((item) => item.id !== category.id));
      setStatusMessage("تم حذف التصنيف.");
    } catch {
      setStatusMessage("تعذر حذف التصنيف حالياً.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">إدارة التصنيفات</h1>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">تعديل الاسم العربي أو حذف التصنيف.</p>
        </div>
        <Link
          href="/admin/wallpapers"
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
        >
          ← الخلفيات
        </Link>
      </header>

      {statusMessage && (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          {statusMessage}
        </div>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
        {isLoading ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">جاري تحميل التصنيفات...</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">لا توجد تصنيفات حتى الآن.</p>
        ) : (
          <div className="space-y-2">
            {categories.map((category, index) => {
              const isEditing = category.id === editingId;

              return (
                <article
                  key={category.id ?? index}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="w-full sm:max-w-sm">
                    {isEditing ? (
                      <input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                        placeholder="اسم التصنيف بالعربية"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{category.nameAr}</p>
                    )}
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">slug: {category.slug}</p>
                  </div>

                  <div className="flex gap-2 self-end sm:self-auto">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="rounded-lg border border-zinc-300 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
                        >
                          حفظ
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                        >
                          إلغاء
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                      >
                        ✏️ تعديل
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(category)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                    >
                      🗑️ حذف
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
