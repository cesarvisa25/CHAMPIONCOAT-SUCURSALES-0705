import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logAction } from "@/lib/session";
import bcrypt from "bcryptjs";

// GET /api/employees
export async function GET(_req: NextRequest) {
  const { error, session } = await requireAuth(["ADMIN", "GERENTE"]);
  if (error) return error;

  const role = (session!.user as any).role;
  const branchId = (session!.user as any).branchId;

  const where = role === "GERENTE" ? { branchId } : {};

  const employees = await prisma.employee.findMany({
    where,
    include: {
      user: { select: { email: true, role: true, active: true } },
      branch: { select: { id: true, name: true } },
      faceProfile: { select: { id: true, updatedAt: true } },
    },
    orderBy: { firstName: "asc" },
  });

  return NextResponse.json(employees);
}

// POST /api/employees
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(["ADMIN", "GERENTE"]);
  if (error) return error;

  const body = await req.json();
  const { email, password, firstName, lastName, phone, position, branchId, scheduleIn, scheduleOut, role, consent } = body;

  if (!email || !password || !firstName || !lastName || !branchId) {
    return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: role || "EMPLEADO",
      employee: {
        create: {
          firstName,
          lastName,
          phone,
          position,
          branchId,
          scheduleIn: scheduleIn || "08:00",
          scheduleOut: scheduleOut || "17:00",
          consent: consent || false,
        },
      },
    },
    include: { employee: true },
  });

  const userId = (session!.user as any).id;
  await logAction(userId, "CREATE", "Employee", user.employee?.id, `${firstName} ${lastName}`);

  return NextResponse.json(user, { status: 201 });
}
