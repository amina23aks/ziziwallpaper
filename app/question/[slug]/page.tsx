"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getQuestionBySlug } from "@/lib/firestore/questions";
import { getWallpaperById } from "@/lib/firestore/wallpapers";
import type { Question } from "@/types/question";
import type { Wallpaper } from "@/types/wallpaper";

export default function QuestionResultsPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const [question, setQuestion] = useState<Question | null>(null);
  const [wallpaper, setWallpaper] = useState<Wallpaper | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const selectedQuestion = await getQuestionBySlug(slug);
        setQuestion(selectedQuestion);
        if (!selectedQuestion?.wallpaperId) {
          return;
        }

        const linkedWallpaper = await getWallpaperById(selectedQuestion.wallpaperId);
        setWallpaper(linkedWallpaper);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadData();
    }
  }, [slug]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-zinc-50 px-4 py-6 sm:px-6">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-zinc-900 sm:text-2xl">
          {question ? question.title : "نتائج السؤال"}
        </h1>
        <Link href="/" className="text-sm font-semibold text-zinc-800 hover:underline">
          العودة للرئيسية
        </Link>
      </header>

      {isLoading ? (
        <p className="text-sm text-zinc-600">جاري تحميل النتائج...</p>
      ) : !question ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-700">
          هذا السؤال غير متاح حالياً.
        </div>
      ) : !wallpaper?.id ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-700">
          لا توجد خلفية مرتبطة بهذا السؤال حالياً.
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-right shadow-sm">
          <p className="mb-3 text-sm text-zinc-600">سيتم تحويلك إلى الخلفية المرتبطة بهذا السؤال.</p>
          <button
            type="button"
            onClick={() => router.push(`/wallpaper/${wallpaper.id}`)}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          >
            فتح الخلفية
          </button>
        </div>
      )}
    </main>
  );
}
