"use client";

import Link from "next/link";
import { Home, LayoutDashboard, Star, User } from "lucide-react";
import { useAuth } from "@/app/_providers/auth-provider";

export function MobileBottomNav({
  activeTab,
}: {
  activeTab: "home" | "favorites" | "account" | "admin";
}) {
  const { isSignedIn, userProfile } = useAuth();
  const accountHref = isSignedIn ? "/profile" : "/login";
  const isAdmin = userProfile?.role === "admin";

  const itemClass = "inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors";

  return (
    <>
      <aside className="fixed right-4 top-24 z-40 hidden w-14 rounded-2xl border border-zinc-200 bg-white/95 py-3 shadow-sm backdrop-blur md:flex md:flex-col md:items-center md:gap-2 lg:top-28">
        <Link
          href="/"
          className={`${itemClass} ${activeTab === "home" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
          aria-label="الرئيسية"
        >
          <Home size={18} />
        </Link>
        <Link
          href="/favorites"
          className={`${itemClass} ${activeTab === "favorites" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
          aria-label="المفضلة"
        >
          <Star size={18} />
        </Link>
        <Link
          href={accountHref}
          className={`${itemClass} ${activeTab === "account" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
          aria-label="الحساب"
        >
          <User size={18} />
        </Link>
        {isAdmin ? (
          <Link
            href="/admin"
            className={`${itemClass} ${activeTab === "admin" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
            aria-label="لوحة الإدارة"
          >
            <LayoutDashboard size={18} />
          </Link>
        ) : null}
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex w-full items-center justify-around border-t border-zinc-200 bg-white/98 px-4 py-3 shadow-[0_-1px_8px_rgba(0,0,0,0.04)] backdrop-blur md:hidden">
        <Link
          href="/"
          className={`${itemClass} ${activeTab === "home" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
          aria-label="الرئيسية"
        >
          <Home size={18} />
        </Link>
        <Link
          href="/favorites"
          className={`${itemClass} ${activeTab === "favorites" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
          aria-label="المفضلة"
        >
          <Star size={18} />
        </Link>
        <Link
          href={accountHref}
          className={`${itemClass} ${activeTab === "account" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
          aria-label="الحساب"
        >
          <User size={18} />
        </Link>
        {isAdmin ? (
          <Link
            href="/admin"
            className={`${itemClass} ${activeTab === "admin" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
            aria-label="لوحة الإدارة"
          >
            <LayoutDashboard size={18} />
          </Link>
        ) : null}
      </nav>
    </>
  );
}
