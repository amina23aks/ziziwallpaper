"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function AdminTopBar({
  title,
  subtitle,
  backHref,
  leading,
  trailing,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 -mx-4 space-y-2 border-b border-zinc-800/70 bg-zinc-950/95 px-4 py-3 text-right backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center justify-between [direction:ltr]">
        {leading ? (
          <div className="[direction:rtl]">{leading}</div>
        ) : backHref ? (
          <Link
            href={backHref}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100"
            aria-label="رجوع"
          >
            ←
          </Link>
        ) : (
          <div className="w-9" />
        )}
        {trailing ? <div className="[direction:rtl]">{trailing}</div> : <div className="w-9" />}
      </div>
      <div>
        <h1 className="text-xl font-bold text-zinc-100 sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-zinc-300">{subtitle}</p> : null}
      </div>
    </header>
  );
}
