"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AdminTopBar } from "@/app/admin/_components/admin-top-bar";
import { uploadImageToCloudinary } from "@/lib/cloudinary/upload";
import { createQuestion, updateQuestion } from "@/lib/firestore/questions";
import { listWallpapers } from "@/lib/firestore/wallpapers";
import type { Question } from "@/types/question";
import type { Wallpaper } from "@/types/wallpaper";

const questionSchema = z.object({
  title: z.string().trim().min(1, "نص السؤال مطلوب"),
  wallpaperId: z.string().optional(),
  isActive: z.boolean(),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function QuestionForm({
  mode,
  questionId,
  initialQuestion,
}: {
  mode: "create" | "edit";
  questionId?: string;
  initialQuestion?: Question | null;
}) {
  const router = useRouter();
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [isLoadingWallpapers, setIsLoadingWallpapers] = useState(true);
  const [imageUrl, setImageUrl] = useState(initialQuestion?.imageUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    defaultValues: {
      title: initialQuestion?.title ?? "",
      wallpaperId: initialQuestion?.wallpaperId ?? "",
      isActive: initialQuestion?.isActive ?? true,
    },
  });

  const selectedWallpaperId = watch("wallpaperId");

  useEffect(() => {
    async function loadWallpapers() {
      try {
        const data = await listWallpapers(100);
        setWallpapers(data);
      } finally {
        setIsLoadingWallpapers(false);
      }
    }

    loadWallpapers();
  }, []);

  useEffect(() => {
    if (!initialQuestion) return;

    reset({
      title: initialQuestion.title,
      wallpaperId: initialQuestion.wallpaperId ?? "",
      isActive: initialQuestion.isActive,
    });
    setImageUrl(initialQuestion.imageUrl);
  }, [initialQuestion, reset]);

  const selectedWallpaper = useMemo(
    () => wallpapers.find((item) => item.id === selectedWallpaperId),
    [selectedWallpaperId, wallpapers]
  );

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const uploaded = await uploadImageToCloudinary(file);
      setImageUrl(uploaded.secureUrl);
      setStatusMessage({ type: "success", message: "تم رفع صورة السؤال." });
      setFileInputKey((prev) => prev + 1);
    } catch {
      setStatusMessage({ type: "error", message: "تعذر رفع الصورة حالياً." });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (rawValues: QuestionFormValues) => {
    setStatusMessage(null);

    const parsed = questionSchema.safeParse(rawValues);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      if (fieldErrors.title?.[0]) {
        setError("title", { message: fieldErrors.title[0] });
      }
      return;
    }

    if (!imageUrl) {
      setStatusMessage({ type: "error", message: "أضف صورة للسؤال أولاً." });
      return;
    }

    const wallpaper = wallpapers.find((item) => item.id === parsed.data.wallpaperId);

    const payload = {
      title: parsed.data.title,
      imageUrl,
      wallpaperId: wallpaper?.id,
      wallpaperTitle: wallpaper?.title,
      slug: initialQuestion?.slug || slugify(parsed.data.title),
      isActive: parsed.data.isActive,
    };

    if (!payload.slug) {
      setStatusMessage({ type: "error", message: "تعذر إنشاء رابط السؤال، عدّل النص وحاول مرة أخرى." });
      return;
    }

    setIsSaving(true);

    try {
      if (mode === "edit" && questionId) {
        await updateQuestion(questionId, payload);
        setStatusMessage({ type: "success", message: "تم تحديث السؤال." });
      } else {
        await createQuestion(payload);
        setStatusMessage({ type: "success", message: "تم إنشاء السؤال." });
        reset({ title: "", wallpaperId: "", isActive: true });
        setImageUrl("");
        setFileInputKey((prev) => prev + 1);
      }

      router.refresh();
    } catch {
      setStatusMessage({ type: "error", message: "تعذر حفظ السؤال حالياً." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <AdminTopBar
        title={mode === "edit" ? "تعديل السؤال" : "إضافة سؤال"}
        subtitle="أنشئ بطاقة سؤال مرتبطة بخلفية واحدة"
        backHref="/admin/questions"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-semibold text-zinc-900">
            نص السؤال
          </label>
          <input
            id="title"
            type="text"
            {...register("title")}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-900"
            placeholder="مثال: هل تحتاج إلى هدوء؟"
          />
          {errors.title ? <p className="text-sm text-red-600">{errors.title.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="wallpaperId" className="block text-sm font-semibold text-zinc-900">
            الخلفية المرتبطة (اختياري)
          </label>
          <select
            id="wallpaperId"
            {...register("wallpaperId")}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900"
            disabled={isLoadingWallpapers}
          >
            <option value="">بدون تحديد</option>
            {wallpapers.map((wallpaper) => (
              <option key={wallpaper.id} value={wallpaper.id}>
                {wallpaper.title || wallpaper.id}
              </option>
            ))}
          </select>
          {selectedWallpaper ? (
            <p className="text-xs text-zinc-600">السؤال سيفتح الخلفية: {selectedWallpaper.title || selectedWallpaper.id}</p>
          ) : null}
        </div>

        <section className="space-y-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4">
          <div>
            <p className="text-sm font-semibold text-zinc-900">صورة السؤال</p>
            <p className="text-xs text-zinc-600">نفس مسار الرفع الحالي يُستخدم هنا لتقليل التعقيد.</p>
          </div>
          <input
            key={fileInputKey}
            type="file"
            accept="image/*"
            onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
            className="block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          />
          {isUploading ? <p className="text-sm text-zinc-700">جاري رفع الصورة...</p> : null}
          {imageUrl ? (
            <div className="w-full max-w-[180px] overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <div className="relative aspect-square bg-zinc-100">
                <Image
                  src={imageUrl}
                  alt={watch("title") || "صورة السؤال"}
                  fill
                  className="object-cover"
                  sizes="180px"
                  unoptimized
                />
              </div>
            </div>
          ) : null}
        </section>

        <label className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-zinc-900">تفعيل السؤال</p>
            <p className="text-xs text-zinc-600">عند تعطيله لن يظهر في واجهة الموقع.</p>
          </div>
          <input type="checkbox" {...register("isActive")} className="h-4 w-4 accent-zinc-900" />
        </label>

        {statusMessage ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              statusMessage.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {statusMessage.message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSaving || isUploading}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSaving ? "جاري الحفظ..." : mode === "edit" ? "حفظ السؤال" : "إنشاء السؤال"}
        </button>
      </form>
    </main>
  );
}
