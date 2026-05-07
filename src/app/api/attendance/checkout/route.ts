import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logAction } from "@/lib/session";
import { haversineDistance, toDateString } from "@/lib/utils";

// POST /api/attendance/checkout
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(["EMPLEADO", "GERENTE", "ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const { latitude, longitude, faceVerified, deviceInfo: _deviceInfo } = body;

  if (latitude === undefined || longitude === undefined) {
    return NextResponse.json({ error: "Geolocalización requerida" }, { status: 400 });
  }

  const employeeId = (session!.user as any).employeeId;
  if (!employeeId) return NextResponse.json({ error: "Sin empleado asociado" }, { status: 400 });

  const today = toDateString(new Date());

  const record = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
    include: { branch: true },
  });

  if (!record || !record.checkInTime) {
    return NextResponse.json({ error: "No hay check-in registrado hoy" }, { status: 404 });
  }

  if (record.checkOutTime) {
    return NextResponse.json({ error: "Ya realizaste check-out hoy" }, { status: 409 });
  }

  const branch = record.branch;
  const distance = haversineDistance(latitude, longitude, branch.latitude, branch.longitude);
  const withinRadius = distance <= branch.radiusMeters;

  const now = new Date();
  const status = faceVerified && withinRadius ? "CHECKOUT_REALIZADO" : 
                 !faceVerified ? "FACIAL_FALLIDO" : "FUERA_UBICACION";

  const updated = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      checkOutTime: now,
      latOut: latitude,
      lonOut: longitude,
      faceVerOut: faceVerified === true,
      status: status as any,
    },
  });

  const userId = (session!.user as any).id;
  await logAction(userId, "CHECK_OUT", "AttendanceRecord", record.id, `Estado: ${status}`);

  return NextResponse.json({ ok: true, record: updated, status });
}
