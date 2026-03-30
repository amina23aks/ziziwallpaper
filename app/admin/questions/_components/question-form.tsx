"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AdminTopBar } from "@/app/admin/_components/admin-top-bar";
import { uploadImageToCloudinary } from "@/lib/cloudinary/upload";
import { createQuestion, updateQuestion } from "@/lib/firestore/questions";
import type { Question } from "@/types/question";

const questionSchema = z.object({
  title: z.string().trim().min(1, "نص السؤال مطلوب"),
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


function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
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
    },
  });

  const titleValue = watch("title") ?? initialQuestion?.title ?? "";

  useEffect(() => {
    if (!initialQuestion) return;

    reset({
      title: initialQuestion.title,
    });
    setImageUrl(initialQuestion.imageUrl);
  }, [initialQuestion, reset]);

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const uploaded = await uploadImageToCloudinary(file);
      setImageUrl(uploaded.secureUrl);
      setStatusMessage({ type: "success", message: "تم رفع صورة السؤال." });
      setFileInputKey((prev) => prev + 1);
    } catch (error) {
      setStatusMessage({ type: "error", message: getErrorMessage(error, "تعذر رفع الصورة حالياً.") });
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

    const payload = {
      title: parsed.data.title,
      imageUrl,
      slug: initialQuestion?.slug || slugify(parsed.data.title),
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
        reset({ title: "" });
        setImageUrl("");
        setFileInputKey((prev) => prev + 1);
      }

      router.refresh();
    } catch (error) {
      setStatusMessage({ type: "error", message: getErrorMessage(error, "تعذر حفظ السؤال حالياً.") });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1200px] bg-[var(--app-bg)] px-4 pb-6 pt-0 sm:px-6 md:pr-28 lg:px-8 lg:pr-32">
      <AdminTopBar
        title={mode === "edit" ? "تعديل السؤال" : "إضافة سؤال"}
        subtitle="أنشئ بطاقة سؤال بصورة ونص فقط"
        backHref="/admin/questions"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-3 space-y-5 rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm sm:p-6 md:mt-5">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-semibold text-[var(--app-text)]">
            نص السؤال
          </label>
          <input
            id="title"
            type="text"
            {...register("title")}
            className="w-full rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm font-medium text-[var(--app-text)] placeholder:text-[var(--app-text-muted)]"
            placeholder="مثال: هل تحتاج إلى هدوء؟"
          />
          {errors.title ? <p className="text-sm text-red-600">{errors.title.message}</p> : null}
        </div>

        <section className="space-y-3 rounded-2xl border border-dashed border-[color:var(--app-border)] bg-[var(--app-surface-muted)] p-4">
          <div>
            <p className="text-sm font-semibold text-[var(--app-text)]">صورة السؤال</p>
            <p className="text-xs text-[var(--app-text-muted)]">نفس مسار الرفع الحالي يُستخدم هنا لتقليل التعقيد.</p>
          </div>
          <input
            key={fileInputKey}
            type="file"
            accept="image/*"
            onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
            className="block w-full rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--app-surface-muted)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--app-text)]"
          />
          {isUploading ? <p className="text-sm text-[var(--app-text-muted)]">جاري رفع الصورة...</p> : null}
          {imageUrl ? (
            <div className="w-full max-w-[180px] overflow-hidden rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface)]">
              <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src={imageUrl}
                  alt={titleValue || "صورة السؤال"}
                  fill
                  className="object-cover"
                  sizes="180px"
                  unoptimized
                />
              </div>
            </div>
          ) : null}
        </section>

        {statusMessage ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              statusMessage.type === "success"
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            {statusMessage.message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSaving || isUploading}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--app-text)] dark:border-white dark:bg-white dark:text-black disabled:opacity-60"
        >
          {isSaving ? "جاري الحفظ..." : mode === "edit" ? "حفظ السؤال" : "إنشاء السؤال"}
        </button>
      </form>
    </main>
  );
}
