import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
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

export async function listCategories(maxItems = 100) {
  const snapshot = await getDocs(
    query(categoriesCollection, orderBy("order", "asc"), limit(maxItems))
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<Category, "id">),
  }));
}

export async function listActiveCategories(maxItems = 30) {
  const snapshot = await getDocs(
    query(
      categoriesCollection,
      where("isActive", "==", true),
      orderBy("order", "asc"),
      limit(maxItems)
    )
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<Category, "id">),
  }));
}
