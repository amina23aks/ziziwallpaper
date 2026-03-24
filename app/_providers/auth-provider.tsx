"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { ensureUserProfileDocument, getUserProfile } from "@/lib/firestore/users";
import type { UserProfile } from "@/types/user-profile";

type AuthContextValue = {
  user: User | null;
  userProfile: UserProfile | null;
  isSignedIn: boolean;
  isAuthLoading: boolean;
  refreshUserProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const refreshUserProfile = useCallback(async () => {
    const currentUser = getClientAuth().currentUser;

    if (!currentUser) {
      setUserProfile(null);
      return;
    }

    const profile = await getUserProfile(currentUser.uid);
    setUserProfile(profile);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getClientAuth(), async (nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        setUserProfile(null);
        setIsAuthLoading(false);
        return;
      }

      try {
        const existingProfile = await getUserProfile(nextUser.uid);

        if (existingProfile) {
          setUserProfile(existingProfile);
          return;
        }

        const profile = await ensureUserProfileDocument(nextUser);
        setUserProfile(profile);
      } finally {
        setIsAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      userProfile,
      isSignedIn: Boolean(user),
      isAuthLoading,
      refreshUserProfile,
    }),
    [user, userProfile, isAuthLoading, refreshUserProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
