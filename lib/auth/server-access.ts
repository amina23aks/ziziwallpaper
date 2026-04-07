import type { DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { UserRole } from "@/types/user-profile";
import { AUTH_TOKEN_COOKIE_NAME } from "@/lib/auth/constants";
import { getAdminAuth } from "@/lib/firebase/admin";

type AppRole = Exclude<UserRole, "guest">;
type RequiredRole = "admin" | "superadmin";

const ROLE_PRIORITY: Record<AppRole, number> = {
  user: 1,
  admin: 2,
  superadmin: 3,
};

function parseAppRole(value: unknown): AppRole | null {
  if (value === "user" || value === "admin" || value === "superadmin") {
    return value;
  }

  return null;
}

async function getUserRoleFromFirestore(uid: string): Promise<AppRole> {
  const snapshot = await getFirestore().collection("users").doc(uid).get();
  return parseAppRole(snapshot.data()?.role) ?? "user";
}

async function resolveRole(decodedToken: DecodedIdToken): Promise<AppRole> {
  const claimRole = parseAppRole(decodedToken.role);
  if (claimRole) {
    return claimRole;
  }

  return getUserRoleFromFirestore(decodedToken.uid);
}

function hasRequiredRole(role: AppRole, requiredRole: RequiredRole) {
  return ROLE_PRIORITY[role] >= ROLE_PRIORITY[requiredRole];
}

export async function requireAuthorizationHeaderRole(request: Request, requiredRole: RequiredRole) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    throw new Error("Unauthorized");
  }

  const decodedToken = await getAdminAuth().verifyIdToken(token);
  const role = await resolveRole(decodedToken);

  if (!hasRequiredRole(role, requiredRole)) {
    throw new Error("Forbidden");
  }

  return { uid: decodedToken.uid, role };
}

export async function requireCookieRole(cookiesStore: ReadonlyRequestCookies, requiredRole: RequiredRole) {
  const token = cookiesStore.get(AUTH_TOKEN_COOKIE_NAME)?.value?.trim();
  if (!token) {
    throw new Error("Unauthorized");
  }

  const decodedToken = await getAdminAuth().verifyIdToken(token);
  const role = await resolveRole(decodedToken);

  if (!hasRequiredRole(role, requiredRole)) {
    throw new Error("Forbidden");
  }

  return { uid: decodedToken.uid, role };
}
