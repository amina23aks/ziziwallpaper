"use client";

import Link from "next/link";

export function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 min-w-14 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white px-3 text-xs font-extrabold text-zinc-800 shadow-sm md:min-w-16 md:px-4"
      aria-label="الصفحة الرئيسية"
      title="ZIZI"
    >
      {/*
        Keep text mark for now.
        Future logo replacement: swap this text node with /public/icon.png image.
      */}
      ZIZI
    </Link>
  );
}
