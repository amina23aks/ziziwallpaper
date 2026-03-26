"use client";

import { useEffect, useMemo, useState } from "react";
import { DeleteConfirmDialog } from "@/app/_components/delete-confirm-dialog";
import { AdminTopBar } from "@/app/admin/_components/admin-top-bar";
import {
  createCategory,
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
    .replace(/[^a-z0-9؀-ۿ-]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleCreate = async () => {
    const nameAr = newCategoryName.trim();
    if (!nameAr) {
      setStatusMessage("يرجى إدخال اسم التصنيف.");
      return;
    }

    const slug = slugify(nameAr);
    if (!slug) {
      setStatusMessage("تعذر إنشاء رابط للتصنيف. استخدم اسماً أوضح.");
      return;
    }

    if (categories.some((item) => item.slug === slug)) {
      setStatusMessage("هذا التصنيف موجود بالفعل.");
      return;
    }

    try {
      const id = await createCategory({
        nameAr,
        nameEn: slug,
        slug,
        order: categories.length,
        isActive: true,
      });
      setCategories((prev) => [...prev, { id, nameAr, nameEn: slug, slug, order: categories.length, isActive: true }]);
      setNewCategoryName("");
      setShowAddForm(false);
      setStatusMessage("تمت إضافة التصنيف.");
    } catch {
      setStatusMessage("تعذر إضافة التصنيف حالياً.");
    }
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

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteCategory(deletingId);
      setCategories((prev) => prev.filter((item) => item.id !== deletingId));
      setStatusMessage("تم حذف التصنيف.");
      if (editingId === deletingId) {
        setEditingId(null);
        setEditingName("");
      }
    } catch {
      setStatusMessage("تعذر حذف التصنيف حالياً.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-5 bg-[var(--app-bg)] px-4 pb-6 pt-0 sm:px-6 md:pr-28 lg:px-8 lg:pr-32">
      <AdminTopBar title="التصنيفات" subtitle="تعديل الأسماء أو حذف التصنيفات" backHref="/admin" />

      <section className="mt-3 space-y-3 md:mt-5">
        <div className="flex items-center justify-start [direction:ltr]">
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="inline-flex items-center rounded-lg border border-[color:var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--app-text)]"
          >
            إضافة تصنيف +
          </button>
        </div>

        {showAddForm && (
          <div className="rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="اسم التصنيف"
                className="w-full rounded-lg border border-[color:var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] placeholder:text-[var(--app-text-muted)]"
              />
              <button
                type="button"
                onClick={handleCreate}
                className="rounded-lg border border-[color:var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-sm font-semibold text-[var(--app-text)]"
              >
                حفظ
              </button>
            </div>
          </div>
        )}
      </section>

      {statusMessage && (
        <div className="rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-medium text-[var(--app-text)]">
          {statusMessage}
        </div>
      )}

      <section className="rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm sm:p-5">
        {isLoading ? (
          <p className="text-sm text-[var(--app-text-muted)]">جاري تحميل التصنيفات...</p>
        ) : !hasCategories ? (
          <p className="text-sm text-[var(--app-text-muted)]">لا توجد تصنيفات حالياً. يمكنك إضافة تصنيف جديد.</p>
        ) : (
          <div className="space-y-3">
            {categories.map((category, index) => {
              const isEditing = editingId === category.id;
              return (
                <article
                  key={category.id ?? index}
                  className="space-y-3 rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface-muted)] p-3 sm:flex sm:items-center sm:justify-between sm:space-y-0"
                >
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        className="w-full rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] placeholder:text-[var(--app-text-muted)]"
                        placeholder="اسم التصنيف"
                      />
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-[var(--app-text)]">{category.nameAr}</p>
                        <p className="text-xs text-[var(--app-text-muted)]">{category.slug}</p>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="inline-flex min-w-20 flex-1 items-center justify-center rounded-lg border border-[color:var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--app-text)] sm:flex-none"
                        >
                          حفظ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                          }}
                          className="inline-flex min-w-20 flex-1 items-center justify-center rounded-lg border border-[color:var(--app-border)] px-3 py-2 text-xs font-semibold text-[var(--app-text)] sm:flex-none"
                        >
                          إلغاء
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(category)}
                        className="inline-flex min-w-20 flex-1 items-center justify-center rounded-lg border border-[color:var(--app-border)] px-3 py-2 text-xs font-semibold text-[var(--app-text)] sm:flex-none"
                      >
                        تعديل
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeletingId(category.id ?? null)}
                      className="inline-flex min-w-20 flex-1 items-center justify-center rounded-lg border border-[#f3b6bc] bg-[#fff5f6] px-3 py-2 text-xs font-semibold text-[#c40018] hover:bg-[#ffebee] dark:border-[#8f1d2a] dark:bg-[#34131a] dark:text-[#ff9eaa] dark:hover:bg-[#412029] sm:flex-none"
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

      <DeleteConfirmDialog
        isOpen={Boolean(deletingId)}
        title="تأكيد حذف التصنيف"
        description="هل أنت متأكد من حذف هذا التصنيف؟ سيبقى المحتوى المنشور بدون تصنيف إن وُجد."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </main>
  );
}
