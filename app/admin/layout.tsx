"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileBottomNav } from "@/app/_components/mobile-bottom-nav";
import { useAuth } from "@/app/_providers/auth-provider";
import { isAdminRole } from "@/lib/auth/roles";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isSignedIn, isAuthLoading, userProfile } = useAuth();
  const isAdmin = isAdminRole(userProfile);

  useEffect(() => {
    if (!isAuthLoading && !isSignedIn) {
      router.replace("/login");
      return;
    }

    if (!isAuthLoading && isSignedIn && userProfile && !isAdmin) {
      router.replace("/");
    }
  }, [isAdmin, isAuthLoading, isSignedIn, userProfile, router]);

  if (isAuthLoading || (isSignedIn && !userProfile)) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 text-sm text-zinc-500">
        جاري التحقق من الصلاحيات...
      </main>
    );
  }

  if (!isSignedIn || !isAdmin) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">{children}</div>
      <MobileBottomNav activeTab="admin" />
    </>
  );
}
