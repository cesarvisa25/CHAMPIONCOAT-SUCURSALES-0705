import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logAction } from "@/lib/session";

// POST /api/employees/[id]/face - guardar/actualizar plantilla facial
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth(["ADMIN", "GERENTE", "EMPLEADO"]);
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { descriptors } = body;

  if (!descriptors) {
    return NextResponse.json({ error: "Descriptores faciales requeridos" }, { status: 400 });
  }

  // Verificar consentimiento
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
  if (!employee.consent) {
    return NextResponse.json({ error: "Se requiere consentimiento del empleado" }, { status: 403 });
  }

  const faceProfile = await prisma.faceProfile.upsert({
    where: { employeeId: id },
    create: { employeeId: id, descriptors: JSON.stringify(descriptors) },
    update: { descriptors: JSON.stringify(descriptors) },
  });

  const userId = (session!.user as any).id;
  await logAction(userId, "FACE_REGISTER", "FaceProfile", faceProfile.id, `Empleado: ${id}`);

  return NextResponse.json({ ok: true, id: faceProfile.id });
}
