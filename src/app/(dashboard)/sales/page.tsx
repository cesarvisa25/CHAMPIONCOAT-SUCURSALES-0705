"use client";

import { useEffect, useState } from "react";
import { DollarSign, Plus } from "lucide-react";
import { useSession } from "next-auth/react";

export default function SalesPage() {
  const { data: session } = useSession();
  const [sales, setSales] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ branchId: "", date: new Date().toISOString().slice(0, 10), salesPOS: "", salesNoIVA: "", comments: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const userBranchId = (session?.user as any)?.branchId;

  async function load() {
    setLoading(true);
    const res = await fetch("/api/sales");
    const d = await res.json();
    setSales(Array.isArray(d) ? d : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    fetch("/api/branches").then((r) => r.json()).then((d) => {
      const list = Array.isArray(d) ? d : [];
      setBranches(list);
      if (list.length > 0) setForm((f) => ({ ...f, branchId: userBranchId || list[0].id }));
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, salesPOS: parseFloat(form.salesPOS), salesNoIVA: parseFloat(form.salesNoIVA) }),
    });

    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      load();
    } else {
      const d = await res.json();
      setError(d.error || "Error al guardar");
    }
  }

  const totalPOS = sales.reduce((a, s) => a + s.salesPOS, 0);
  const totalNoIVA = sales.reduce((a, s) => a + s.salesNoIVA, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ventas Diarias</h1>
          <p className="text-gray-500 text-sm">Captura y seguimiento de ventas por sucursal</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          <Plus size={16} />
          Registrar ventas
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">Total ventas POS</p>
          <p className="text-2xl font-bold text-gray-800">${totalPOS.toLocaleString("es-MX")}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">Total sin IVA</p>
          <p className="text-2xl font-bold text-gray-800">${totalNoIVA.toLocaleString("es-MX")}</p>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-5">Registrar ventas del día</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal *</label>
                  <select required value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="input">
                    <option value="">Seleccionar...</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venta en punto de venta (POS) *</label>
                  <input required type="number" step="0.01" min="0" value={form.salesPOS} onChange={(e) => setForm({ ...form, salesPOS: e.target.value })} className="input" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venta sin IVA *</label>
                  <input required type="number" step="0.01" min="0" value={form.salesNoIVA} onChange={(e) => setForm({ ...form, salesNoIVA: e.target.value })} className="input" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios</label>
                  <textarea value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} className="input resize-none" rows={3} />
                </div>
                {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5">{saving ? "Guardando..." : "Guardar"}</button>
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary py-2.5">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" /></div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-gray-400"><DollarSign size={40} className="mx-auto mb-2 opacity-30" /><p>Sin ventas registradas</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Sucursal</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Venta POS</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Sin IVA</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Capturado por</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Comentarios</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{s.date}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{s.branch?.name}</td>
                    <td className="px-4 py-3 text-right text-gray-800 font-medium">${s.salesPOS.toLocaleString("es-MX")}</td>
                    <td className="px-4 py-3 text-right text-gray-600">${s.salesNoIVA.toLocaleString("es-MX")}</td>
                    <td className="px-4 py-3 text-gray-600">{s.employee?.firstName} {s.employee?.lastName}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{s.comments || "—"}</td>
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
