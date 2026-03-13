"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { createCategory, listCategories } from "@/lib/firestore/categories";
import type { Category } from "@/types/category";

const categorySchema = z.object({
  nameAr: z.string().trim().min(1, "الاسم العربي مطلوب"),
  nameEn: z.string().trim().min(1, "الاسم الإنجليزي مطلوب"),
  slug: z.string().trim().min(1, "Slug مطلوب"),
  order: z.coerce.number().min(0),
  isActive: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    defaultValues: {
      nameAr: "",
      nameEn: "",
      slug: "",
      order: 0,
      isActive: true,
    },
  });

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

  const onSubmit = async (values: CategoryFormValues) => {
    setStatusMessage("");
    const parsed = categorySchema.safeParse(values);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      if (fieldErrors.nameAr?.[0]) setError("nameAr", { message: fieldErrors.nameAr[0] });
      if (fieldErrors.nameEn?.[0]) setError("nameEn", { message: fieldErrors.nameEn[0] });
      if (fieldErrors.slug?.[0]) setError("slug", { message: fieldErrors.slug[0] });
      return;
    }

    setIsSaving(true);

    try {
      await createCategory(parsed.data);
      await loadCategories();
      setStatusMessage("تمت إضافة التصنيف بنجاح.");
      reset({ nameAr: "", nameEn: "", slug: "", order: 0, isActive: true });
    } catch {
      setStatusMessage("تعذر إضافة التصنيف حالياً.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl">إدارة التصنيفات</h1>
        <p className="mt-1 text-sm text-zinc-700">أنشئ تصنيفات جديدة واعرض التصنيفات الحالية.</p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 text-lg font-bold text-zinc-900">إضافة تصنيف</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-800">الاسم بالعربية</label>
            <input
              {...register("nameAr")}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500"
              placeholder="مثال: الطبيعة"
            />
            {errors.nameAr && <p className="text-xs text-red-600">{errors.nameAr.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-800">الاسم بالإنجليزية</label>
            <input
              {...register("nameEn")}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500"
              placeholder="Nature"
            />
            {errors.nameEn && <p className="text-xs text-red-600">{errors.nameEn.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-800">Slug</label>
            <input
              {...register("slug")}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500"
              placeholder="nature"
            />
            {errors.slug && <p className="text-xs text-red-600">{errors.slug.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-800">الترتيب</label>
            <input
              type="number"
              {...register("order")}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900"
            />
          </div>

          <label className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <input type="checkbox" {...register("isActive")} className="h-4 w-4" />
            <span className="text-sm font-medium text-zinc-800">تصنيف نشط</span>
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="sm:col-span-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSaving ? "جاري الحفظ..." : "حفظ التصنيف"}
          </button>
        </form>
      </section>

      {statusMessage && (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800">
          {statusMessage}
        </div>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900">التصنيفات الحالية</h2>
          <span className="text-xs text-zinc-600">تعديل لاحقاً</span>
        </div>

        {isLoading ? (
          <p className="text-sm text-zinc-600">جاري تحميل التصنيفات...</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-zinc-600">لا توجد تصنيفات حتى الآن.</p>
        ) : (
          <div className="space-y-2">
            {categories.map((category, index) => (
              <article
                key={category.id ?? index}
                className="flex items-center justify-between rounded-xl border border-zinc-200 p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{category.nameAr}</p>
                  <p className="text-xs text-zinc-600">
                    {category.slug} • {category.nameEn}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700"
                >
                  تعديل قريباً
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
