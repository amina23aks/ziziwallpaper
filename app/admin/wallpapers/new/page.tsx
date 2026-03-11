"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createWallpaper } from "@/lib/firestore/wallpapers";

const wallpaperFormSchema = z.object({
  title: z.string().trim().min(1, "العنوان مطلوب"),
  description: z.string().optional(),
  categorySlugs: z.string().optional(),
  searchKeywords: z.string().optional(),
  moodTags: z.string().optional(),
  imageUrls: z.string().trim().min(1, "أضف رابط صورة واحد على الأقل"),
  isPublished: z.boolean(),
});

type WallpaperFormValues = z.infer<typeof wallpaperFormSchema>;

function toCommaArray(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toImageArray(imageUrls: string, title: string) {
  return imageUrls
    .split("\n")
    .map((url) => url.trim())
    .filter(Boolean)
    .map((secureUrl) => ({
      secureUrl,
      alt: title,
    }));
}

export default function NewWallpaperPage() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<WallpaperFormValues>({
    defaultValues: {
      title: "",
      description: "",
      categorySlugs: "",
      searchKeywords: "",
      moodTags: "",
      imageUrls: "",
      isPublished: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setStatusMessage(null);
    setStatusType(null);

    const parsed = wallpaperFormSchema.safeParse(values);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;

      if (fieldErrors.title?.[0]) {
        setError("title", { message: fieldErrors.title[0] });
      }

      if (fieldErrors.imageUrls?.[0]) {
        setError("imageUrls", { message: fieldErrors.imageUrls[0] });
      }

      return;
    }

    const images = toImageArray(parsed.data.imageUrls, parsed.data.title);

    if (images.length === 0) {
      setError("imageUrls", {
        message: "أضف رابط صورة واحد على الأقل",
      });
      return;
    }

    try {
      await createWallpaper({
        title: parsed.data.title,
        description: parsed.data.description?.trim() || "",
        categorySlugs: toCommaArray(parsed.data.categorySlugs),
        searchKeywords: toCommaArray(parsed.data.searchKeywords),
        moodTags: toCommaArray(parsed.data.moodTags),
        images,
        isPublished: parsed.data.isPublished,
      });

      setStatusType("success");
      setStatusMessage("تم إنشاء الخلفية بنجاح.");
      reset();
    } catch {
      setStatusType("error");
      setStatusMessage("حدث خطأ أثناء حفظ الخلفية. حاول مرة أخرى.");
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <main className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          إضافة خلفية جديدة
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          أدخل بيانات الخلفية ثم اضغط حفظ.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-slate-800">
              العنوان *
            </label>
            <input
              id="title"
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-indigo-200 transition focus:ring-2"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-slate-800">
              الوصف
            </label>
            <textarea
              id="description"
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-indigo-200 transition focus:ring-2"
              {...register("description")}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="categorySlugs" className="block text-sm font-medium text-slate-800">
                الفئات (comma-separated)
              </label>
              <input
                id="categorySlugs"
                type="text"
                placeholder="nature, abstract"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-indigo-200 transition focus:ring-2"
                {...register("categorySlugs")}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="searchKeywords" className="block text-sm font-medium text-slate-800">
                كلمات البحث (comma-separated)
              </label>
              <input
                id="searchKeywords"
                type="text"
                placeholder="sunset, sky"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-indigo-200 transition focus:ring-2"
                {...register("searchKeywords")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="moodTags" className="block text-sm font-medium text-slate-800">
              Mood tags (comma-separated)
            </label>
            <input
              id="moodTags"
              type="text"
              placeholder="calm, dark"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-indigo-200 transition focus:ring-2"
              {...register("moodTags")}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="imageUrls" className="block text-sm font-medium text-slate-800">
              روابط الصور (رابط واحد في كل سطر) *
            </label>
            <textarea
              id="imageUrls"
              rows={5}
              placeholder={"https://example.com/image-1.jpg\nhttps://example.com/image-2.jpg"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-indigo-200 transition focus:ring-2"
              {...register("imageUrls")}
            />
            {errors.imageUrls && (
              <p className="text-sm text-red-600">{errors.imageUrls.message}</p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <input type="checkbox" className="h-4 w-4" {...register("isPublished")} />
            نشر الخلفية مباشرة
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 sm:w-auto"
          >
            {isSubmitting ? "جاري الحفظ..." : "حفظ الخلفية"}
          </button>

          {statusMessage && (
            <p
              className={
                statusType === "success" ? "text-sm text-green-700" : "text-sm text-red-700"
              }
            >
              {statusMessage}
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
