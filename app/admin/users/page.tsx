import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminUsersClientPage from "@/app/admin/users/users-page-client";
import { requireCookieRole } from "@/lib/auth/server-access";

export default async function AdminUsersPage() {
  try {
    await requireCookieRole(await cookies(), "superadmin");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    if (message === "Forbidden") {
      redirect("/admin");
    }

    redirect("/login");
  }

  return <AdminUsersClientPage />;
}
