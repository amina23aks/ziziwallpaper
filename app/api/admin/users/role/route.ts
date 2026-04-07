import { NextResponse } from "next/server";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuthErrorStatus, requireAuthorizationHeaderRole } from "@/lib/auth/server-access";
import type { UserProfile } from "@/types/user-profile";

type ManageableRole = Exclude<UserProfile["role"], "guest">;

const ALLOWED_ROLES = new Set<ManageableRole>(["user", "admin", "superadmin"]);

function toErrorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function requireSuperAdmin(request: Request) {
  const actor = await requireAuthorizationHeaderRole(request, "superadmin");
  return actor.uid;
}

export async function POST(request: Request) {
  try {
    const actorUid = await requireSuperAdmin(request);
    let payload: { targetUid?: string; role?: ManageableRole };
    try {
      payload = (await request.json()) as { targetUid?: string; role?: ManageableRole };
    } catch {
      return toErrorResponse("Invalid payload", 400);
    }

    const targetUid = payload?.targetUid?.trim();
    const nextRole = payload?.role;

    if (!targetUid || !nextRole || !ALLOWED_ROLES.has(nextRole)) {
      return toErrorResponse("Invalid payload", 400);
    }

    if (targetUid === actorUid) {
      return toErrorResponse("You cannot change your own role.", 400);
    }

    const firestore = getFirestore();
    const targetRef = firestore.collection("users").doc(targetUid);
    const targetSnapshot = await targetRef.get();

    if (!targetSnapshot.exists) {
      return toErrorResponse("User not found.", 404);
    }

    await targetRef.update({
      role: nextRole,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const authStatus = getAuthErrorStatus(error);
    const message = error instanceof Error ? error.message : "Failed to update role";
    const status = authStatus ?? 500;
    return toErrorResponse(message, status);
  }
}
