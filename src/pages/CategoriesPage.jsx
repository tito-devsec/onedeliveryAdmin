import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api.js";
import { Plus, Pencil, Trash2, X, Tag, Upload, Image as ImageIcon } from "lucide-react";

const ICONS = ["grid-outline","hardware-chip-outline","shirt-outline","fast-food-outline","sparkles-outline","fitness-outline","book-outline","bed-outline","game-controller-outline","car-outline","home-outline","phone-portrait-outline","medkit-outline","paw-outline","leaf-outline","airplane-outline","cafe-outline","cart-outline","gift-outline","watch-outline"];
const COLORS = ["#3B82F6","#EC4899","#EF4444","#A855F7","#22C55E","#F59E0B","#14B8A6","#F97316","#64748B","#1D4ED8","#DC2626","#16A34A","#0891B2","#7C3AED","#D97706"];

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm] = useState({ name: "", icon: "grid-outline", color: "#F97316", sort_order: "50" });
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => { const { data } = await api.get("/admin/categories"); return data; },
  });
  const categories = data?.categories || [];

  const createMutation = useMutation({
    mutationFn: (fd) => api.post("/admin/categories", fd, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); close(); },
    onError: (e) => alert(e?.response?.data?.error || "Create failed"),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, fd }) => api.put(`/admin/categories/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); close(); },
    onError: (e) => alert(e?.response?.data?.error || "Update failed"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  const close = () => {
    setShowModal(false); setEditing(null);
    setForm({ name: "", icon: "grid-outline", color: "#F97316", sort_order: "50" });
    setFile(null); setPreview("");
  };
  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, icon: cat.icon || "grid-outline", color: cat.color || "#F97316", sort_order: String(cat.sort_order || 50) });
    setPreview(cat.image_url || "");
    setFile(null);
    setShowModal(true);
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return alert("Name required");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("image", file);
    if (editing) updateMutation.mutate({ id: editing.id, fd });
    else createMutation.mutate(fd);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Tag className="text-orange-400" size={22} /> Categories</h1>
          <p className="text-slate-400 text-sm mt-1">Shown as a grid on the customer app home screen — use an icon or upload an image</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="flex items-center justify-between mb-3">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: (cat.color || "#F97316") + "20" }}>
                    <span style={{ color: cat.color || "#F97316" }} className="text-2xl">●</span>
                  </div>
                )}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><Pencil size={12} /></button>
                  <button onClick={() => { if (window.confirm("Delete category?")) deleteMutation.mutate(cat.id); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 size={12} /></button>
                </div>
              </div>
              <p className="text-white font-semibold text-sm">{cat.name}</p>
              <p className="text-slate-600 text-xs mt-0.5">Order {cat.sort_order}</p>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-500">No categories yet — add your first one</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editing ? "Edit Category" : "New Category"}</h2>
              <button onClick={close}><X size={18} className="text-slate-400 hover:text-white" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm font-medium mb-1.5 block">Category Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Electronics"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
              </div>

              <div>
                <label className="text-slate-400 text-sm font-medium mb-2 block">Category Image (optional — overrides icon)</label>
                <label className="border-2 border-dashed border-slate-700 hover:border-orange-500/50 rounded-xl p-4 flex flex-col items-center cursor-pointer transition-colors">
                  <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  {preview ? (
                    <img src={preview} alt="" className="w-20 h-20 rounded-xl object-cover" />
                  ) : (
                    <><Upload size={22} className="text-slate-600 mb-2" /><p className="text-slate-500 text-sm">Click to upload an image</p></>
                  )}
                </label>
                {preview && (
                  <button onClick={() => { setFile(null); setPreview(""); }} className="text-slate-500 hover:text-red-400 text-xs mt-2 flex items-center gap-1">
                    <X size={11} /> Remove image (use icon instead)
                  </button>
                )}
              </div>

              <div>
                <label className="text-slate-400 text-sm font-medium mb-2 block">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))} style={{ backgroundColor: c }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? "border-white scale-110" : "border-transparent"}`} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-sm font-medium mb-1.5 block flex items-center gap-1.5"><ImageIcon size={13} /> Icon (Ionicons — used when no image)</label>
                <select value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 text-sm">
                  {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-sm font-medium mb-1.5 block">Sort Order (lower = first)</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={close} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold text-sm">Cancel</button>
              <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm">
                {(createMutation.isPending || updateMutation.isPending) ? "Saving…" : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
