"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  BarChart3,
  DollarSign,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "GERENTE"] },
  { href: "/employees", label: "Empleados", icon: Users, roles: ["ADMIN", "GERENTE"] },
  { href: "/branches", label: "Sucursales", icon: Building2, roles: ["ADMIN"] },
  { href: "/attendance", label: "Asistencia", icon: Clock, roles: ["ADMIN", "GERENTE"] },
  { href: "/sales", label: "Ventas", icon: DollarSign, roles: ["ADMIN", "GERENTE", "EMPLEADO"] },
  { href: "/reports", label: "Reportes", icon: BarChart3, roles: ["ADMIN", "GERENTE"] },
  { href: "/checkin", label: "Check-in", icon: Clock, roles: ["EMPLEADO"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const role = (session?.user as any)?.role;
  const name = session?.user?.name || session?.user?.email;

  const filtered = navItems.filter((item) => item.roles.includes(role));

  const NavContent = () => (
    <>
      <div className="px-4 py-6 border-b border-red-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-red-600 font-bold text-sm">CC</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-white font-semibold text-sm truncate">{name}</p>
            <p className="text-red-200 text-xs">{role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {filtered.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-white text-red-700"
                  : "text-red-100 hover:bg-red-700 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-100 hover:bg-red-700 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between bg-red-700 text-white px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
            <span className="text-red-600 font-bold text-xs">CC</span>
          </div>
          <span className="font-semibold text-sm">ChampionCoat</span>
        </div>
        <button onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="bg-red-700 w-64 flex flex-col">
            <NavContent />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-60 bg-red-700 min-h-screen flex-shrink-0">
        <div className="px-4 py-5 border-b border-red-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold text-xs">CC</span>
            </div>
            <span className="text-white font-bold">ChampionCoat</span>
          </div>
        </div>
        <NavContent />
      </div>
    </>
  );
}
