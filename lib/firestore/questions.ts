import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Question } from "@/types/question";

type CreateQuestionInput = Omit<Question, "id" | "createdAt" | "updatedAt">;
type UpdateQuestionInput = Omit<Question, "id" | "createdAt" | "updatedAt">;

const questionsCollection = collection(db, "questions");

function mapQuestion(snapshot: QueryDocumentSnapshot<DocumentData> | { id: string; data: () => DocumentData }) {
  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Question, "id">),
  };
}

export async function createQuestion(data: CreateQuestionInput) {
  const docRef = await addDoc(questionsCollection, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateQuestion(id: string, data: UpdateQuestionInput) {
  await updateDoc(doc(db, "questions", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteQuestion(id: string) {
  await deleteDoc(doc(db, "questions", id));
}

export async function getQuestionById(id: string): Promise<Question | null> {
  const snapshot = await getDoc(doc(db, "questions", id));

  if (!snapshot.exists()) {
    return null;
  }

  return mapQuestion(snapshot);
}

export async function listQuestions(maxItems = 50) {
  let snapshot;

  try {
    snapshot = await getDocs(query(questionsCollection, orderBy("createdAt", "desc"), limit(maxItems)));
  } catch {
    snapshot = await getDocs(query(questionsCollection, limit(maxItems)));
  }

  return snapshot.docs.map((item) => mapQuestion(item));
}

export async function listActiveQuestions(maxItems = 20) {
  let snapshot;

  try {
    snapshot = await getDocs(
      query(
        questionsCollection,
        where("isActive", "==", true),
        orderBy("createdAt", "desc"),
        limit(maxItems)
      )
    );
  } catch {
    snapshot = await getDocs(
      query(questionsCollection, where("isActive", "==", true), limit(maxItems))
    );
  }

  return snapshot.docs.map((item) => mapQuestion(item));
}

export async function getQuestionBySlug(slug: string): Promise<Question | null> {
  const snapshot = await getDocs(query(questionsCollection, where("slug", "==", slug), limit(1)));
  const question = snapshot.docs[0];

  if (!question) {
    return null;
  }

  return mapQuestion(question);
}
