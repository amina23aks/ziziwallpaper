"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { uploadImageToCloudinary } from "@/lib/cloudinary/upload";
import { createCategory, listCategories } from "@/lib/firestore/categories";
import { listQuestionPrompts } from "@/lib/firestore/question-prompts";
import { createWallpaper, updateWallpaper } from "@/lib/firestore/wallpapers";
import type { Category } from "@/types/category";
import type { QuestionPrompt } from "@/types/question-prompt";
import type { Wallpaper, WallpaperImage } from "@/types/wallpaper";

const wallpaperSchema = z.object({
  title: z.string().trim().min(1, "يرجى إدخال عنوان الخلفية"),
  description: z.string().optional(),
  searchKeywords: z.string().optional(),
  moodTags: z.string().optional(),
});

const inlineCategorySchema = z.object({
  nameAr: z.string().trim().min(1, "اسم التصنيف مطلوب"),
});

type WallpaperFormValues = z.infer<typeof wallpaperSchema>;
type UploadedImagePreview = WallpaperImage & { publicId: string; width?: number; height?: number };

function splitCommaSeparated(value: string | undefined) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-5 text-zinc-600 sm:text-sm">{children}</p>;
}

export function WallpaperForm({
  mode,
  wallpaperId,
  initialWallpaper,
}: {
  mode: "create" | "edit";
  wallpaperId?: string;
  initialWallpaper?: Wallpaper | null;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questionPrompts, setQuestionPrompts] = useState<QuestionPrompt[]>([]);
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>([]);
  const [selectedQuestionPromptSlugs, setSelectedQuestionPromptSlugs] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImagePreview[]>([]);
  const [showInlineCategoryForm, setShowInlineCategoryForm] = useState(false);
  const [newCategoryNameAr, setNewCategoryNameAr] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
    watch,
  } = useForm<WallpaperFormValues>({
    defaultValues: {
      title: initialWallpaper?.title ?? "",
      description: initialWallpaper?.description ?? "",
      searchKeywords: initialWallpaper?.searchKeywords?.join(", ") ?? "",
      moodTags: initialWallpaper?.moodTags?.join(", ") ?? "",
    },
  });

  const title = watch("title");

  useEffect(() => {
    async function loadPageData() {
      const [categoriesResult, promptsResult] = await Promise.all([
        listCategories(),
        listQuestionPrompts(),
      ]);
      setCategories(categoriesResult);
      setQuestionPrompts(promptsResult);
    }

    loadPageData();
  }, []);

  useEffect(() => {
    if (!initialWallpaper) return;

    setSelectedCategorySlugs(initialWallpaper.categorySlugs ?? []);
    setSelectedQuestionPromptSlugs(initialWallpaper.questionPromptSlugs ?? []);
    setUploadedImages(
      (initialWallpaper.images ?? []).map((image, index) => ({
        ...image,
        publicId: `existing-${index}-${image.secureUrl}`,
      }))
    );
    reset({
      title: initialWallpaper.title,
      description: initialWallpaper.description ?? "",
      searchKeywords: initialWallpaper.searchKeywords?.join(", ") ?? "",
      moodTags: initialWallpaper.moodTags?.join(", ") ?? "",
    });
  }, [initialWallpaper, reset]);

  const selectedCategoriesText = useMemo(() => {
    if (selectedCategorySlugs.length === 0) return "لم يتم اختيار تصنيف";
    return selectedCategorySlugs.join("، ");
  }, [selectedCategorySlugs]);

  const toggleCategory = (slug: string) => {
    setSelectedCategorySlugs((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  };

  const toggleQuestionPrompt = (slug: string) => {
    setSelectedQuestionPromptSlugs((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  };

  const handleFileSelect = async (file: File | null) => {
    setStatusMessage(null);

    if (!file) return;

    setIsUploading(true);

    try {
      const uploadedImage = await uploadImageToCloudinary(file);
      setUploadedImages((prev) => [
        ...prev,
        {
          secureUrl: uploadedImage.secureUrl,
          alt: title.trim() || "Wallpaper image",
          publicId: uploadedImage.publicId,
          width: uploadedImage.width,
          height: uploadedImage.height,
        },
      ]);
      setFileInputKey((prev) => prev + 1);
      setStatusMessage({ type: "success", message: "تم رفع الصورة وإضافتها." });
    } catch {
      setStatusMessage({ type: "error", message: "تعذر رفع الصورة حالياً." });
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedImage = (publicId: string) => {
    setUploadedImages((prev) => prev.filter((image) => image.publicId !== publicId));
  };

  const handleInlineCategorySave = async () => {
    const parsed = inlineCategorySchema.safeParse({ nameAr: newCategoryNameAr });

    if (!parsed.success) {
      setStatusMessage({ type: "error", message: "أدخل اسم التصنيف العربي." });
      return;
    }

    const normalizedName = parsed.data.nameAr.trim();
    const slug = slugify(normalizedName);

    if (!slug) {
      setStatusMessage({ type: "error", message: "تعذر إنشاء رابط التصنيف، جرّب اسماً آخر." });
      return;
    }

    if (categories.some((category) => category.slug === slug)) {
      setStatusMessage({ type: "error", message: "هذا التصنيف موجود بالفعل." });
      return;
    }

    try {
      const createdId = await createCategory({
        nameAr: normalizedName,
        nameEn: slug,
        slug,
        order: categories.length,
        isActive: true,
      });

      const createdCategory: Category = {
        id: createdId,
        nameAr: normalizedName,
        nameEn: slug,
        slug,
        order: categories.length,
        isActive: true,
      };

      setCategories((prev) => [...prev, createdCategory]);
      setSelectedCategorySlugs((prev) => [...new Set([...prev, slug])]);
      setNewCategoryNameAr("");
      setShowInlineCategoryForm(false);
      setStatusMessage({ type: "success", message: "تمت إضافة التصنيف واختياره تلقائياً." });
    } catch {
      setStatusMessage({ type: "error", message: "تعذر إضافة التصنيف الآن." });
    }
  };

  const onSubmit = async (rawValues: WallpaperFormValues) => {
    setStatusMessage(null);

    const parsed = wallpaperSchema.safeParse(rawValues);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      if (fieldErrors.title?.[0]) {
        setError("title", { message: fieldErrors.title[0] });
      }
      return;
    }

    if (selectedCategorySlugs.length === 0) {
      setStatusMessage({ type: "error", message: "اختر تصنيفاً واحداً على الأقل." });
      return;
    }

    if (uploadedImages.length === 0) {
      setStatusMessage({ type: "error", message: "أضف صورة واحدة على الأقل." });
      return;
    }

    const values = parsed.data;
    const payload = {
      title: values.title.trim(),
      description: values.description?.trim() ?? "",
      categorySlugs: selectedCategorySlugs,
      questionPromptSlugs: selectedQuestionPromptSlugs,
      searchKeywords: splitCommaSeparated(values.searchKeywords),
      moodTags: splitCommaSeparated(values.moodTags),
      images: uploadedImages.map((image) => ({
        secureUrl: image.secureUrl,
        alt: values.title.trim(),
      })),
      isPublished: true,
    };

    setIsSaving(true);

    try {
      if (mode === "edit" && wallpaperId) {
        await updateWallpaper(wallpaperId, payload);
        setStatusMessage({ type: "success", message: "تم تحديث الخلفية بنجاح." });
      } else {
        await createWallpaper(payload);
        setStatusMessage({ type: "success", message: "تم حفظ الخلفية." });
        reset({ title: "", description: "", searchKeywords: "", moodTags: "" });
        setSelectedCategorySlugs([]);
        setSelectedQuestionPromptSlugs([]);
        setUploadedImages([]);
        setFileInputKey((prev) => prev + 1);
      }

      router.refresh();
    } catch {
      setStatusMessage({ type: "error", message: "حدث خطأ أثناء الحفظ." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-5 flex flex-wrap items-center gap-2">
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

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <h1 className="text-xl font-extrabold text-zinc-900 sm:text-2xl">
          {mode === "edit" ? "تعديل الخلفية" : "إضافة خلفية"}
        </h1>

        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-semibold text-zinc-900">
            عنوان الخلفية
          </label>
          <input
            id="title"
            type="text"
            {...register("title")}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400"
            placeholder="مثال: خلفية ليلية"
          />
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-semibold text-zinc-900">
            وصف مختصر
          </label>
          <textarea
            id="description"
            rows={3}
            {...register("description")}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400"
            placeholder="اختياري"
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <label className="block text-sm font-semibold text-zinc-900">التصنيفات</label>
            <button
              type="button"
              onClick={() => setShowInlineCategoryForm((prev) => !prev)}
              className="text-xs font-semibold text-zinc-800"
            >
              ➕ إضافة تصنيف سريع
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const active = selectedCategorySlugs.includes(category.slug);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.slug)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                    active
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 bg-white text-zinc-800"
                  }`}
                >
                  {category.nameAr}
                </button>
              );
            })}
          </div>
          <FieldHint>المحدد حالياً: {selectedCategoriesText}</FieldHint>

          {showInlineCategoryForm && (
            <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
              <input
                value={newCategoryNameAr}
                onChange={(event) => setNewCategoryNameAr(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                placeholder="اسم التصنيف بالعربية"
              />
              <button
                type="button"
                onClick={handleInlineCategorySave}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white"
              >
                حفظ التصنيف
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3 sm:p-4">
          <label className="block text-sm font-semibold text-zinc-900">اقتراحات زر ؟</label>
          <div className="flex flex-wrap gap-2">
            {questionPrompts.map((prompt) => {
              const active = selectedQuestionPromptSlugs.includes(prompt.slug);
              return (
                <button
                  key={prompt.slug}
                  type="button"
                  onClick={() => toggleQuestionPrompt(prompt.slug)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                    active
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 bg-white text-zinc-800"
                  }`}
                >
                  {prompt.questionAr}
                </button>
              );
            })}
          </div>
          <FieldHint>اختياري: يمكنك ربط الخلفية مع أكثر من سؤال.</FieldHint>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="searchKeywords" className="block text-sm font-semibold text-zinc-900">
              كلمات البحث
            </label>
            <input
              id="searchKeywords"
              type="text"
              {...register("searchKeywords")}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400"
              placeholder="ليل، هدوء، سماء"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="moodTags" className="block text-sm font-semibold text-zinc-900">
              كلمات المزاج
            </label>
            <input
              id="moodTags"
              type="text"
              {...register("moodTags")}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400"
              placeholder="هادئ، تركيز"
            />
          </div>
        </div>

        <section className="space-y-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4">
          <div>
            <p className="text-sm font-semibold text-zinc-900">📤 رفع الصور</p>
            <FieldHint>اختر صورة وسيتم رفعها تلقائياً وإضافتها للمعاينة.</FieldHint>
          </div>
          <input
            key={fileInputKey}
            type="file"
            accept="image/*"
            onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
            className="block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          />
          {isUploading && <p className="text-sm text-zinc-700">جاري رفع الصورة...</p>}

          {uploadedImages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-zinc-900">المعاينة</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {uploadedImages.map((image, index) => (
                  <article key={image.publicId} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                    <div className="relative aspect-square bg-zinc-100">
                      <Image
                        src={image.secureUrl}
                        alt={title.trim() || `صورة ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 180px"
                        unoptimized
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeUploadedImage(image.publicId)}
                      className="w-full border-t border-zinc-200 px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      🗑️ إزالة الصورة
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        {statusMessage && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              statusMessage.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {statusMessage.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving || isUploading}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSaving
            ? mode === "edit"
              ? "جاري حفظ التعديلات..."
              : "جاري حفظ الخلفية..."
            : mode === "edit"
              ? "💾 حفظ التعديلات"
              : "💾 حفظ الخلفية"}
        </button>
      </form>
    </main>
  );
}
