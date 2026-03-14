import type { FieldValue, Timestamp } from "firebase/firestore";

export type QuestionPrompt = {
  id?: string;
  questionAr: string;
  slug: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
  createdAt?: Timestamp | FieldValue | null;
  updatedAt?: Timestamp | FieldValue | null;
};
