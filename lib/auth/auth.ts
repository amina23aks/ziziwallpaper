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

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  return signInWithPopup(getClientAuth(), googleProvider);
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(getClientAuth(), email, password);
}

export async function signUpWithEmail({
  email,
  password,
  displayName,
}: {
  email: string;
  password: string;
  displayName: string;
}): Promise<UserCredential> {
  const result = await createUserWithEmailAndPassword(getClientAuth(), email, password);

  await updateProfile(result.user, { displayName: displayName.trim() });
  return result;
}

export async function signOutUser() {
  await signOut(getClientAuth());
}
