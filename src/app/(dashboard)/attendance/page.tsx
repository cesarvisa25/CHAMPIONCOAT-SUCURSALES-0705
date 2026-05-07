"use client";

import { useEffect, useState } from "react";
import { Clock, Filter } from "lucide-react";

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

export default function AttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (branchId) params.set("branchId", branchId);
    const res = await fetch(`/api/attendance?${params}`);
    const d = await res.json();
    setRecords(Array.isArray(d) ? d : []);
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/branches").then((r) => r.json()).then((d) => setBranches(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => { load(); }, [date, branchId]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Asistencia</h1>
        <p className="text-gray-500 text-sm">Registros de asistencia por día y sucursal</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filtros</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fecha</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input text-sm py-2" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sucursal</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="input text-sm py-2">
              <option value="">Todas</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" /></div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Clock size={40} className="mx-auto mb-2 opacity-30" />
            <p>Sin registros para esta fecha</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Empleado</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Sucursal</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Entrada</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Salida</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Facial</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Ubicación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.employee?.firstName} {r.employee?.lastName}</td>
                    <td className="px-4 py-3 text-gray-600">{r.branch?.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {statusLabels[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${r.faceVerified ? "text-green-600" : "text-red-400"}`}>
                        {r.faceVerified ? "✓" : "✗"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {r.latitude ? `${r.latitude.toFixed(4)}, ${r.longitude?.toFixed(4)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
