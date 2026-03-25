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
    <>
      <div className={`${subtitle ? "h-[4.5rem]" : "h-14"} md:hidden`} />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-200 bg-white text-zinc-900 md:hidden">
        <div className="flex min-h-14 items-center gap-3 px-4 py-2 [direction:ltr]">
          {leading ? (
            <div className="shrink-0 [direction:rtl]">{leading}</div>
          ) : backHref ? (
            <Link
              href={backHref}
              className="inline-flex shrink-0 items-center justify-center px-1 text-xl leading-none text-zinc-600 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40"
              aria-label="رجوع"
            >
              ←
            </Link>
          ) : (
            <div className="w-9 shrink-0" />
          )}

          <div className="min-w-0 flex-1 [direction:rtl] text-right">
            <h1 className="truncate text-base font-bold text-zinc-900">{title}</h1>
            {subtitle ? <p className="truncate text-xs text-zinc-600">{subtitle}</p> : null}
          </div>

          {trailing ? <div className="shrink-0 [direction:rtl]">{trailing}</div> : null}
        </div>
      </header>

      <header className="hidden space-y-2 text-right md:sticky md:top-0 md:z-30 md:-mx-6 md:block md:border-b md:border-zinc-200 md:bg-white/95 md:px-6 md:py-3 md:backdrop-blur lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between [direction:ltr]">
          {leading ? (
            <div className="[direction:rtl]">{leading}</div>
          ) : backHref ? (
            <Link
              href={backHref}
              className="inline-flex items-center justify-center px-1 text-xl leading-none text-zinc-600 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40"
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
          <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-zinc-600">{subtitle}</p> : null}
        </div>
      </header>
    </>
  );
}
