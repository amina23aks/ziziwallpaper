"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail, Shield, UserRound } from "lucide-react";
import { DeleteConfirmDialog } from "@/app/_components/delete-confirm-dialog";
import { MobileBottomNav } from "@/app/_components/mobile-bottom-nav";
import { AdminOnlyProfileEntry } from "@/app/profile/_components/admin-only-profile-entry";
import { useAuth } from "@/app/_providers/auth-provider";
import { signOutUser } from "@/lib/auth/auth";
import { updateUserDisplayName } from "@/lib/firestore/users";

export default function ProfilePage() {
  const router = useRouter();
  const { user, userProfile, isSignedIn, isAuthLoading } = useAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameStatus, setNameStatus] = useState("");

  useEffect(() => {
    if (!isAuthLoading && !isSignedIn) {
      router.replace("/login");
    }
  }, [isAuthLoading, isSignedIn, router]);

  useEffect(() => {
    setDisplayName(userProfile?.displayName || "");
  }, [userProfile?.displayName]);

  if (isAuthLoading || !isSignedIn) {
    return null;
  }

  return (
    <main className="min-h-screen w-full bg-zinc-50 px-4 py-6 pb-24 pt-16 md:pr-24 md:pt-10">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:max-w-lg md:max-w-xl md:p-8">
        <h1 className="text-xl font-bold text-zinc-900">الحساب</h1>
        <p className="mt-2 text-sm text-zinc-600">ملفك الشخصي في التطبيق.</p>

        <div className="mt-5 space-y-3">
          <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            <div className="flex items-center gap-2">
              <UserRound size={15} className="text-zinc-500" />
              <span>الاسم الظاهر</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                placeholder="الاسم"
              />
              <button
                type="button"
                disabled={isSavingName || !displayName.trim() || displayName.trim() === (userProfile?.displayName || "")}
                onClick={async () => {
                  if (!user || !displayName.trim()) return;
                  setIsSavingName(true);
                  setNameStatus("");
                  try {
                    await updateUserDisplayName(user.uid, displayName);
                    setNameStatus("تم تحديث الاسم.");
                    window.location.reload();
                  } finally {
                    setIsSavingName(false);
                  }
                }}
                className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                حفظ
              </button>
            </div>
            {nameStatus ? <p className="text-xs text-green-700">{nameStatus}</p> : null}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            <Mail size={15} className="text-zinc-500" />
            <span>{userProfile?.email || "-"}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            <Shield size={15} className="text-zinc-500" />
            <span>{userProfile?.role || "user"}</span>
          </div>
        </div>

        <div className="mt-4">
          <AdminOnlyProfileEntry isAdmin={userProfile?.role === "admin"} />
        </div>

        <div className="mt-6 flex justify-start">
          <button
            type="button"
            onClick={() => setIsLogoutDialogOpen(true)}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
          >
            تسجيل الخروج
          </button>
        </div>
      </section>
      <MobileBottomNav activeTab="account" />

      <DeleteConfirmDialog
        isOpen={isLogoutDialogOpen}
        title="تأكيد تسجيل الخروج"
        description="هل أنت متأكد من تسجيل الخروج؟"
        confirmText="تسجيل الخروج"
        onConfirm={async () => {
          await signOutUser();
          router.replace("/");
        }}
        onCancel={() => setIsLogoutDialogOpen(false)}
      />
    </main>
  );
}
