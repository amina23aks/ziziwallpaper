import { updateProfile, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db, getClientAuth } from "@/lib/firebase/client";
import type { UserProfile } from "@/types/user-profile";

function buildUserProfile(user: User): UserProfile {
  return {
    uid: user.uid,
    displayName: user.displayName ?? "",
    email: user.email ?? "",
    photoURL: user.photoURL ?? "",
    role: "user",
    profileCompleted: Boolean(user.displayName?.trim()),
  };
}

function normalizeExistingProfile(uid: string, data: Partial<UserProfile> | undefined): UserProfile {
  return {
    uid,
    displayName: data?.displayName ?? "",
    email: data?.email ?? "",
    photoURL: data?.photoURL ?? "",
    role: data?.role === "admin" ? "admin" : "user",
    profileCompleted: data?.profileCompleted ?? Boolean(data?.displayName?.trim()),
    createdAt: data?.createdAt,
    updatedAt: data?.updatedAt,
  };
}

function getProfilePatch(user: User, existingProfile: UserProfile) {
  const nextDisplayName = user.displayName ?? existingProfile.displayName ?? "";
  const nextPhotoURL = user.photoURL ?? existingProfile.photoURL ?? "";
  const nextEmail = user.email ?? existingProfile.email ?? "";
  const nextProfileCompleted = existingProfile.profileCompleted ?? Boolean(nextDisplayName.trim());

  const patch: Partial<UserProfile> = {};

  if (existingProfile.displayName !== nextDisplayName) patch.displayName = nextDisplayName;
  if (existingProfile.photoURL !== nextPhotoURL) patch.photoURL = nextPhotoURL;
  if (existingProfile.email !== nextEmail) patch.email = nextEmail;
  if (existingProfile.profileCompleted !== nextProfileCompleted) patch.profileCompleted = nextProfileCompleted;

  return patch;
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

  const existingProfile = normalizeExistingProfile(user.uid, snapshot.data() as Partial<UserProfile>);
  const patch = getProfilePatch(user, existingProfile);

  if (Object.keys(patch).length > 0) {
    await updateDoc(userRef, {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  }

  return {
    ...existingProfile,
    ...patch,
  } satisfies UserProfile;
}

export async function getOrCreateUserProfile(user: User) {
  return ensureUserProfileDocument(user);
}

export async function getUserProfile(uid: string) {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeExistingProfile(uid, snapshot.data() as Partial<UserProfile>);
}

export async function updateUserDisplayName(uid: string, displayName: string) {
  const nextDisplayName = displayName.trim();

  await updateDoc(doc(db, "users", uid), {
    displayName: nextDisplayName,
    profileCompleted: true,
    updatedAt: serverTimestamp(),
  });

  const currentUser = getClientAuth().currentUser;
  if (currentUser && currentUser.uid === uid) {
    await updateProfile(currentUser, { displayName: nextDisplayName });
  }
}
