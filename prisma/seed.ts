import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Crear sucursal principal
  const branch = await prisma.branch.upsert({
    where: { id: "branch-main" },
    create: {
      id: "branch-main",
      name: "Sucursal Principal",
      address: "Av. Principal 123, Ciudad de México",
      latitude: 19.4326,
      longitude: -99.1332,
      radiusMeters: 200,
      scheduleStart: "08:00",
      scheduleEnd: "17:00",
      toleranceMinutes: 15,
    },
    update: {},
  });

  // Admin
  const adminPassword = await bcrypt.hash("Admin123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@championcoat.mx" },
    create: {
      email: "admin@championcoat.mx",
      password: adminPassword,
      role: "ADMIN",
      employee: {
        create: {
          firstName: "Admin",
          lastName: "ChampionCoat",
          position: "Administrador",
          branchId: branch.id,
          consent: true,
        },
      },
    },
    update: {},
  });

  // Gerente
  const gerentePassword = await bcrypt.hash("Gerente123!", 12);
  await prisma.user.upsert({
    where: { email: "gerente@championcoat.mx" },
    create: {
      email: "gerente@championcoat.mx",
      password: gerentePassword,
      role: "GERENTE",
      employee: {
        create: {
          firstName: "Juan",
          lastName: "García",
          position: "Gerente de Sucursal",
          branchId: branch.id,
          consent: true,
        },
      },
    },
    update: {},
  });

  // Empleado
  const empPassword = await bcrypt.hash("Empleado123!", 12);
  await prisma.user.upsert({
    where: { email: "empleado@championcoat.mx" },
    create: {
      email: "empleado@championcoat.mx",
      password: empPassword,
      role: "EMPLEADO",
      employee: {
        create: {
          firstName: "María",
          lastName: "López",
          position: "Vendedor",
          branchId: branch.id,
          consent: true,
          scheduleIn: "08:00",
          scheduleOut: "17:00",
        },
      },
    },
    update: {},
  });

  console.log("✅ Seed completado");
  console.log("📧 Admin: admin@championcoat.mx / Admin123!");
  console.log("📧 Gerente: gerente@championcoat.mx / Gerente123!");
  console.log("📧 Empleado: empleado@championcoat.mx / Empleado123!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
