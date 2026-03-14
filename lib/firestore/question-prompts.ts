import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { QuestionPrompt } from "@/types/question-prompt";

const questionPromptsCollection = collection(db, "questionPrompts");

export const fallbackQuestionPrompts: QuestionPrompt[] = [
  {
    questionAr: "هل تريد النوم؟",
    slug: "want-sleep",
    imageUrl: "/questions/sleep.png",
    order: 0,
    isActive: true,
  },
  {
    questionAr: "هل تريد الإنجاز؟",
    slug: "want-achievement",
    imageUrl: "/questions/do.png",
    order: 1,
    isActive: true,
  },
  {
    questionAr: "هل أنت مشتت؟",
    slug: "distracted",
    imageUrl: "/questions/focus.png",
    order: 2,
    isActive: true,
  },
  {
    questionAr: "هل تريد طاقة؟",
    slug: "need-energy",
    imageUrl: "/questions/energy.png",
    order: 3,
    isActive: true,
  },
];

export async function listQuestionPrompts(maxItems = 20) {
  let prompts: QuestionPrompt[] = [];

  try {
    const snapshot = await getDocs(
      query(
        questionPromptsCollection,
        where("isActive", "==", true),
        orderBy("order", "asc"),
        limit(maxItems)
      )
    );

    prompts = snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<QuestionPrompt, "id">),
    }));
  } catch {
    prompts = [];
  }

  if (prompts.length === 0) {
    return fallbackQuestionPrompts;
  }

  return prompts;
}
