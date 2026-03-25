"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminTopBar } from "@/app/admin/_components/admin-top-bar";
import { useAuth } from "@/app/_providers/auth-provider";
import { isSuperAdminRole } from "@/lib/auth/roles";
import { listUserProfiles, updateUserRoleBySuperAdmin } from "@/lib/firestore/users";
import type { UserProfile } from "@/types/user-profile";

const ROLE_OPTIONS: UserProfile["role"][] = ["user", "admin", "superadmin"];

export default function AdminUsersPage() {
  const { userProfile } = useAuth();
  const isSuperAdmin = isSuperAdminRole(userProfile);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingUid, setIsSavingUid] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      if (!isSuperAdmin) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await listUserProfiles(80);
        setUsers(data);
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, [isSuperAdmin]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;

    return users.filter((item) => {
      const name = item.displayName?.toLowerCase() ?? "";
      const email = item.email?.toLowerCase() ?? "";
      const uid = item.uid.toLowerCase();
      return name.includes(normalized) || email.includes(normalized) || uid.includes(normalized);
    });
  }, [users, query]);

  if (!isSuperAdmin) {
    return (
      <main className="mx-auto w-full max-w-[1200px] bg-[var(--app-bg)] px-4 pb-6 pt-0 sm:px-6 md:pr-28 lg:px-8 lg:pr-32">
        <AdminTopBar title="إدارة المستخدمين" subtitle="هذه الصفحة متاحة للسوبر أدمن فقط." backHref="/admin" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-4 bg-[var(--app-bg)] px-4 pb-6 pt-0 sm:px-6 md:pr-28 lg:px-8 lg:pr-32">
      <AdminTopBar title="إدارة المستخدمين" subtitle="ترقية أو خفض أدوار الحسابات" backHref="/admin" />

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ابحث بالاسم أو البريد أو UID"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 outline-none"
        />
        {notice ? <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{notice}</p> : null}
      </section>

      <section className="space-y-2">
        {isLoading ? <p className="text-sm text-zinc-600 dark:text-zinc-400">جاري تحميل المستخدمين...</p> : null}
        {!isLoading && filteredUsers.length === 0 ? <p className="text-sm text-zinc-600 dark:text-zinc-400">لا يوجد نتائج.</p> : null}

        {filteredUsers.map((item) => {
          const disabled = isSavingUid === item.uid || item.uid === userProfile?.uid;
          return (
            <article
              key={item.uid}
              className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.displayName || "بدون اسم"}</p>
                  <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">{item.email || item.uid}</p>
                </div>

                <select
                  value={item.role}
                  disabled={disabled}
                  onChange={async (event) => {
                    const nextRole = event.target.value as UserProfile["role"];
                    if (nextRole === item.role) return;
                    setIsSavingUid(item.uid);
                    setNotice(null);
                    try {
                      await updateUserRoleBySuperAdmin({ targetUid: item.uid, role: nextRole });
                      setUsers((prev) => prev.map((user) => (user.uid === item.uid ? { ...user, role: nextRole } : user)));
                      setNotice(`تم تحديث دور ${item.displayName || item.uid} إلى ${nextRole}.`);
                    } catch (error) {
                      const message = error instanceof Error ? error.message : "تعذر تحديث الدور.";
                      setNotice(message);
                    } finally {
                      setIsSavingUid(null);
                    }
                  }}
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              {item.uid === userProfile?.uid ? (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">لا يمكن تعديل دور حسابك الحالي من هذه الصفحة.</p>
              ) : null}
            </article>
          );
        })}
      </section>
    </main>
  );
}
