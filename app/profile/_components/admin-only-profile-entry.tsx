import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export function AdminOnlyProfileEntry({ isAdmin }: { isAdmin: boolean }) {
  if (!isAdmin) return null;

  return (
    <Link
      href="/admin"
      className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
    >
      <LayoutDashboard size={15} className="text-zinc-600" />
      <span>لوحة الإدارة</span>
    </Link>
  );
}
