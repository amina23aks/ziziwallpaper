"use client";

import Link from "next/link";
import { Home, Star, User } from "lucide-react";
import { useAuth } from "@/app/_providers/auth-provider";

export function MobileBottomNav({ activeTab }: { activeTab: "home" | "favorites" | "account" }) {
  const { isSignedIn } = useAuth();
  const accountHref = isSignedIn ? "/profile" : "/login";

  const baseClassName = "inline-flex h-10 w-10 items-center justify-center rounded-full";

  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-md items-center justify-around border-t border-zinc-200 bg-white px-4 py-3 sm:max-w-2xl lg:max-w-5xl">
      <Link
        href="/"
        className={`${baseClassName} ${activeTab === "home" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
        aria-label="الرئيسية"
      >
        <Home size={18} />
      </Link>
      <Link
        href="/favorites"
        className={`${baseClassName} ${activeTab === "favorites" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
        aria-label="المفضلة"
      >
        <Star size={18} />
      </Link>
      <Link
        href={accountHref}
        className={`${baseClassName} ${activeTab === "account" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
        aria-label="الحساب"
      >
        <User size={18} />
      </Link>
    </nav>
  );
}
