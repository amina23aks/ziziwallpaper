"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail, Shield } from "lucide-react";
import { DeleteConfirmDialog } from "@/app/_components/delete-confirm-dialog";
import { MobileBottomNav } from "@/app/_components/mobile-bottom-nav";
import { ProfileNameEditor } from "@/app/_components/profile-name-editor";
import { ThemeToggle } from "@/app/_components/theme-toggle";
import { AdminOnlyProfileEntry } from "@/app/profile/_components/admin-only-profile-entry";
import { useAuth } from "@/app/_providers/auth-provider";
import { isAdminRole } from "@/lib/auth/roles";
import { signOutUser } from "@/lib/auth/auth";
import { updateUserDisplayName } from "@/lib/firestore/users";

export default function ProfilePage() {
  const router = useRouter();
  const { user, userProfile, isSignedIn, isAuthLoading, refreshUserProfile } = useAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

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
        <div className="mt-4 [direction:ltr]">
          <ThemeToggle />
        </div>

        <div className="mt-5 space-y-3">
          <ProfileNameEditor
            value={displayName}
            isSaving={isSavingName}
            label="اسم الملف الشخصي"
            onSave={async (nextValue) => {
              if (!user || !nextValue.trim()) return;
              setIsSavingName(true);
              try {
                await updateUserDisplayName(user.uid, nextValue);
                setDisplayName(nextValue);
                await refreshUserProfile();
              } finally {
                setIsSavingName(false);
              }
            }}
          />
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
          <AdminOnlyProfileEntry isAdmin={isAdminRole(userProfile)} />
        </div>

        <div className="mt-6 flex justify-start">
          <button
            type="button"
            onClick={() => setIsLogoutDialogOpen(true)}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-zinc-300 dark:bg-transparent dark:text-zinc-700 dark:hover:bg-transparent"
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
        confirmVariant="destructive"
        onConfirm={async () => {
          await signOutUser();
          router.replace("/");
        }}
        onCancel={() => setIsLogoutDialogOpen(false)}
      />
    </main>
  );
}
