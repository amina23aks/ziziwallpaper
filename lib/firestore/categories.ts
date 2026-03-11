import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
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

export async function listCategories() {
  const snapshot = await getDocs(query(categoriesCollection, orderBy("order", "asc")));

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<Category, "id">),
  }));
}
