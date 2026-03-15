import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type UserCredential,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { ensureUserProfileDocument } from "@/lib/firestore/users";

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(getClientAuth(), googleProvider);
  await ensureUserProfileDocument(result.user);
  return result;
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(getClientAuth(), email, password);
  await ensureUserProfileDocument(result.user);
  return result;
}

export async function signUpWithEmail({
  email,
  password,
  displayName,
}: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<UserCredential> {
  const result = await createUserWithEmailAndPassword(getClientAuth(), email, password);

  if (displayName?.trim()) {
    await updateProfile(result.user, { displayName: displayName.trim() });
  }

  await ensureUserProfileDocument(result.user);

  return result;
}

export async function signOutUser() {
  await signOut(getClientAuth());
}
