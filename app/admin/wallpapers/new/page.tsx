"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createWallpaper } from "@/lib/firestore/wallpapers";

const formSchema = z.object({
  title: z.string().trim().min(1, "العنوان مطلوب"),
  description: z.string().optional(),
  categorySlugs: z.string().optional(),
  searchKeywords: z.string().optional(),
  moodTags: z.string().optional(),
  imageUrls: z.string().trim().min(1, "أدخل رابط صورة واحد على الأقل"),
  isPublished: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

function splitCommaSeparated(value: string | undefined) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function NewWallpaperPage() {
  const [isSaving, setIsSaving] = useState(false);
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
  } = useForm<FormValues>({
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

  const onSubmit = async (rawValues: FormValues) => {
    setStatusMessage(null);

    const parsed = formSchema.safeParse(rawValues);

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

    const values = parsed.data;
    const imageUrls = values.imageUrls
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (imageUrls.length === 0) {
      setError("imageUrls", {
        message: "أدخل رابط صورة واحد على الأقل",
      });
      return;
    }

    setIsSaving(true);

    try {
      await createWallpaper({
        title: values.title.trim(),
        description: values.description?.trim() ?? "",
        categorySlugs: splitCommaSeparated(values.categorySlugs),
        searchKeywords: splitCommaSeparated(values.searchKeywords),
        moodTags: splitCommaSeparated(values.moodTags),
        images: imageUrls.map((secureUrl) => ({
          secureUrl,
          alt: values.title.trim(),
        })),
        isPublished: values.isPublished,
      });

      setStatusMessage({
        type: "success",
        message: "تم حفظ الخلفية بنجاح.",
      });

      reset();
    } catch {
      setStatusMessage({
        type: "error",
        message: "حدث خطأ أثناء الحفظ. حاول مرة أخرى.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-zinc-900 sm:text-4xl">إضافة خلفية جديدة</h1>
      <p className="mt-2 text-sm text-zinc-600">
        املأ البيانات التالية ثم اضغط حفظ لإضافة الخلفية إلى قاعدة البيانات.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-zinc-800">
            العنوان *
          </label>
          <input
            id="title"
            type="text"
            {...register("title")}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            placeholder="مثال: خلفية طبيعة هادئة"
          />
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-zinc-800">
            الوصف
          </label>
          <textarea
            id="description"
            rows={3}
            {...register("description")}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            placeholder="وصف مختصر للخلفية"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="categorySlugs" className="block text-sm font-medium text-zinc-800">
            التصنيفات (مفصولة بفاصلة)
          </label>
          <input
            id="categorySlugs"
            type="text"
            {...register("categorySlugs")}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            placeholder="nature, dark, minimal"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="searchKeywords" className="block text-sm font-medium text-zinc-800">
            كلمات البحث (مفصولة بفاصلة)
          </label>
          <input
            id="searchKeywords"
            type="text"
            {...register("searchKeywords")}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            placeholder="calm, focus, mountain"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="moodTags" className="block text-sm font-medium text-zinc-800">
            Mood Tags (مفصولة بفاصلة)
          </label>
          <input
            id="moodTags"
            type="text"
            {...register("moodTags")}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            placeholder="relax, energy"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="imageUrls" className="block text-sm font-medium text-zinc-800">
            روابط الصور * (رابط واحد في كل سطر)
          </label>
          <textarea
            id="imageUrls"
            rows={6}
            {...register("imageUrls")}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            placeholder={"https://example.com/image-1.jpg\nhttps://example.com/image-2.jpg"}
          />
          {errors.imageUrls && <p className="text-sm text-red-600">{errors.imageUrls.message}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isPublished"
            type="checkbox"
            {...register("isPublished")}
            className="h-4 w-4 rounded border-zinc-300"
          />
          <label htmlFor="isPublished" className="text-sm font-medium text-zinc-800">
            نشر الخلفية مباشرة
          </label>
        </div>

        {statusMessage && (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              statusMessage.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {statusMessage.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "جاري الحفظ..." : "حفظ الخلفية"}
        </button>
      </form>
    </main>
  );
}
