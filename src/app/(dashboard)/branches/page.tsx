"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, Pencil, Trash2, MapPin } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  scheduleStart: string;
  scheduleEnd: string;
  toleranceMinutes: number;
  active: boolean;
  _count?: { employees: number };
}

const emptyForm = {
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  radiusMeters: "100",
  scheduleStart: "08:00",
  scheduleEnd: "17:00",
  toleranceMinutes: "15",
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const r = await fetch("/api/branches");
    const d = await r.json();
    setBranches(Array.isArray(d) ? d : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(b: Branch) {
    setEditing(b);
    setForm({
      name: b.name,
      address: b.address || "",
      latitude: String(b.latitude),
      longitude: String(b.longitude),
      radiusMeters: String(b.radiusMeters),
      scheduleStart: b.scheduleStart,
      scheduleEnd: b.scheduleEnd,
      toleranceMinutes: String(b.toleranceMinutes),
    });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = editing ? `/api/branches/${editing.id}` : "/api/branches";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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

  async function handleDelete(id: string) {
    if (!confirm("¿Desactivar esta sucursal?")) return;
    await fetch(`/api/branches/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sucursales</h1>
          <p className="text-gray-500 text-sm">Gestión de sucursales ChampionCoat</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus size={16} />
          Nueva sucursal
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-5">
                {editing ? "Editar sucursal" : "Nueva sucursal"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <Field label="Nombre *">
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input"
                      placeholder="Sucursal Centro"
                    />
                  </Field>
                  <Field label="Dirección">
                    <input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="input"
                      placeholder="Av. Reforma 123..."
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Latitud *">
                      <input
                        required
                        type="number"
                        step="any"
                        value={form.latitude}
                        onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                        className="input"
                        placeholder="19.4326"
                      />
                    </Field>
                    <Field label="Longitud *">
                      <input
                        required
                        type="number"
                        step="any"
                        value={form.longitude}
                        onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                        className="input"
                        placeholder="-99.1332"
                      />
                    </Field>
                  </div>
                  <Field label="Radio permitido (metros)">
                    <input
                      type="number"
                      value={form.radiusMeters}
                      onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })}
                      className="input"
                      min={10}
                      max={5000}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Horario entrada">
                      <input
                        type="time"
                        value={form.scheduleStart}
                        onChange={(e) => setForm({ ...form, scheduleStart: e.target.value })}
                        className="input"
                      />
                    </Field>
                    <Field label="Horario salida">
                      <input
                        type="time"
                        value={form.scheduleEnd}
                        onChange={(e) => setForm({ ...form, scheduleEnd: e.target.value })}
                        className="input"
                      />
                    </Field>
                  </div>
                  <Field label="Tolerancia de retardo (minutos)">
                    <input
                      type="number"
                      value={form.toleranceMinutes}
                      onChange={(e) => setForm({ ...form, toleranceMinutes: e.target.value })}
                      className="input"
                      min={0}
                      max={120}
                    />
                  </Field>
                </div>

                {error && (
                  <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{error}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50">
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium transition">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
          </div>
        ) : branches.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Building2 size={40} className="mx-auto mb-2 opacity-30" />
            <p>Sin sucursales registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Dirección</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Coordenadas</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Radio</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Horario</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Empleados</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {branches.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{b.name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{b.address || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        {b.latitude.toFixed(4)}, {b.longitude.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.radiusMeters}m</td>
                    <td className="px-4 py-3 text-gray-600">{b.scheduleStart} - {b.scheduleEnd}</td>
                    <td className="px-4 py-3 text-gray-600">{b._count?.employees ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {b.active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(b)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                          <Pencil size={14} className="text-gray-500" />
                        </button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
