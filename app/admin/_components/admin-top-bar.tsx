"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function AdminTopBar({
  title,
  subtitle,
  backHref,
  trailing,
}: {
  title: string;
  subtitle?: string;
  backHref: string;
  trailing?: ReactNode;
}) {
  return (
    <header className="space-y-2">
      <div className="flex items-center justify-between">
        <Link
          href={backHref}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100"
          aria-label="رجوع"
        >
          ←
        </Link>
        {trailing ? <div>{trailing}</div> : <div className="w-9" />}
      </div>
      <div>
        <h1 className="text-xl font-bold text-zinc-100 sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-zinc-300">{subtitle}</p> : null}
      </div>
    </header>
  );
}
