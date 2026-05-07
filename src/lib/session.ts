import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth(allowedRoles?: string[]) {
  const session = await getSession();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }), session: null };
  }
  const role = (session.user as any).role;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return { error: NextResponse.json({ error: "Sin permisos" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function logAction(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: string,
  ip?: string
) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, details, ip },
    });
  } catch {
    // Non-blocking
  }
}
