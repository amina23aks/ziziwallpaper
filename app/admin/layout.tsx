"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_providers/auth-provider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isSignedIn, isAuthLoading, userProfile } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !isSignedIn) {
      router.replace("/login");
    }
  }, [isAuthLoading, isSignedIn, router]);

  if (isAuthLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 text-sm text-zinc-500">
        جاري التحقق من الصلاحيات...
      </main>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  if (userProfile?.role !== "admin") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4">
        <section className="w-full rounded-2xl border border-zinc-200 bg-white p-6 text-right shadow-sm">
          <h1 className="text-xl font-bold text-zinc-900">غير مصرح لك بالدخول</h1>
          <p className="mt-2 text-sm text-zinc-600">
            هذه المنطقة متاحة فقط لحسابات الإدارة.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
            >
              العودة للرئيسية
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
