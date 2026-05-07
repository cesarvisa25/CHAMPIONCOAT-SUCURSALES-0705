"use client";

import { useEffect, useState } from "react";
import {
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  DollarSign,
  TrendingUp,
  Building2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  total: number;
  aTime: number;
  retardo: number;
  falta: number;
  salidaPendiente: number;
  fueraUbicacion: number;
  facialFallido: number;
  checkoutRealizado: number;
  ventas: number;
  ventasSinIVA: number;
  records: any[];
  salesByBranch: any[];
}

const statusColors: Record<string, string> = {
  A_TIEMPO: "bg-green-100 text-green-800",
  RETARDO: "bg-yellow-100 text-yellow-800",
  FALTA: "bg-red-100 text-red-800",
  SALIDA_PENDIENTE: "bg-blue-100 text-blue-800",
  CHECKOUT_REALIZADO: "bg-purple-100 text-purple-800",
  FUERA_UBICACION: "bg-orange-100 text-orange-800",
  FACIAL_FALLIDO: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  A_TIEMPO: "A tiempo",
  RETARDO: "Retardo",
  FALTA: "Falta",
  SALIDA_PENDIENTE: "Salida pendiente",
  CHECKOUT_REALIZADO: "Check-out realizado",
  FUERA_UBICACION: "Fuera de ubicación",
  FACIAL_FALLIDO: "Facial fallido",
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Total empleados", value: data?.total ?? 0, icon: Users, color: "bg-blue-500" },
    { label: "A tiempo", value: data?.aTime ?? 0, icon: CheckCircle, color: "bg-green-500" },
    { label: "Retardos", value: data?.retardo ?? 0, icon: Clock, color: "bg-yellow-500" },
    { label: "Faltas", value: data?.falta ?? 0, icon: XCircle, color: "bg-red-500" },
    { label: "Fuera de rango", value: data?.fueraUbicacion ?? 0, icon: AlertCircle, color: "bg-orange-500" },
    { label: "Ventas del día", value: `$${(data?.ventas ?? 0).toLocaleString("es-MX")}`, icon: DollarSign, color: "bg-emerald-500" },
  ];

  const chartData = data?.salesByBranch?.map((s: any) => ({
    name: s.branch?.name ?? "—",
    POS: s.salesPOS,
    "Sin IVA": s.salesNoIVA,
  })) ?? [];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm capitalize">{today}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2">
              <div className={`w-9 h-9 ${card.color} rounded-lg flex items-center justify-center`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Sales chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-red-600" />
            <h2 className="font-semibold text-gray-700">Ventas por sucursal hoy</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString("es-MX")}`} />
              <Bar dataKey="POS" fill="#dc2626" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Sin IVA" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Attendance table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 size={18} className="text-red-600" />
          <h2 className="font-semibold text-gray-700">Asistencia del día</h2>
        </div>

        {data?.records && data.records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Empleado</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Sucursal</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Entrada</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Salida</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.records.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {r.employee?.firstName} {r.employee?.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.branch?.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.checkInTime
                        ? new Date(r.checkInTime).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.checkOutTime
                        ? new Date(r.checkOutTime).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {statusLabels[r.status] ?? r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-400">
            <Clock size={40} className="mx-auto mb-2 opacity-30" />
            <p>Sin registros de asistencia hoy</p>
          </div>
        )}
      </div>
    </div>
  );
}
