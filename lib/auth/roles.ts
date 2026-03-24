import type { UserProfile, UserRole } from "@/types/user-profile";

export function getUserRole(profile?: UserProfile | null): UserRole {
  if (!profile) {
    return "guest";
  }

  if (profile.role === "superadmin") return "superadmin";
  if (profile.role === "admin") return "admin";
  return "user";
}

export function isAdminRole(profile?: UserProfile | null) {
  const role = getUserRole(profile);
  return role === "admin" || role === "superadmin";
}

export function isSuperAdminRole(profile?: UserProfile | null) {
  return getUserRole(profile) === "superadmin";
}

export function isUserRole(profile?: UserProfile | null) {
  const role = getUserRole(profile);
  return role === "user" || role === "admin" || role === "superadmin";
}
