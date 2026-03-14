"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PublicWallpaperCard } from "@/app/_components/public-wallpaper-card";
import { listQuestionPrompts } from "@/lib/firestore/question-prompts";
import { listPublishedWallpapersByQuestionPrompt } from "@/lib/firestore/wallpapers";
import type { QuestionPrompt } from "@/types/question-prompt";
import type { Wallpaper } from "@/types/wallpaper";

export default function QuestionResultsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [questionPrompts, setQuestionPrompts] = useState<QuestionPrompt[]>([]);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const prompts = await listQuestionPrompts();
        setQuestionPrompts(prompts);

        const hasSlug = prompts.some((item) => item.slug === slug);
        if (!hasSlug) {
          setWallpapers([]);
          return;
        }

        const data = await listPublishedWallpapersByQuestionPrompt(slug, 100);
        setWallpapers(data);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadData();
    }
  }, [slug]);

  const selectedQuestion = useMemo(
    () => questionPrompts.find((item) => item.slug === slug),
    [questionPrompts, slug]
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-zinc-50 px-4 py-6 sm:px-6">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-zinc-900 sm:text-2xl">
          {selectedQuestion ? selectedQuestion.questionAr : "نتائج السؤال"}
        </h1>
        <Link href="/" className="text-sm font-semibold text-zinc-800 hover:underline">
          العودة للرئيسية
        </Link>
      </header>

      {isLoading ? (
        <p className="text-sm text-zinc-600">جاري تحميل النتائج...</p>
      ) : !selectedQuestion ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-700">
          هذا السؤال غير متاح حالياً.
        </div>
      ) : wallpapers.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-700">
          لا توجد خلفيات مرتبطة بهذا السؤال حالياً.
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {wallpapers.map((wallpaper, index) => (
            <PublicWallpaperCard key={wallpaper.id ?? index} wallpaper={wallpaper} />
          ))}
        </section>
      )}
    </main>
  );
}
