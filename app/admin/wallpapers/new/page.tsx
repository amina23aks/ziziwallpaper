"use client";

import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { uploadImageToCloudinary } from "@/lib/cloudinary/upload";
import { createWallpaper } from "@/lib/firestore/wallpapers";

const formSchema = z.object({
  title: z.string().trim().min(1, "العنوان مطلوب"),
  description: z.string().optional(),
  categorySlugs: z.string().optional(),
  searchKeywords: z.string().optional(),
  moodTags: z.string().optional(),
  isPublished: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

type UploadedImagePreview = {
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
};

function splitCommaSeparated(value: string | undefined) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function NewWallpaperPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImagePreview[]>([]);
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
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      description: "",
      categorySlugs: "",
      searchKeywords: "",
      moodTags: "",
      isPublished: false,
    },
  });

  const title = watch("title");

  const handleUploadImage = async () => {
    setStatusMessage(null);

    if (!selectedFile) {
      setStatusMessage({
        type: "error",
        message: "اختر صورة أولاً قبل الرفع.",
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploadedImage = await uploadImageToCloudinary(selectedFile);
      setUploadedImages((prev) => [...prev, uploadedImage]);
      setSelectedFile(null);
      setStatusMessage({
        type: "success",
        message: "تم رفع الصورة بنجاح.",
      });
    } catch {
      setStatusMessage({
        type: "error",
        message: "فشل رفع الصورة. حاول مرة أخرى.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (rawValues: FormValues) => {
    setStatusMessage(null);

    const parsed = formSchema.safeParse(rawValues);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;

      if (fieldErrors.title?.[0]) {
        setError("title", { message: fieldErrors.title[0] });
      }

      return;
    }

    if (uploadedImages.length === 0) {
      setStatusMessage({
        type: "error",
        message: "ارفع صورة واحدة على الأقل قبل الحفظ.",
      });
      return;
    }

    const values = parsed.data;
    setIsSaving(true);

    try {
      await createWallpaper({
        title: values.title.trim(),
        description: values.description?.trim() ?? "",
        categorySlugs: splitCommaSeparated(values.categorySlugs),
        searchKeywords: splitCommaSeparated(values.searchKeywords),
        moodTags: splitCommaSeparated(values.moodTags),
        images: uploadedImages.map((image) => ({
          secureUrl: image.secureUrl,
          alt: values.title.trim(),
        })),
        isPublished: values.isPublished,
      });

      setStatusMessage({
        type: "success",
        message: "تم حفظ الخلفية بنجاح.",
      });

      reset();
      setUploadedImages([]);
      setSelectedFile(null);
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
        املأ البيانات التالية ثم ارفع الصور واحفظ الخلفية في قاعدة البيانات.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
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

        <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-medium text-zinc-800">رفع الصور *</p>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
            }}
            className="block w-full cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
          />

          <button
            type="button"
            onClick={handleUploadImage}
            disabled={isUploading || !selectedFile}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? "جاري رفع الصورة..." : "رفع الصورة"}
          </button>

          {uploadedImages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-zinc-700">الصور المرفوعة ({uploadedImages.length})</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {uploadedImages.map((image) => (
                  <div
                    key={image.publicId}
                    className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={image.secureUrl}
                        alt={title?.trim() || "Wallpaper image"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 200px"
                        unoptimized
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
          disabled={isSaving || isUploading}
          className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSaving ? "جاري الحفظ..." : "حفظ الخلفية"}
        </button>
      </form>
    </main>
  );
}
