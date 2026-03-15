"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Mail, Shield, UserRound } from "lucide-react";
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
    <main className="min-h-screen w-full bg-zinc-50 px-4 py-6 pb-24 md:pt-24">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:max-w-lg md:max-w-xl md:p-8">
        <h1 className="text-xl font-bold text-zinc-900">الحساب</h1>
        <p className="mt-2 text-sm text-zinc-600">ملفك الشخصي في التطبيق.</p>

        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            <UserRound size={15} className="text-zinc-500" />
            <span>{userProfile?.displayName?.trim() || "مستخدم"}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            <Mail size={15} className="text-zinc-500" />
            <span>{userProfile?.email || "-"}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            <Shield size={15} className="text-zinc-500" />
            <span>{userProfile?.role || "user"}</span>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
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
