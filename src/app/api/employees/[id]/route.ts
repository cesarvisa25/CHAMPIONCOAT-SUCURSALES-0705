import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logAction } from "@/lib/session";

// PUT /api/employees/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth(["ADMIN", "GERENTE"]);
  if (error) return error;

  const body = await req.json();
  const { firstName, lastName, phone, position, branchId, scheduleIn, scheduleOut, active, consent } = body;

  const employee = await prisma.employee.update({
    where: { id: params.id },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(phone !== undefined && { phone }),
      ...(position !== undefined && { position }),
      ...(branchId !== undefined && { branchId }),
      ...(scheduleIn !== undefined && { scheduleIn }),
      ...(scheduleOut !== undefined && { scheduleOut }),
      ...(active !== undefined && { active }),
      ...(consent !== undefined && { consent }),
    },
  });

  const userId = (session!.user as any).id;
  await logAction(userId, "UPDATE", "Employee", employee.id);

  return NextResponse.json(employee);
}

// DELETE (desactivar) /api/employees/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const employee = await prisma.employee.update({
    where: { id: params.id },
    data: { active: false },
  });

  await prisma.user.update({ where: { id: employee.userId }, data: { active: false } });

  const userId = (session!.user as any).id;
  await logAction(userId, "DEACTIVATE", "Employee", params.id);

  return NextResponse.json({ ok: true });
}
