import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logAction } from "@/lib/session";
import { haversineDistance, determineAttendanceStatus, toDateString } from "@/lib/utils";

// GET /api/attendance?date=YYYY-MM-DD&branchId=...&employeeId=...
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(["ADMIN", "GERENTE", "EMPLEADO"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const branchId = searchParams.get("branchId");
  const employeeId = searchParams.get("employeeId");

  const role = (session!.user as any).role;
  const userBranchId = (session!.user as any).branchId;
  const userEmployeeId = (session!.user as any).employeeId;

  const where: any = {};
  if (date) where.date = date;
  if (branchId) where.branchId = branchId;
  if (employeeId) where.employeeId = employeeId;

  // Restricciones por rol
  if (role === "GERENTE") where.branchId = userBranchId;
  if (role === "EMPLEADO") where.employeeId = userEmployeeId;

  const records = await prisma.attendanceRecord.findMany({
    where,
    include: {
      employee: { select: { firstName: true, lastName: true, scheduleIn: true, scheduleOut: true } },
      branch: { select: { name: true } },
    },
    orderBy: [{ date: "desc" }, { checkInTime: "desc" }],
  });

  return NextResponse.json(records);
}

// POST /api/attendance - check-in
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(["EMPLEADO", "GERENTE", "ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const { latitude, longitude, faceVerified, deviceInfo, photoRef } = body;

  if (latitude === undefined || longitude === undefined) {
    return NextResponse.json({ error: "Geolocalización requerida" }, { status: 400 });
  }

  const employeeId = (session!.user as any).employeeId;
  if (!employeeId) return NextResponse.json({ error: "Sin empleado asociado" }, { status: 400 });

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { branch: true },
  });
  if (!employee) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });

  const branch = employee.branch;
  const today = toDateString(new Date());

  // Verificar si ya hizo check-in hoy
  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });
  if (existing && existing.checkInTime) {
    return NextResponse.json({ error: "Ya realizaste check-in hoy" }, { status: 409 });
  }

  // Validar distancia
  const distance = haversineDistance(latitude, longitude, branch.latitude, branch.longitude);
  const withinRadius = distance <= branch.radiusMeters;

  const now = new Date();
  const status = determineAttendanceStatus(
    now,
    branch.scheduleStart,
    branch.toleranceMinutes,
    faceVerified === true,
    withinRadius
  );

  let record;
  if (existing) {
    record = await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: {
        checkInTime: now,
        latitude,
        longitude,
        faceVerified: faceVerified === true,
        photoRef,
        deviceInfo,
        status: status as any,
      },
    });
  } else {
    record = await prisma.attendanceRecord.create({
      data: {
        employeeId,
        branchId: branch.id,
        date: today,
        checkInTime: now,
        latitude,
        longitude,
        faceVerified: faceVerified === true,
        photoRef,
        deviceInfo,
        status: status as any,
      },
    });
  }

  const userId = (session!.user as any).id;
  await logAction(userId, "CHECK_IN", "AttendanceRecord", record.id, `Estado: ${status}, Distancia: ${Math.round(distance)}m`);

  return NextResponse.json({ ok: true, record, status, distance: Math.round(distance), withinRadius });
}
