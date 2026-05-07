import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logAction } from "@/lib/session";

// GET /api/branches
export async function GET(_req: NextRequest) {
  const { error } = await requireAuth(["ADMIN", "GERENTE"]);
  if (error) return error;

  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { employees: true } } },
  });

  return NextResponse.json(branches);
}

// POST /api/branches
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const { name, address, latitude, longitude, radiusMeters, scheduleStart, scheduleEnd, toleranceMinutes } = body;

  if (!name || latitude === undefined || longitude === undefined) {
    return NextResponse.json({ error: "Campos requeridos: nombre, latitud, longitud" }, { status: 400 });
  }

  const branch = await prisma.branch.create({
    data: {
      name,
      address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radiusMeters: radiusMeters ? parseFloat(radiusMeters) : 100,
      scheduleStart: scheduleStart || "08:00",
      scheduleEnd: scheduleEnd || "17:00",
      toleranceMinutes: toleranceMinutes ? parseInt(toleranceMinutes) : 15,
    },
  });

  const userId = (session!.user as any).id;
  await logAction(userId, "CREATE", "Branch", branch.id, `Sucursal: ${name}`);

  return NextResponse.json(branch, { status: 201 });
}
