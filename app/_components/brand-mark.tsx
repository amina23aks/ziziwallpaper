"use client";

import Image from "next/image";
import Link from "next/link";

export function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 min-w-14 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white px-2 shadow-sm md:min-w-16 md:px-2.5"
      aria-label="الصفحة الرئيسية"
      title="ZIZI"
    >
      <Image
        src="/icon.png"
        alt="ZIZI"
        width={72}
        height={24}
        className="h-6 w-auto object-contain"
        priority
      />
    </Link>
  );
}
