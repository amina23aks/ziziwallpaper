"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MobileBottomNav } from "@/app/_components/mobile-bottom-nav";
import { useAuth } from "@/app/_providers/auth-provider";
import { updateUserDisplayName } from "@/lib/firestore/users";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, userProfile, isSignedIn, isAuthLoading } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isSignedIn) {
      router.replace("/login");
      return;
    }

    if (!isAuthLoading && isSignedIn) {
      const hasName = Boolean(userProfile?.displayName?.trim() || user?.displayName?.trim());
      if (userProfile?.profileCompleted && hasName) {
        router.replace("/");
      }
    }
  }, [isAuthLoading, isSignedIn, router, user, userProfile]);

  if (isAuthLoading || !isSignedIn || !user) {
    return null;
  }

  return (
    <main className="min-h-screen w-full bg-zinc-50 px-4 py-8 pb-24 md:pt-24">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:max-w-lg md:max-w-xl md:p-8">
        <h1 className="text-2xl font-bold text-zinc-900">أدخل اسمك</h1>
        <p className="mt-2 text-sm text-zinc-600">هذه الخطوة مطلوبة مرة واحدة لإكمال ملفك الشخصي.</p>

        <form
          className="mt-4 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!displayName.trim()) return;
            setIsSaving(true);
            try {
              await updateUserDisplayName(user.uid, displayName);
              router.replace("/");
            } finally {
              setIsSaving(false);
            }
          }}
        >
          <input
            type="text"
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="اسمك"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            disabled={!displayName.trim() || isSaving}
            className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            حفظ
          </button>
        </form>
      </section>

      <MobileBottomNav activeTab="account" />
    </main>
  );
}
