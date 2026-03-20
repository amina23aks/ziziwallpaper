"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QuestionForm } from "@/app/admin/questions/_components/question-form";
import { getQuestionById } from "@/lib/firestore/questions";
import type { Question } from "@/types/question";

export default function EditQuestionPage() {
  const params = useParams<{ id: string }>();
  const questionId = params.id;
  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadQuestion() {
      try {
        const data = await getQuestionById(questionId);
        setQuestion(data);
      } finally {
        setIsLoading(false);
      }
    }

    if (questionId) {
      loadQuestion();
    }
  }, [questionId]);

  if (isLoading) {
    return <main className="px-4 py-8 text-sm text-zinc-600">جاري تحميل بيانات السؤال...</main>;
  }

  if (!question) {
    return <main className="px-4 py-8 text-sm text-zinc-600">لم يتم العثور على السؤال المطلوب.</main>;
  }

  return <QuestionForm mode="edit" questionId={questionId} initialQuestion={question} />;
}
