"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FirebaseError } from "firebase/app";
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/auth/auth";
import { MobileBottomNav } from "@/app/_components/mobile-bottom-nav";
import { useAuth } from "@/app/_providers/auth-provider";
import { getUserProfile, updateUserDisplayName } from "@/lib/firestore/users";

type AuthMode = "login" | "signup";

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.2C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20H42V20H24v8h11.3c-1.1 3.1-3.2 5.4-6 6.9l.1-.1 6.3 5.2C35.2 40.4 44 34 44 24c0-1.3-.1-2.7-.4-4z" />
    </svg>
  );
}

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
        await signUpWithEmail({
          email,
          password,
          displayName: displayName.trim(),
        });
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
      const credential = await signInWithGoogle();
      const profile = await getUserProfile(credential.user.uid);
      const hasName = Boolean(profile?.displayName?.trim() || credential.user.displayName?.trim());
      const profileName = profile?.displayName || credential.user.displayName || "";

      if (!hasName) {
        router.replace("/complete-profile");
        return;
      }

      if (profile?.profileCompleted !== true) {
        await updateUserDisplayName(credential.user.uid, profileName);
      }

      router.replace("/");
    } catch (error) {
      const firebaseError = error as FirebaseError;
      setErrorMessage(getAuthErrorMessage(firebaseError.code));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-zinc-50 px-4 py-8 pb-24 pt-16 md:pr-24 md:pt-10">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:max-w-lg sm:p-6 md:max-w-xl md:p-8">
        <div className="mb-6 space-y-2 text-right">
          <p className="text-xs font-semibold text-zinc-500">ZIZI WALLPAPER</p>
          <h1 className="text-2xl font-extrabold text-zinc-900">
            {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
          </h1>
          <p className="text-sm text-zinc-600">سجّل الدخول للوصول إلى ميزات الحساب والمفضلة.</p>
        </div>

        <form className="space-y-3" onSubmit={handleEmailAuth}>
          {mode === "signup" && (
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="الاسم"
              required
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
            disabled={isSubmitting || (mode === "signup" && !displayName.trim())}
            className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isSubmitting}
          className="mt-3 grid w-full grid-cols-[1.25rem_minmax(0,1fr)_1.25rem] items-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center">
            <GoogleMark />
          </span>
          <span className="text-center">Continue with Google</span>
          <span aria-hidden="true" />
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
