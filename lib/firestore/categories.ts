import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Category } from "@/types/category";

type CreateCategoryInput = Omit<Category, "id">;

const categoriesCollection = collection(db, "categories");

export async function createCategory(data: CreateCategoryInput) {
  const docRef = await addDoc(categoriesCollection, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateCategory(id: string, data: Partial<CreateCategoryInput>) {
  await updateDoc(doc(db, "categories", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(id: string) {
  await deleteDoc(doc(db, "categories", id));
}

export async function listCategories(maxItems = 100) {
  let snapshot;

  try {
    snapshot = await getDocs(
      query(categoriesCollection, orderBy("order", "asc"), limit(maxItems))
    );
  } catch {
    snapshot = await getDocs(query(categoriesCollection, limit(maxItems)));
  }

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<Category, "id">),
  }));
}

export async function listActiveCategories(maxItems = 30) {
  let snapshot;

  try {
    snapshot = await getDocs(
      query(
        categoriesCollection,
        where("isActive", "==", true),
        orderBy("order", "asc"),
        limit(maxItems)
      )
    );
  } catch {
    snapshot = await getDocs(
      query(categoriesCollection, where("isActive", "==", true), limit(maxItems))
    );
  }

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<Category, "id">),
  }));
}
