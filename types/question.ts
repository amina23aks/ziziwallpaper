import type { FieldValue, Timestamp } from "firebase/firestore";

export type Question = {
  id?: string;
  title: string;
  questionAr?: string;
  imageUrl: string;
  slug: string;
  createdAt?: Timestamp | FieldValue | null;
  updatedAt?: Timestamp | FieldValue | null;
};
