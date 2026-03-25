"use client";

import Image from "next/image";
import Link from "next/link";

export function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center justify-center"
      aria-label="الصفحة الرئيسية"
      title="ZIZI"
    >
      <Image
        src="/icon.png"
        alt="ZIZI"
        width={72}
        height={24}
        className="h-8 w-auto object-contain"
        priority
      />
    </Link>
  );
}
