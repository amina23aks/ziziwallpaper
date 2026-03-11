"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { uploadImageToCloudinary } from "@/lib/cloudinary/upload";
import { createWallpaper } from "@/lib/firestore/wallpapers";

const formSchema = z.object({
  title: z.string().trim().min(1, "يرجى إدخال عنوان الخلفية"),
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

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-5 text-zinc-500 sm:text-sm">{children}</p>;
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 space-y-1 sm:mb-5">
        <h2 className="text-lg font-bold text-zinc-900 sm:text-xl">{title}</h2>
        {subtitle && <p className="text-sm text-zinc-600">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function NewWallpaperPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
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
        message: "اختر صورة أولاً ثم اضغط على زر رفع الصورة.",
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploadedImage = await uploadImageToCloudinary(selectedFile);
      setUploadedImages((prev) => [...prev, uploadedImage]);
      setSelectedFile(null);
      setFileInputKey((prev) => prev + 1);
      setStatusMessage({
        type: "success",
        message: "تم رفع الصورة بنجاح. يمكنك رفع صور إضافية.",
      });
    } catch {
      setStatusMessage({
        type: "error",
        message: "تعذر رفع الصورة حالياً. حاول مرة أخرى.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedImage = (publicId: string) => {
    setUploadedImages((prev) => prev.filter((image) => image.publicId !== publicId));
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
        message: "أضف صورة واحدة على الأقل قبل حفظ الخلفية.",
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
        message: "تم حفظ الخلفية بنجاح في قاعدة البيانات.",
      });

      reset();
      setUploadedImages([]);
      setSelectedFile(null);
      setFileInputKey((prev) => prev + 1);
    } catch {
      setStatusMessage({
        type: "error",
        message: "حدث خطأ أثناء حفظ الخلفية. حاول مرة أخرى.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <header className="mb-6 rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-5 sm:mb-8 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
              إضافة خلفية جديدة
            </h1>
            <p className="text-sm leading-6 text-zinc-600 sm:text-base">
              أدخل بيانات الخلفية، ارفع الصور، ثم احفظها لتظهر في لوحة الإدارة.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
          >
            العودة إلى الرئيسية
          </Link>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
        <SectionCard title="معلومات الخلفية" subtitle="المعلومات الأساسية التي تظهر للمستخدم.">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-semibold text-zinc-800">
              عنوان الخلفية *
            </label>
            <input
              id="title"
              type="text"
              {...register("title")}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500"
              placeholder="مثال: خلفية ليلية هادئة"
            />
            <FieldHint>اسم واضح ومباشر ليسهل التعرف على الخلفية داخل التطبيق.</FieldHint>
            {errors.title && <p className="text-sm font-medium text-red-600">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-semibold text-zinc-800">
              وصف مختصر
            </label>
            <textarea
              id="description"
              rows={4}
              {...register("description")}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500"
              placeholder="اكتب وصفاً بسيطاً يوضح طابع الخلفية أو ألوانها"
            />
            <FieldHint>الوصف اختياري، لكنه يساعد في تنظيم المحتوى وفهم الخلفية بسرعة.</FieldHint>
          </div>
        </SectionCard>

        <SectionCard
          title="التنظيم والتصنيف"
          subtitle="هذه البيانات تساعد في الترتيب والبحث واقتراح النتائج للمستخدم."
        >
          <div className="space-y-2">
            <label htmlFor="categorySlugs" className="block text-sm font-semibold text-zinc-800">
              التصنيفات (مفصولة بفاصلة)
            </label>
            <input
              id="categorySlugs"
              type="text"
              {...register("categorySlugs")}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500"
              placeholder="nature, abstract, dark"
            />
            <FieldHint>
              التصنيفات هي الأقسام الرئيسية للخلفية مثل: طبيعة، تجريدي، داكن.
            </FieldHint>
          </div>

          <div className="space-y-2">
            <label htmlFor="searchKeywords" className="block text-sm font-semibold text-zinc-800">
              كلمات البحث (مفصولة بفاصلة)
            </label>
            <input
              id="searchKeywords"
              type="text"
              {...register("searchKeywords")}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500"
              placeholder="ليل, نجوم, هدوء"
            />
            <FieldHint>
              اكتب كلمات قد يستخدمها المستخدم في البحث للوصول إلى هذه الخلفية.
            </FieldHint>
          </div>

          <div className="space-y-2">
            <label htmlFor="moodTags" className="block text-sm font-semibold text-zinc-800">
              Mood Tags (مفصولة بفاصلة)
            </label>
            <input
              id="moodTags"
              type="text"
              {...register("moodTags")}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500"
              placeholder="calm, focus, cozy"
            />
            <FieldHint>
              وسوم داخلية مرتبطة بالمشاعر، وسيتم استخدامها لاحقاً مع مساعد المزاج &quot;؟&quot;.
            </FieldHint>
          </div>
        </SectionCard>

        <SectionCard title="الصور" subtitle="ارفع صورة أو أكثر، ثم راجعها قبل الحفظ النهائي.">
          <div className="space-y-2">
            <label htmlFor="imageFile" className="block text-sm font-semibold text-zinc-800">
              اختر صورة من جهازك
            </label>
            <input
              key={fileInputKey}
              id="imageFile"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
              }}
              className="block w-full cursor-pointer rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-700"
            />
            <FieldHint>
              بعد اختيار الصورة، اضغط على &quot;رفع الصورة&quot; لإضافتها إلى قائمة الصور المرفوعة.
            </FieldHint>
          </div>

          <button
            type="button"
            onClick={handleUploadImage}
            disabled={isUploading || !selectedFile}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isUploading ? "جاري رفع الصورة..." : "رفع الصورة"}
          </button>

          {uploadedImages.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-zinc-800">
                الصور المرفوعة ({uploadedImages.length})
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {uploadedImages.map((image, index) => (
                  <article
                    key={image.publicId}
                    className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
                  >
                    <div className="relative aspect-square bg-zinc-100">
                      <Image
                        src={image.secureUrl}
                        alt={title?.trim() || `صورة الخلفية ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 200px"
                        unoptimized
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2.5">
                      <p className="text-xs text-zinc-500">{image.width} × {image.height}</p>
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(image.publicId)}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        إزالة
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="النشر" subtitle="حدد ما إذا كنت تريد إتاحة الخلفية مباشرة للمستخدمين.">
          <label
            htmlFor="isPublished"
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3"
          >
            <input
              id="isPublished"
              type="checkbox"
              {...register("isPublished")}
              className="mt-0.5 h-5 w-5 rounded border-zinc-300"
            />
            <span className="space-y-1">
              <span className="block text-sm font-semibold text-zinc-800">نشر الخلفية فوراً</span>
              <span className="block text-xs leading-5 text-zinc-500 sm:text-sm">
                عند التفعيل، ستكون الخلفية جاهزة للعرض مباشرة بعد الحفظ.
              </span>
            </span>
          </label>
        </SectionCard>

        <SectionCard title="الحفظ" subtitle="راجع البيانات ثم احفظ الخلفية.">
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
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "جاري حفظ الخلفية..." : "حفظ الخلفية"}
          </button>
          <FieldHint>
            لن يتم الحفظ إلا بعد إضافة صورة واحدة على الأقل.
          </FieldHint>
        </SectionCard>
      </form>
    </main>
  );
}
