"use client";

import { MobileBottomNav } from "@/app/_components/mobile-bottom-nav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="admin-area min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">{children}</div>
      <MobileBottomNav activeTab="admin" />
    </>
  );
}
