import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { toDateString } from "@/lib/utils";

// GET /api/dashboard
export async function GET(_req: NextRequest) {
  const { error, session } = await requireAuth(["ADMIN", "GERENTE"]);
  if (error) return error;

  const role = (session!.user as any).role;
  const branchId = (session!.user as any).branchId;

  const today = toDateString(new Date());
  const where: any = { date: today };
  if (role === "GERENTE") where.branchId = branchId;

  const [records, totalEmployees, sales] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true, scheduleIn: true } },
        branch: { select: { name: true } },
      },
    }),
    prisma.employee.count({ where: role === "GERENTE" ? { branchId, active: true } : { active: true } }),
    prisma.dailySales.findMany({
      where: role === "GERENTE" ? { branchId, date: today } : { date: today },
      include: { branch: { select: { name: true } } },
    }),
  ]);

  const summary = {
    total: totalEmployees,
    aTime: records.filter((r) => r.status === "A_TIEMPO").length,
    retardo: records.filter((r) => r.status === "RETARDO").length,
    falta: records.filter((r) => r.status === "FALTA").length,
    salidaPendiente: records.filter((r) => r.status === "SALIDA_PENDIENTE").length,
    fueraUbicacion: records.filter((r) => r.status === "FUERA_UBICACION").length,
    facialFallido: records.filter((r) => r.status === "FACIAL_FALLIDO").length,
    checkoutRealizado: records.filter((r) => r.status === "CHECKOUT_REALIZADO").length,
    ventas: sales.reduce((acc, s) => acc + s.salesPOS, 0),
    ventasSinIVA: sales.reduce((acc, s) => acc + s.salesNoIVA, 0),
    records,
    salesByBranch: sales,
  };

  return NextResponse.json(summary);
}
