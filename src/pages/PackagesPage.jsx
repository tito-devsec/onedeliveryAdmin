import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api.js";
import { Award, Pencil, X, Check, Users } from "lucide-react";
import { formatMoney } from "../lib/utils.js";

export default function PackagesPage() {
  const qc = useQueryClient();
  const [editPkg, setEditPkg]   = useState(null);
  const [form, setForm]         = useState({});
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ userId: "", packageId: "", durationDays: "" });
  const [assignMsg, setAssignMsg]   = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-packages"],
    queryFn: async () => { const { data } = await api.get("/admin/packages"); return data; },
  });
  const packages = data?.packages || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, ...rest }) => api.put(`/admin/packages/${id}`, rest),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-packages"] }); setEditPkg(null); },
  });
  const assignMutation = useMutation({
    mutationFn: (body) => api.post("/admin/packages/assign", body),
    onSuccess: (res) => { setAssignMsg(res.data.message); setAssignForm({ userId: "", packageId: "", durationDays: "" }); },
  });

  const openEdit = (pkg) => {
    setEditPkg(pkg);
    const feats = Array.isArray(pkg.features) ? pkg.features : JSON.parse(pkg.features || "[]");
    setForm({ name: pkg.name, price: String(pkg.price), duration_days: String(pkg.duration_days), features: feats.join("\n"), is_active: pkg.is_active });
  };

  const handleUpdate = () => {
    const feats = form.features.split("\n").map((f) => f.trim()).filter(Boolean);
    updateMutation.mutate({ id: editPkg.id, name: form.name, price: parseFloat(form.price), duration_days: parseInt(form.duration_days), features: feats, is_active: form.is_active });
  };

  const byType = (type) => packages.filter((p) => p.type === type);

  const typeLabel = { customer: "Customer Plans", seller: "Seller Plans", driver: "Driver Plans" };
  const typeColor = { customer: "text-blue-400", seller: "text-orange-400", driver: "text-purple-400" };
  const typeBg    = { customer: "bg-blue-500/10 border-blue-500/20", seller: "bg-orange-500/10 border-orange-500/20", driver: "bg-purple-500/10 border-purple-500/20" };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Award className="text-orange-400" size={22} /> Packages & Plans
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage subscription packages for customers, sellers and drivers</p>
        </div>
        <button onClick={() => setShowAssign(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors">
          <Users size={16} /> Assign Package
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-8">
          {["customer","seller","driver"].map((type) => (
            <div key={type}>
              <h2 className={`text-lg font-bold mb-4 ${typeColor[type]}`}>{typeLabel[type]}</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {byType(type).map((pkg) => {
                  const feats = Array.isArray(pkg.features) ? pkg.features : JSON.parse(pkg.features || "[]");
                  return (
                    <div key={pkg.id} className={`rounded-xl border p-5 ${typeBg[type]} relative ${!pkg.is_active ? "opacity-50" : ""}`}>
                      {!pkg.is_active && (
                        <span className="absolute top-3 right-3 text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                      <div className="mb-3">
                        <p className={`font-extrabold text-lg ${typeColor[type]}`}>{pkg.name}</p>
                        <p className="text-white text-2xl font-black mt-1">
                          {pkg.is_free ? "Free" : formatMoney(pkg.price)}
                          {!pkg.is_free && <span className="text-slate-500 text-sm font-normal">/{pkg.duration_days}d</span>}
                        </p>
                      </div>
                      <ul className="space-y-1.5 mb-4">
                        {feats.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <Check size={14} className={`mt-0.5 flex-shrink-0 ${typeColor[type]}`} />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {!pkg.is_free && (
                        <button onClick={() => openEdit(pkg)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                          <Pencil size={12} /> Edit package
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editPkg && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-lg p-6 border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Edit: {editPkg.name}</h2>
              <button onClick={() => setEditPkg(null)}><X size={18} className="text-slate-400 hover:text-white" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm font-medium mb-1.5 block">Package Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm font-medium mb-1.5 block">Price (TZS)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 text-sm" />
                </div>
                <div>
                  <label className="text-slate-400 text-sm font-medium mb-1.5 block">Duration (days)</label>
                  <input type="number" value={form.duration_days} onChange={(e) => setForm((f) => ({ ...f, duration_days: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-sm font-medium mb-1.5 block">Features (one per line)</label>
                <textarea value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))} rows={6}
                  placeholder={"Free shipping\nPriority support\nEarly access deals"}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm resize-none" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-10 h-5 rounded-full transition-colors relative ${form.is_active ? "bg-orange-500" : "bg-slate-700"}`}
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${form.is_active ? "left-5" : "left-0.5"}`} />
                </div>
                <span className="text-slate-400 text-sm">Active (visible to users)</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditPkg(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold text-sm">Cancel</button>
              <button onClick={handleUpdate} disabled={updateMutation.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm">
                {updateMutation.isPending ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Package Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Assign Package to User</h2>
              <button onClick={() => { setShowAssign(false); setAssignMsg(""); }}><X size={18} className="text-slate-400 hover:text-white" /></button>
            </div>
            {assignMsg ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check size={22} className="text-green-400" />
                </div>
                <p className="text-white font-semibold">{assignMsg}</p>
                <button onClick={() => setAssignMsg("")} className="mt-4 text-orange-400 text-sm hover:text-orange-300">Assign another</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm font-medium mb-1.5 block">User ID</label>
                  <input value={assignForm.userId} onChange={(e) => setAssignForm((f) => ({ ...f, userId: e.target.value }))}
                    placeholder="Paste user UUID here"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
                </div>
                <div>
                  <label className="text-slate-400 text-sm font-medium mb-1.5 block">Package</label>
                  <select value={assignForm.packageId} onChange={(e) => setAssignForm((f) => ({ ...f, packageId: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 text-sm">
                    <option value="">Select package</option>
                    {packages.filter((p) => !p.is_free).map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.type}) — {formatMoney(p.price)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-sm font-medium mb-1.5 block">Custom Duration (days, optional)</label>
                  <input type="number" value={assignForm.durationDays} onChange={(e) => setAssignForm((f) => ({ ...f, durationDays: e.target.value }))}
                    placeholder="Leave blank for package default"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowAssign(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold text-sm">Cancel</button>
                  <button
                    onClick={() => assignMutation.mutate({ userId: assignForm.userId, packageId: assignForm.packageId, durationDays: assignForm.durationDays ? parseInt(assignForm.durationDays) : undefined })}
                    disabled={!assignForm.userId || !assignForm.packageId || assignMutation.isPending}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm">
                    {assignMutation.isPending ? "Assigning…" : "Assign"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
