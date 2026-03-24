import { NextResponse } from "next/server";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAdminAuth } from "@/lib/firebase/admin";
import type { UserProfile } from "@/types/user-profile";

type ManageableRole = Exclude<UserProfile["role"], "guest">;

const ALLOWED_ROLES = new Set<ManageableRole>(["user", "admin", "superadmin"]);

function toErrorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function requireSuperAdmin(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authorization.slice("Bearer ".length).trim();
  const decodedToken = await getAdminAuth().verifyIdToken(token);
  const firestore = getFirestore();
  const actorRef = firestore.collection("users").doc(decodedToken.uid);
  const actorSnapshot = await actorRef.get();
  const role = actorSnapshot.data()?.role;

  if (role !== "superadmin") {
    throw new Error("Forbidden");
  }

  return decodedToken.uid;
}

export async function POST(request: Request) {
  try {
    const actorUid = await requireSuperAdmin(request);
    const payload = (await request.json()) as { targetUid?: string; role?: ManageableRole };

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
    const message = error instanceof Error ? error.message : "Failed to update role";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return toErrorResponse(message, status);
  }
}
