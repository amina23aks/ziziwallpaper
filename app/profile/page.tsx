"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MobileBottomNav } from "@/app/_components/mobile-bottom-nav";
import { useAuth } from "@/app/_providers/auth-provider";
import { signOutUser } from "@/lib/auth/auth";

export default function ProfilePage() {
  const router = useRouter();
  const { userProfile, isSignedIn, isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !isSignedIn) {
      router.replace("/login");
    }
  }, [isAuthLoading, isSignedIn, router]);

  if (isAuthLoading || !isSignedIn) {
    return null;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center bg-zinc-50 px-4 py-6 pb-24 md:max-w-none md:px-6 md:py-16">
      <section className="w-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:mx-auto md:max-w-lg md:p-7">
        <h1 className="text-xl font-bold text-zinc-900">الحساب</h1>
        <p className="mt-2 text-sm text-zinc-600">هذه صفحة تمهيدية وسيتم تطوير ملفك الشخصي لاحقاً.</p>

        <div className="mt-4 space-y-1 text-sm text-zinc-700">
          <p>الاسم: {userProfile?.displayName || "-"}</p>
          <p>البريد: {userProfile?.email || "-"}</p>
          <p>الدور: {userProfile?.role || "user"}</p>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={async () => {
              await signOutUser();
              router.replace("/");
            }}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
          >
            تسجيل الخروج
          </button>
          <Link href="/" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
            الرئيسية
          </Link>
        </div>
      </section>
      <MobileBottomNav activeTab="account" />
    </main>
  );
}
