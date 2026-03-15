"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_providers/auth-provider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isSignedIn, isAuthLoading, userProfile } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !isSignedIn) {
      router.replace("/login");
      return;
    }

    if (!isAuthLoading && isSignedIn && userProfile && userProfile.role !== "admin") {
      router.replace("/");
    }
  }, [isAuthLoading, isSignedIn, userProfile, router]);

  if (isAuthLoading || (isSignedIn && !userProfile)) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 text-sm text-zinc-500">
        جاري التحقق من الصلاحيات...
      </main>
    );
  }

  if (!isSignedIn || userProfile?.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
