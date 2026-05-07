"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Pencil, Trash2, Camera } from "lucide-react";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  position?: string;
  scheduleIn: string;
  scheduleOut: string;
  active: boolean;
  consent: boolean;
  branch: { id: string; name: string };
  user: { email: string; role: string; active: boolean };
  faceProfile?: { id: string } | null;
}

interface Branch {
  id: string;
  name: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({
    email: "", password: "", firstName: "", lastName: "",
    phone: "", position: "", branchId: "", scheduleIn: "08:00",
    scheduleOut: "17:00", role: "EMPLEADO", consent: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [eRes, bRes] = await Promise.all([
      fetch("/api/employees"),
      fetch("/api/branches"),
    ]);
    const [emp, bra] = await Promise.all([eRes.json(), bRes.json()]);
    setEmployees(Array.isArray(emp) ? emp : []);
    setBranches(Array.isArray(bra) ? bra : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ email: "", password: "", firstName: "", lastName: "", phone: "", position: "", branchId: branches[0]?.id || "", scheduleIn: "08:00", scheduleOut: "17:00", role: "EMPLEADO", consent: false });
    setError("");
    setShowForm(true);
  }

  function openEdit(emp: Employee) {
    setEditing(emp);
    setForm({
      email: emp.user.email,
      password: "",
      firstName: emp.firstName,
      lastName: emp.lastName,
      phone: emp.phone || "",
      position: emp.position || "",
      branchId: emp.branch.id,
      scheduleIn: emp.scheduleIn,
      scheduleOut: emp.scheduleOut,
      role: emp.user.role,
      consent: emp.consent,
    });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = editing ? `/api/employees/${editing.id}` : "/api/employees";
    const method = editing ? "PUT" : "POST";
    const payload = editing
      ? { firstName: form.firstName, lastName: form.lastName, phone: form.phone, position: form.position, branchId: form.branchId, scheduleIn: form.scheduleIn, scheduleOut: form.scheduleOut, consent: form.consent }
      : form;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

  async function handleDeactivate(id: string) {
    if (!confirm("¿Desactivar este empleado?")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    load();
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-800",
    GERENTE: "bg-blue-100 text-blue-800",
    EMPLEADO: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Empleados</h1>
          <p className="text-gray-500 text-sm">Gestión del personal por sucursal</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          <Plus size={16} />
          Nuevo empleado
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-5">
                {editing ? "Editar empleado" : "Nuevo empleado"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                    <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input" />
                  </div>
                </div>
                {!editing && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                      <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" minLength={6} />
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Puesto</label>
                    <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="input" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal *</label>
                  <select required value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="input">
                    <option value="">Seleccionar...</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora entrada</label>
                    <input type="time" value={form.scheduleIn} onChange={(e) => setForm({ ...form, scheduleIn: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora salida</label>
                    <input type="time" value={form.scheduleOut} onChange={(e) => setForm({ ...form, scheduleOut: e.target.value })} className="input" />
                  </div>
                </div>
                {!editing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
                      <option value="EMPLEADO">Empleado</option>
                      <option value="GERENTE">Gerente</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="consent" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="w-4 h-4 accent-red-600" />
                  <label htmlFor="consent" className="text-sm text-gray-700">Consentimiento para reconocimiento facial</label>
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
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-gray-400"><Users size={40} className="mx-auto mb-2 opacity-30" /><p>Sin empleados registrados</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Puesto</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Sucursal</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Horario</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Rol</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Facial</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{emp.firstName} {emp.lastName}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.user.email}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.position || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.branch.name}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.scheduleIn} - {emp.scheduleOut}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[emp.user.role] || "bg-gray-100 text-gray-700"}`}>{emp.user.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs ${emp.faceProfile ? "text-green-600" : "text-gray-400"}`}>
                        <Camera size={12} />
                        {emp.faceProfile ? "Registrado" : "Sin registrar"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {emp.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(emp)} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><Pencil size={14} className="text-gray-500" /></button>
                        <button onClick={() => handleDeactivate(emp.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition"><Trash2 size={14} className="text-red-400" /></button>
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
