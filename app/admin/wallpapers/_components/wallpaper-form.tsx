"use client";

import Image from "next/image";
import { AdminTopBar } from "@/app/admin/_components/admin-top-bar";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { uploadImageToCloudinary } from "@/lib/cloudinary/upload";
import { createCategory, listCategories } from "@/lib/firestore/categories";
import { createQuestion } from "@/lib/firestore/questions";
import { listQuestionPrompts } from "@/lib/firestore/question-prompts";
import { buildWallpaperQuestionFields, createWallpaper, updateWallpaper } from "@/lib/firestore/wallpapers";
import type { Category } from "@/types/category";
import type { QuestionPrompt } from "@/types/question-prompt";
import type { Wallpaper, WallpaperImage } from "@/types/wallpaper";

const wallpaperSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  searchKeywords: z.string().optional(),
  moodTags: z.string().optional(),
});

const inlineCategorySchema = z.object({
  nameAr: z.string().trim().min(1, "اسم التصنيف مطلوب"),
});

const inlineQuestionSchema = z.object({
  title: z.string().trim().min(1, "نص السؤال مطلوب"),
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
  return <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-400 sm:text-sm">{children}</p>;
}


function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
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
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(initialWallpaper?.questionId ?? "");
  const [uploadedImages, setUploadedImages] = useState<UploadedImagePreview[]>([]);
  const [showInlineCategoryForm, setShowInlineCategoryForm] = useState(false);
  const [showInlineQuestionForm, setShowInlineQuestionForm] = useState(false);
  const [newCategoryNameAr, setNewCategoryNameAr] = useState("");
  const [newQuestionTitle, setNewQuestionTitle] = useState("");
  const [newQuestionImageUrl, setNewQuestionImageUrl] = useState("");
  const [newQuestionImagePublicId, setNewQuestionImagePublicId] = useState("");
  const [isUploadingQuestionImage, setIsUploadingQuestionImage] = useState(false);
  const [questionImageInputKey, setQuestionImageInputKey] = useState(0);
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

  const title = watch("title") ?? "";

  useEffect(() => {
    async function loadPageData() {
      const [categoriesResult, promptsResult] = await Promise.all([listCategories(), listQuestionPrompts()]);
      setCategories(categoriesResult);
      setQuestionPrompts(promptsResult);
    }

    loadPageData();
  }, []);

  useEffect(() => {
    if (!initialWallpaper) return;

    setSelectedCategorySlugs(initialWallpaper.categorySlugs ?? []);
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

  useEffect(() => {
    if (!initialWallpaper) return;

    if (initialWallpaper.questionId) {
      setSelectedQuestionId(initialWallpaper.questionId);
      return;
    }

    const legacyPromptSlug = initialWallpaper.questionPromptSlugs?.[0];
    if (!legacyPromptSlug) return;

    const matchedQuestion = questionPrompts.find((item) => item.slug === legacyPromptSlug);
    if (matchedQuestion?.id) {
      setSelectedQuestionId(matchedQuestion.id);
    }
  }, [initialWallpaper, questionPrompts]);

  const selectedCategoriesText = useMemo(() => {
    if (selectedCategorySlugs.length === 0) return "لم يتم اختيار تصنيف";
    return selectedCategorySlugs.join("، ");
  }, [selectedCategorySlugs]);

  const selectedQuestionText = useMemo(() => {
    if (!selectedQuestionId) return "لم يتم اختيار سؤال";
    return questionPrompts.find((item) => item.id === selectedQuestionId)?.questionAr ?? "لم يتم اختيار سؤال";
  }, [questionPrompts, selectedQuestionId]);

  const toggleCategory = (slug: string) => {
    setSelectedCategorySlugs((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  };

  const toggleQuestion = (questionId?: string) => {
    if (!questionId) return;
    setSelectedQuestionId((prev) => (prev === questionId ? "" : questionId));
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const uploaded = await uploadImageToCloudinary(file);
      setUploadedImages((prev) => [
        ...prev,
        {
          secureUrl: uploaded.secureUrl,
          alt: title.trim() || file.name,
          publicId: uploaded.publicId,
          width: uploaded.width,
          height: uploaded.height,
        },
      ]);
      setFileInputKey((prev) => prev + 1);
      setStatusMessage({ type: "success", message: "تم رفع الصورة وإضافتها." });
    } catch (error) {
      setStatusMessage({ type: "error", message: getErrorMessage(error, "تعذر رفع الصورة حالياً.") });
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedImage = (publicId: string) => {
    setUploadedImages((prev) => prev.filter((image) => image.publicId !== publicId));
  };

  const handleQuestionImageSelect = async (file: File | null) => {
    if (!file) return;

    setIsUploadingQuestionImage(true);
    setStatusMessage(null);

    try {
      const uploaded = await uploadImageToCloudinary(file);
      setNewQuestionImageUrl(uploaded.secureUrl);
      setNewQuestionImagePublicId(uploaded.publicId);
      setQuestionImageInputKey((prev) => prev + 1);
      setStatusMessage({ type: "success", message: "تم رفع صورة السؤال." });
    } catch (error) {
      setStatusMessage({ type: "error", message: getErrorMessage(error, "تعذر رفع صورة السؤال حالياً.") });
    } finally {
      setIsUploadingQuestionImage(false);
    }
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
    } catch (error) {
      setStatusMessage({ type: "error", message: getErrorMessage(error, "تعذر إضافة التصنيف الآن.") });
    }
  };

  const handleInlineQuestionSave = async () => {
    const parsed = inlineQuestionSchema.safeParse({ title: newQuestionTitle });

    if (!parsed.success) {
      setStatusMessage({ type: "error", message: "أدخل نص السؤال." });
      return;
    }

    if (!newQuestionImageUrl) {
      setStatusMessage({ type: "error", message: "ارفع صورة للسؤال قبل الحفظ." });
      return;
    }

    const normalizedTitle = parsed.data.title.trim();
    const slug = slugify(normalizedTitle);

    if (!slug) {
      setStatusMessage({ type: "error", message: "تعذر إنشاء رابط السؤال، جرّب نصاً آخر." });
      return;
    }

    if (questionPrompts.some((question) => question.slug === slug)) {
      setStatusMessage({ type: "error", message: "هذا السؤال موجود بالفعل." });
      return;
    }

    try {
      const createdId = await createQuestion({
        title: normalizedTitle,
        imageUrl: newQuestionImageUrl,
        slug,
      });

      const createdQuestion: QuestionPrompt = {
        id: createdId,
        questionAr: normalizedTitle,
        slug,
        imageUrl: newQuestionImageUrl,
        order: questionPrompts.length,
        isActive: true,
      };

      setQuestionPrompts((prev) => [createdQuestion, ...prev]);
      setSelectedQuestionId(createdId);
      setNewQuestionTitle("");
      setNewQuestionImageUrl("");
      setNewQuestionImagePublicId("");
      setQuestionImageInputKey((prev) => prev + 1);
      setShowInlineQuestionForm(false);
      setStatusMessage({ type: "success", message: "تمت إضافة السؤال واختياره تلقائياً." });
    } catch (error) {
      setStatusMessage({ type: "error", message: getErrorMessage(error, "تعذر إضافة السؤال الآن.") });
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

    if (uploadedImages.length === 0) {
      setStatusMessage({ type: "error", message: "أضف صورة واحدة على الأقل." });
      return;
    }

    const values = parsed.data;
    const payload = {
      title: values.title?.trim() ?? "",
      description: values.description?.trim() ?? "",
      categorySlugs: selectedCategorySlugs,
      ...buildWallpaperQuestionFields({
        questionId: selectedQuestionId || undefined,
        legacyQuestionPromptSlug: questionPrompts.find((item) => item.id === selectedQuestionId)?.slug,
      }),
      searchKeywords: splitCommaSeparated(values.searchKeywords),
      moodTags: splitCommaSeparated(values.moodTags),
      images: uploadedImages.map((image) => ({
        secureUrl: image.secureUrl,
        alt: values.title?.trim() || "",
      })),
      isPublished: initialWallpaper?.isPublished ?? true,
    };

    setIsSaving(true);

    try {
      if (mode === "edit" && wallpaperId) {
        await updateWallpaper(wallpaperId, payload);
        setStatusMessage({ type: "success", message: "تم تحديث الخلفية بنجاح." });
      } else {
        await createWallpaper(payload);
        setStatusMessage({ type: "success", message: "تم نشر الخلفية." });
        reset({ title: "", description: "", searchKeywords: "", moodTags: "" });
        setSelectedCategorySlugs([]);
        setSelectedQuestionId("");
        setUploadedImages([]);
        setFileInputKey((prev) => prev + 1);
      }

      router.refresh();
    } catch (error) {
      setStatusMessage({ type: "error", message: getErrorMessage(error, "حدث خطأ أثناء الحفظ.") });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1400px] bg-zinc-50 px-4 pb-6 pt-0 dark:bg-zinc-950 sm:px-6 md:pr-24 lg:px-8">
      <AdminTopBar
        title={mode === "edit" ? "تعديل الخلفية" : "إضافة خلفية"}
        subtitle="أدخل بيانات الخلفية"
        backHref="/admin"
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-3 space-y-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6 md:mt-5"
      >
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            عنوان الخلفية (اختياري)
          </label>
          <input
            id="title"
            type="text"
            {...register("title")}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            placeholder="مثال: خلفية ليلية"
          />
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            وصف
          </label>
          <textarea
            id="description"
            rows={3}
            {...register("description")}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            placeholder="اختياري"
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/60 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">التصنيفات</label>
            <button
              type="button"
              onClick={() => setShowInlineCategoryForm((prev) => !prev)}
              className="text-xs font-semibold text-zinc-800 dark:text-zinc-200"
            >
              ➕ إضافة تصنيف
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
                    active ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900" : "border-zinc-300 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                  }`}
                >
                  {category.nameAr}
                </button>
              );
            })}
          </div>
          <FieldHint>المحدد حالياً: {selectedCategoriesText}</FieldHint>

          {showInlineCategoryForm && (
            <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <input
                value={newCategoryNameAr}
                onChange={(event) => setNewCategoryNameAr(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                placeholder="اسم التصنيف بالعربية"
              />
              <button
                type="button"
                onClick={handleInlineCategorySave}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                حفظ التصنيف
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/60 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">اقتراحات زر ؟</label>
            <button
              type="button"
              onClick={() => setShowInlineQuestionForm((prev) => !prev)}
              className="text-xs font-semibold text-zinc-800 dark:text-zinc-200"
            >
              ➕ إضافة سؤال
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {questionPrompts.map((prompt) => {
              const active = selectedQuestionId === prompt.id;
              return (
                <button
                  key={prompt.id ?? prompt.slug}
                  type="button"
                  onClick={() => toggleQuestion(prompt.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                    active ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900" : "border-zinc-300 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                  }`}
                >
                  {prompt.questionAr}
                </button>
              );
            })}
          </div>
          <FieldHint>المحدد حالياً: {selectedQuestionText}</FieldHint>

          {showInlineQuestionForm && (
            <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <input
                value={newQuestionTitle}
                onChange={(event) => setNewQuestionTitle(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                placeholder="نص السؤال"
              />

              <div className="space-y-2">
                <input
                  key={questionImageInputKey}
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleQuestionImageSelect(event.target.files?.[0] ?? null)}
                  className="block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
                {isUploadingQuestionImage ? <p className="text-sm text-zinc-700 dark:text-zinc-300">جاري رفع صورة السؤال...</p> : null}
                {newQuestionImageUrl ? (
                  <div className="w-full max-w-[180px] overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
                      <Image
                        src={newQuestionImageUrl}
                        alt={newQuestionTitle || "صورة السؤال"}
                        fill
                        className="object-cover"
                        sizes="180px"
                        unoptimized
                      />
                    </div>
                    {newQuestionImagePublicId ? (
                      <button
                        type="button"
                        onClick={() => {
                          setNewQuestionImageUrl("");
                          setNewQuestionImagePublicId("");
                          setQuestionImageInputKey((prev) => prev + 1);
                        }}
                        className="w-full border-t border-zinc-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-zinc-700 dark:text-red-300 dark:hover:bg-red-950/40"
                      >
                        إزالة صورة السؤال
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleInlineQuestionSave}
                disabled={isUploadingQuestionImage}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-60"
              >
                حفظ السؤال
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="searchKeywords" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              كلمات البحث
            </label>
            <input
              id="searchKeywords"
              type="text"
              {...register("searchKeywords")}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              placeholder="ليل، هدوء، سماء"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="moodTags" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              كلمات المزاج
            </label>
            <input
              id="moodTags"
              type="text"
              {...register("moodTags")}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              placeholder="هادئ، تركيز"
            />
          </div>
        </div>

        <section className="space-y-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950/60">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">📤 رفع الصور</p>
            <FieldHint>اختر صورة وسيتم رفعها تلقائياً وإضافتها للمعاينة.</FieldHint>
          </div>
          <input
            key={fileInputKey}
            type="file"
            accept="image/*"
            onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
            className="block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          {isUploading && <p className="text-sm text-zinc-700 dark:text-zinc-300">جاري رفع الصورة...</p>}

          {uploadedImages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">المعاينة</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {uploadedImages.map((image, index) => (
                  <article key={image.publicId} className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
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
                      className="w-full border-t border-zinc-200 px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-zinc-700 dark:text-red-300 dark:hover:bg-red-950/40"
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
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            {statusMessage.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving || isUploading || isUploadingQuestionImage}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isSaving
            ? mode === "edit"
              ? "جاري حفظ التعديلات..."
              : "جاري نشر الخلفية..."
            : mode === "edit"
              ? "💾 حفظ التعديلات"
              : "نشر الخلفية"}
        </button>
      </form>
    </main>
  );
}
