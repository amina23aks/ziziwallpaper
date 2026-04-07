import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/_components/admin-shell";
import { requireCookieRole } from "@/lib/auth/server-access";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireCookieRole(await cookies(), "admin");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    if (message === "Forbidden") {
      redirect("/");
    }

    redirect("/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
