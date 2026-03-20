"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DesktopWallpaperFeed } from "@/app/_components/desktop-wallpaper-feed";
import { getQuestionBySlug } from "@/lib/firestore/questions";
import { listQuestionPrompts } from "@/lib/firestore/question-prompts";
import {
  listPublishedWallpapersByQuestionId,
  listPublishedWallpapersByQuestionPrompt,
} from "@/lib/firestore/wallpapers";
import type { QuestionPrompt } from "@/types/question-prompt";
import type { Question } from "@/types/question";
import type { Wallpaper } from "@/types/wallpaper";

export default function QuestionResultsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionPrompts, setQuestionPrompts] = useState<QuestionPrompt[]>([]);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [selectedQuestion, prompts] = await Promise.all([
          getQuestionBySlug(slug),
          listQuestionPrompts(),
        ]);

        setQuestion(selectedQuestion);
        setQuestionPrompts(prompts);

        if (!selectedQuestion) {
          setWallpapers([]);
          return;
        }

        const data = selectedQuestion.id
          ? await listPublishedWallpapersByQuestionId(selectedQuestion.id, 100)
          : [];
        const fallbackData =
          data.length > 0 ? data : await listPublishedWallpapersByQuestionPrompt(selectedQuestion.slug, 100);
        const sorted = [...fallbackData].sort((left, right) => {
          const leftSeconds = (left.createdAt as { seconds?: number } | null | undefined)?.seconds ?? 0;
          const rightSeconds = (right.createdAt as { seconds?: number } | null | undefined)?.seconds ?? 0;

          if (rightSeconds !== leftSeconds) {
            return rightSeconds - leftSeconds;
          }

          return (right.id ?? "").localeCompare(left.id ?? "");
        });

        setWallpapers(sorted);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadData();
    }
  }, [slug]);

  const selectedQuestion = useMemo(
    () => question ?? questionPrompts.find((item) => item.slug === slug) ?? null,
    [question, questionPrompts, slug]
  );
  const selectedQuestionTitle =
    selectedQuestion && "questionAr" in selectedQuestion ? selectedQuestion.questionAr : selectedQuestion?.title;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-zinc-50 px-4 py-6 sm:px-6">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-zinc-900 sm:text-2xl">
          {selectedQuestionTitle || "نتائج السؤال"}
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
        <div className="space-y-4">
          <DesktopWallpaperFeed wallpapers={wallpapers} columnCount={4} />
        </div>
      )}
    </main>
  );
}
