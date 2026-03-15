import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { UserProfile } from "@/types/user-profile";

function buildUserProfile(user: User): UserProfile {
  return {
    uid: user.uid,
    displayName: user.displayName ?? "",
    email: user.email ?? "",
    photoURL: user.photoURL ?? "",
    role: "user",
  };
}

export async function ensureUserProfileDocument(user: User) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const newProfile = buildUserProfile(user);

    await setDoc(userRef, {
      ...newProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newProfile;
  }

  const existingProfile = snapshot.data() as Omit<UserProfile, "uid">;

  await updateDoc(userRef, {
    displayName: user.displayName ?? existingProfile.displayName ?? "",
    photoURL: user.photoURL ?? existingProfile.photoURL ?? "",
    email: user.email ?? existingProfile.email ?? "",
    updatedAt: serverTimestamp(),
  });

  return {
    uid: user.uid,
    ...existingProfile,
    displayName: user.displayName ?? existingProfile.displayName ?? "",
    photoURL: user.photoURL ?? existingProfile.photoURL ?? "",
    email: user.email ?? existingProfile.email ?? "",
  } satisfies UserProfile;
}

export async function getUserProfile(uid: string) {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    uid: snapshot.id,
    ...(snapshot.data() as Omit<UserProfile, "uid">),
  } satisfies UserProfile;
}


export async function updateUserDisplayName(uid: string, displayName: string) {
  await updateDoc(doc(db, "users", uid), {
    displayName: displayName.trim(),
    updatedAt: serverTimestamp(),
  });
}
