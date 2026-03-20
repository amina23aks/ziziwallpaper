import { listActiveQuestions } from "@/lib/firestore/questions";

export async function listQuestionPrompts(maxItems = 20) {
  try {
    const questions = await listActiveQuestions(maxItems);

    return questions.map((question, index) => ({
      id: question.id,
      questionAr: question.title,
      slug: question.slug,
      imageUrl: question.imageUrl,
      order: index,
      isActive: question.isActive,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    }));
  } catch {
    return [];
  }
}
