"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DeleteConfirmDialog } from "@/app/_components/delete-confirm-dialog";
import { AdminTopBar } from "@/app/admin/_components/admin-top-bar";
import { deleteQuestion, listQuestions } from "@/lib/firestore/questions";
import type { Question } from "@/types/question";

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  async function loadQuestions() {
    setIsLoading(true);
    try {
      const data = await listQuestions(50);
      setQuestions(data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteQuestion(deletingId);
      setQuestions((prev) => prev.filter((item) => item.id !== deletingId));
      setStatusMessage("تم حذف السؤال.");
    } catch {
      setStatusMessage("تعذر حذف السؤال حالياً.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-5 bg-[var(--app-bg)] px-4 pb-6 pt-0 sm:px-6 md:pr-28 lg:px-8 lg:pr-32">
      <AdminTopBar title="الأسئلة" subtitle="إدارة بطاقات الأسئلة" backHref="/admin" />

      <section className="mt-3 flex items-center justify-start [direction:ltr] md:mt-5">
        <Link
          href="/admin/questions/new"
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-[var(--app-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--app-text)] dark:border-white dark:bg-white dark:text-black"
        >
          <Plus size={13} />
          <span>إضافة سؤال</span>
        </Link>
      </section>

      {statusMessage ? (
        <div className="rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-medium text-[var(--app-text)]">
          {statusMessage}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] shadow-sm">
        {isLoading ? (
          <p className="p-4 text-sm text-[var(--app-text-muted)]">جاري تحميل الأسئلة...</p>
        ) : questions.length === 0 ? (
          <p className="p-4 text-sm text-[var(--app-text-muted)]">لا توجد أسئلة محفوظة حتى الآن.</p>
        ) : (
          <div className="divide-y divide-[color:var(--app-border)]">
            {questions.map((question, index) => (
              <article
                key={question.id ?? index}
                className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 p-3 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-[color:var(--app-border)] bg-[var(--app-surface-muted)]">
                  {question.imageUrl ? (
                    <Image src={question.imageUrl} alt={question.title} fill className="object-cover" sizes="64px" unoptimized />
                  ) : null}
                </div>

                <div className="min-w-0 space-y-1">
                  <p className="line-clamp-1 text-sm font-semibold text-[var(--app-text)]">{question.title}</p>
                  <p className="text-xs text-[var(--app-text-muted)]">رابط السؤال: /question/{question.slug}</p>
                </div>

                <div className="col-span-2 flex gap-2 sm:col-auto sm:justify-end">
                  <Link
                    href={question.id ? `/admin/questions/${question.id}/edit` : "#"}
                    className="inline-flex flex-1 items-center justify-center rounded-lg border border-zinc-300 bg-[var(--app-surface)] px-3 py-2 text-xs font-semibold text-[var(--app-text)] dark:border-white dark:bg-white dark:text-black sm:flex-none"
                  >
                    تعديل
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeletingId(question.id ?? null)}
                    className="inline-flex flex-1 items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 sm:flex-none"
                  >
                    حذف
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <DeleteConfirmDialog
        isOpen={Boolean(deletingId)}
        title="تأكيد حذف السؤال"
        description="هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء."
        confirmVariant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </main>
  );
}
