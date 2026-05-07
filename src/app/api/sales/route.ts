import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logAction } from "@/lib/session";
import { toDateString } from "@/lib/utils";

// GET /api/sales?date=YYYY-MM-DD&branchId=...
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(["ADMIN", "GERENTE", "EMPLEADO"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const branchId = searchParams.get("branchId");

  const role = (session!.user as any).role;
  const userBranchId = (session!.user as any).branchId;

  const where: any = {};
  if (date) where.date = date;
  if (branchId) where.branchId = branchId;
  if (role === "GERENTE") where.branchId = userBranchId;
  if (role === "EMPLEADO") {
    const employeeId = (session!.user as any).employeeId;
    where.employeeId = employeeId;
  }

  const sales = await prisma.dailySales.findMany({
    where,
    include: {
      branch: { select: { name: true } },
      employee: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ date: "desc" }],
  });

  return NextResponse.json(sales);
}

// POST /api/sales
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(["EMPLEADO", "GERENTE", "ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const { branchId, date, salesPOS, salesNoIVA, comments } = body;

  const employeeId = (session!.user as any).employeeId;
  const today = date || toDateString(new Date());

  if (!branchId || salesPOS === undefined || salesNoIVA === undefined) {
    return NextResponse.json({ error: "Campos requeridos: sucursal, ventas" }, { status: 400 });
  }

  const sale = await prisma.dailySales.upsert({
    where: { branchId_date: { branchId, date: today } },
    create: {
      branchId,
      employeeId: employeeId!,
      date: today,
      salesPOS: parseFloat(salesPOS),
      salesNoIVA: parseFloat(salesNoIVA),
      comments,
    },
    update: {
      salesPOS: parseFloat(salesPOS),
      salesNoIVA: parseFloat(salesNoIVA),
      comments,
      employeeId: employeeId!,
    },
  });

  const userId = (session!.user as any).id;
  await logAction(userId, "UPSERT", "DailySales", sale.id, `Fecha: ${today}, Sucursal: ${branchId}`);

  return NextResponse.json(sale);
}
