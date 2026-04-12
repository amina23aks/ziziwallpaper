import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type UserCredential,
} from "firebase/auth";
import { AUTH_TOKEN_COOKIE_NAME } from "@/lib/auth/constants";
import { getClientAuth } from "@/lib/firebase/client";
import { ensureUserProfileDocument } from "@/lib/firestore/users";

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
  await result.user.reload();
  const refreshedUser = getClientAuth().currentUser ?? result.user;
  await ensureUserProfileDocument(refreshedUser);
  return result;
}

export async function signOutUser() {
  try {
    await signOut(getClientAuth());
  } finally {
    document.cookie = `${AUTH_TOKEN_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}
