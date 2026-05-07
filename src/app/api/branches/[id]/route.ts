import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logAction } from "@/lib/session";

// PUT /api/branches/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const { name, address, latitude, longitude, radiusMeters, scheduleStart, scheduleEnd, toleranceMinutes, active } = body;

  const branch = await prisma.branch.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
      ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
      ...(radiusMeters !== undefined && { radiusMeters: parseFloat(radiusMeters) }),
      ...(scheduleStart !== undefined && { scheduleStart }),
      ...(scheduleEnd !== undefined && { scheduleEnd }),
      ...(toleranceMinutes !== undefined && { toleranceMinutes: parseInt(toleranceMinutes) }),
      ...(active !== undefined && { active }),
    },
  });

  const userId = (session!.user as any).id;
  await logAction(userId, "UPDATE", "Branch", branch.id, `Sucursal: ${branch.name}`);

  return NextResponse.json(branch);
}

// DELETE /api/branches/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error) return error;

  await prisma.branch.update({ where: { id: params.id }, data: { active: false } });

  const userId = (session!.user as any).id;
  await logAction(userId, "DELETE", "Branch", params.id);

  return NextResponse.json({ ok: true });
}
