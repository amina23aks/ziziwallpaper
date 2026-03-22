import type { UserProfile, UserRole } from "@/types/user-profile";

export function getUserRole(profile?: UserProfile | null): UserRole {
  if (!profile) {
    return "guest";
  }

  return profile.role === "admin" ? "admin" : "user";
}

export function isAdminRole(profile?: UserProfile | null) {
  return getUserRole(profile) === "admin";
}

export function isUserRole(profile?: UserProfile | null) {
  const role = getUserRole(profile);
  return role === "user" || role === "admin";
}
