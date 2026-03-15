"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FirebaseError } from "firebase/app";
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/auth/auth";
import { useAuth } from "@/app/_providers/auth-provider";
import { MobileBottomNav } from "@/app/_components/mobile-bottom-nav";

type AuthMode = "login" | "signup";

function getAuthErrorMessage(code?: string) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "بيانات الدخول غير صحيحة. تحقق من البريد وكلمة المرور.";
    case "auth/email-already-in-use":
      return "هذا البريد مستخدم بالفعل. جرّب تسجيل الدخول.";
    case "auth/weak-password":
      return "كلمة المرور ضعيفة. استخدم 6 أحرف أو أكثر.";
    case "auth/popup-closed-by-user":
      return "تم إغلاق نافذة تسجيل الدخول عبر Google قبل الإكمال.";
    default:
      return "حدث خطأ غير متوقع. حاول مرة أخرى.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { isSignedIn, isAuthLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && isSignedIn) {
      router.replace("/");
    }
  }, [isAuthLoading, isSignedIn, router]);

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail({ email, password, displayName });
      }

      router.replace("/");
    } catch (error) {
      const firebaseError = error as FirebaseError;
      setErrorMessage(getAuthErrorMessage(firebaseError.code));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
      router.replace("/");
    } catch (error) {
      const firebaseError = error as FirebaseError;
      setErrorMessage(getAuthErrorMessage(firebaseError.code));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center bg-zinc-50 px-4 py-8 pb-24 sm:max-w-lg">
      <section className="w-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 space-y-2 text-right">
          <p className="text-xs font-semibold text-zinc-500">ZIZI WALLPAPER</p>
          <h1 className="text-2xl font-extrabold text-zinc-900">
            {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
          </h1>
          <p className="text-sm text-zinc-600">سجّل الدخول للوصول إلى ميزات الحساب والمفضلة قريباً.</p>
        </div>

        <form className="space-y-3" onSubmit={handleEmailAuth}>
          {mode === "signup" && (
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="الاسم (اختياري)"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-500"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="البريد الإلكتروني"
            required
            className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-500"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="كلمة المرور"
            minLength={6}
            required
            className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-500"
          />

          {errorMessage && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isSubmitting}
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-zinc-900 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          المتابعة باستخدام Google
        </button>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/" className="font-medium text-zinc-500 hover:text-zinc-800">
            العودة للرئيسية
          </Link>
          <button
            type="button"
            onClick={() => {
              setErrorMessage("");
              setMode(mode === "login" ? "signup" : "login");
            }}
            className="font-semibold text-zinc-800 hover:underline"
          >
            {mode === "login" ? "ليس لديك حساب؟ أنشئ حساباً" : "لديك حساب بالفعل؟ سجّل الدخول"}
          </button>
        </div>
      </section>
      <MobileBottomNav activeTab="account" />
    </main>
  );
}
