"use client";

import Link from "next/link";
import { Home, Star, User } from "lucide-react";
import { useAuth } from "@/app/_providers/auth-provider";

export function MobileBottomNav({ activeTab }: { activeTab: "home" | "favorites" | "account" }) {
  const { isSignedIn } = useAuth();
  const accountHref = isSignedIn ? "/profile" : "/login";

  const buttonClassName =
    "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors";

  return (
    <>
      <nav className="fixed left-0 right-0 top-4 z-40 mx-auto hidden w-full max-w-6xl justify-end px-6 md:flex">
        <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white/95 p-1 shadow-sm backdrop-blur">
          <Link
            href="/"
            className={`${buttonClassName} ${activeTab === "home" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
            aria-label="الرئيسية"
          >
            <Home size={18} />
          </Link>
          <Link
            href="/favorites"
            className={`${buttonClassName} ${activeTab === "favorites" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
            aria-label="المفضلة"
          >
            <Star size={18} />
          </Link>
          <Link
            href={accountHref}
            className={`${buttonClassName} ${activeTab === "account" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
            aria-label="الحساب"
          >
            <User size={18} />
          </Link>
        </div>
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-md items-center justify-around border-t border-zinc-200 bg-white px-4 py-3 md:hidden sm:max-w-2xl lg:max-w-5xl">
        <Link
          href="/"
          className={`${buttonClassName} ${activeTab === "home" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
          aria-label="الرئيسية"
        >
          <Home size={18} />
        </Link>
        <Link
          href="/favorites"
          className={`${buttonClassName} ${activeTab === "favorites" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
          aria-label="المفضلة"
        >
          <Star size={18} />
        </Link>
        <Link
          href={accountHref}
          className={`${buttonClassName} ${activeTab === "account" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
          aria-label="الحساب"
        >
          <User size={18} />
        </Link>
      </nav>
    </>
  );
}
