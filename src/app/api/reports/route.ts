import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

// GET /api/reports?type=attendance|sales&from=YYYY-MM-DD&to=YYYY-MM-DD&branchId=...&employeeId=...
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(["ADMIN", "GERENTE"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "attendance";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const branchId = searchParams.get("branchId");
  const employeeId = searchParams.get("employeeId");

  const role = (session!.user as any).role;
  const userBranchId = (session!.user as any).branchId;

  if (type === "attendance") {
    const where: any = {};
    if (from && to) {
      where.date = { gte: from, lte: to };
    } else if (from) {
      where.date = { gte: from };
    }
    if (branchId) where.branchId = branchId;
    if (employeeId) where.employeeId = employeeId;
    if (role === "GERENTE") where.branchId = userBranchId;

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true } },
        branch: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }],
      take: 1000,
    });

    return NextResponse.json(records);
  }

  if (type === "sales") {
    const where: any = {};
    if (from && to) where.date = { gte: from, lte: to };
    if (branchId) where.branchId = branchId;
    if (role === "GERENTE") where.branchId = userBranchId;

    const sales = await prisma.dailySales.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        employee: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ date: "desc" }],
      take: 1000,
    });

    return NextResponse.json(sales);
  }

  return NextResponse.json({ error: "Tipo de reporte inválido" }, { status: 400 });
}
