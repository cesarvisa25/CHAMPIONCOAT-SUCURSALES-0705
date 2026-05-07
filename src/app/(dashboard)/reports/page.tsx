"use client";

import { useState } from "react";
import { BarChart3, Download, Filter } from "lucide-react";

const statusLabels: Record<string, string> = {
  A_TIEMPO: "A tiempo",
  RETARDO: "Retardo",
  FALTA: "Falta",
  SALIDA_PENDIENTE: "Salida pendiente",
  CHECKOUT_REALIZADO: "Check-out realizado",
  FUERA_UBICACION: "Fuera de ubicación",
  FACIAL_FALLIDO: "Facial fallido",
};

export default function ReportsPage() {
  const [type, setType] = useState<"attendance" | "sales">("attendance");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    setLoading(true);
    const params = new URLSearchParams({ type, from, to });
    const res = await fetch(`/api/reports?${params}`);
    const d = await res.json();
    setData(Array.isArray(d) ? d : []);
    setLoading(false);
  }

  function exportCSV() {
    if (data.length === 0) return;

    let csv = "";
    if (type === "attendance") {
      csv = "Empleado,Sucursal,Fecha,Entrada,Salida,Estado\n";
      csv += data
        .map((r) =>
          [
            `"${r.employee?.firstName} ${r.employee?.lastName}"`,
            `"${r.branch?.name}"`,
            r.date,
            r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("es-MX") : "",
            r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString("es-MX") : "",
            statusLabels[r.status] || r.status,
          ].join(",")
        )
        .join("\n");
    } else {
      csv = "Fecha,Sucursal,Venta POS,Venta Sin IVA,Comentarios\n";
      csv += data
        .map((s) =>
          [
            s.date,
            `"${s.branch?.name}"`,
            s.salesPOS,
            s.salesNoIVA,
            `"${s.comments || ""}"`,
          ].join(",")
        )
        .join("\n");
    }

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${type}-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
        <p className="text-gray-500 text-sm">Genera y exporta reportes de asistencia y ventas</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Configurar reporte</span>
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipo de reporte</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="input text-sm py-2">
              <option value="attendance">Asistencia</option>
              <option value="sales">Ventas</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input text-sm py-2" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input text-sm py-2" />
          </div>
          <button
            onClick={loadReport}
            disabled={loading}
            className="btn-primary py-2 px-5"
          >
            {loading ? "Generando..." : "Generar"}
          </button>
          {data.length > 0 && (
            <button onClick={exportCSV} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              <Download size={16} />
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {data.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-red-600" />
              <span className="font-semibold text-gray-700">
                {data.length} registros
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {type === "attendance" ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Empleado</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Sucursal</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Entrada</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Salida</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800">{r.employee?.firstName} {r.employee?.lastName}</td>
                      <td className="px-4 py-3 text-gray-600">{r.branch?.name}</td>
                      <td className="px-4 py-3 text-gray-600">{r.date}</td>
                      <td className="px-4 py-3 text-gray-600">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{statusLabels[r.status] || r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Sucursal</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Venta POS</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Sin IVA</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Comentarios</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{s.date}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.branch?.name}</td>
                      <td className="px-4 py-3 text-right text-gray-800">${s.salesPOS.toLocaleString("es-MX")}</td>
                      <td className="px-4 py-3 text-right text-gray-600">${s.salesNoIVA.toLocaleString("es-MX")}</td>
                      <td className="px-4 py-3 text-gray-500">{s.comments || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          <BarChart3 size={40} className="mx-auto mb-2 opacity-30" />
          <p>{'Configura los filtros y presiona "Generar" para ver el reporte'}</p>
        </div>
      )}
    </div>
  );
}
