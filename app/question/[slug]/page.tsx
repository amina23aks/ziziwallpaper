"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DesktopWallpaperFeed } from "@/app/_components/desktop-wallpaper-feed";
import { getQuestionBySlug } from "@/lib/firestore/questions";
import { listPublishedWallpapersByQuestionId } from "@/lib/firestore/wallpapers";
import type { Question } from "@/types/question";
import type { Wallpaper } from "@/types/wallpaper";

export default function QuestionResultsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [question, setQuestion] = useState<Question | null>(null);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const selectedQuestion = await getQuestionBySlug(slug);
        setQuestion(selectedQuestion);

        if (!selectedQuestion?.id) {
          setWallpapers([]);
          return;
        }

        const data = await listPublishedWallpapersByQuestionId(selectedQuestion.id, 100);
        const sorted = [...data].sort((left, right) => {
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

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-zinc-50 px-4 py-6 sm:px-6">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-zinc-900 sm:text-2xl">
          {question?.title || "نتائج السؤال"}
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
