import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api.js";
import { Plus, Pencil, Trash2, X, Upload, Search } from "lucide-react";
import { formatMoney, statusBadge } from "../lib/utils.js";

const STATUS_FILTERS = ["all","approved","pending","rejected"];

export default function ProductsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "", category_id: "" });
  const [files, setFiles]     = useState([]);
  const [previews, setPreviews] = useState([]);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["admin-products", filterStatus],
    queryFn: async () => {
      const params = filterStatus !== "all" ? `?status=${filterStatus}&limit=200` : "?limit=200";
      const { data } = await api.get(`/admin/products${params}`);
      return data;
    },
  });
  const { data: catsData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => { const { data } = await api.get("/admin/categories"); return data; },
  });

  const products   = (productsData?.products || []).filter((p) => !search || p.name?.toLowerCase().includes(search.toLowerCase()));
  const categories = catsData?.categories || [];

  const createMutation = useMutation({
    mutationFn: (fd) => api.post("/products", fd, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); closeModal(); },
    onError: (e) => alert(e?.response?.data?.error || e.message || "Failed to create product"),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, fd }) => api.put(`/products/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); closeModal(); },
    onError: (e) => alert(e?.response?.data?.error || e.message || "Failed to update product"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
    onError: (e) => alert(e?.response?.data?.error || e.message || "Failed to delete product"),
  });

  const closeModal = () => { setShowModal(false); setEditing(null); setForm({ name: "", description: "", price: "", stock: "", category_id: "" }); setFiles([]); setPreviews([]); };
  const openEdit = (p) => {
    setEditing(p);
    const imgs = Array.isArray(p.images) ? p.images : (typeof p.images === "string" ? JSON.parse(p.images || "[]") : []);
    setForm({ name: p.name || "", description: p.description || "", price: String(p.price || ""), stock: String(p.stock || ""), category_id: p.category_id || "" });
    setPreviews(imgs);
    setShowModal(true);
  };

  const handleFiles = (e) => {
    const fs = Array.from(e.target.files).slice(0, 6);
    setFiles(fs);
    setPreviews(fs.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = () => {
    if (!form.name || !form.price) return alert("Name and price are required");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    files.forEach((f) => fd.append("images", f));
    if (editing) updateMutation.mutate({ id: editing.id, fd });
    else createMutation.mutate(fd);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Products</h1>
          <p className="text-slate-400 text-sm mt-1">{productsData?.total || 0} total products</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
            className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm w-56" />
        </div>
        <div className="flex gap-2">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${filterStatus === s ? "bg-orange-500 text-white" : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 font-semibold">
                  <th className="text-left px-5 py-3">Product</th>
                  <th className="text-left px-5 py-3">Category</th>
                  <th className="text-left px-5 py-3">Price</th>
                  <th className="text-left px-5 py-3">Stock</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const imgs = Array.isArray(p.images) ? p.images : (typeof p.images === "string" ? JSON.parse(p.images || "[]") : []);
                  return (
                    <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {imgs[0] ? (
                            <img src={imgs[0]} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt={p.name} />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0"><Upload size={14} className="text-slate-600" /></div>
                          )}
                          <div>
                            <p className="text-white font-semibold">{p.name}</p>
                            {p.seller_user_name && <p className="text-slate-500 text-xs">by {p.seller_user_name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-400">{p.category_name || "—"}</td>
                      <td className="px-5 py-3 text-orange-400 font-bold">{formatMoney(p.price)}</td>
                      <td className="px-5 py-3 text-white">{p.stock}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${statusBadge(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => { if (window.confirm("Delete product?")) deleteMutation.mutate(p.id); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {products.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-500">No products found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editing ? "Edit Product" : "Add Product"}</h2>
              <button onClick={closeModal}><X size={18} className="text-slate-400 hover:text-white" /></button>
            </div>

            <div className="mb-4">
              <label className="text-slate-400 text-sm font-medium mb-2 block">Images (max 6)</label>
              <label className="border-2 border-dashed border-slate-700 hover:border-orange-500/50 rounded-xl p-4 flex flex-col items-center cursor-pointer transition-colors block">
                <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
                {previews.length > 0 ? (
                  <div className="flex flex-wrap gap-2">{previews.map((url, i) => <img key={i} src={url} className="w-14 h-14 rounded-lg object-cover" alt="" />)}</div>
                ) : (
                  <><Upload size={22} className="text-slate-600 mb-2" /><p className="text-slate-500 text-sm">Click to upload images</p></>
                )}
              </label>
            </div>

            <div className="space-y-4">
              {[
                { key: "name",  label: "Product Name *", placeholder: "e.g. Samsung Galaxy A55" },
                { key: "price", label: "Price (TZS) *",  placeholder: "e.g. 850000",  type: "number" },
                { key: "stock", label: "Stock",           placeholder: "e.g. 50",       type: "number" },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="text-slate-400 text-sm font-medium mb-1.5 block">{label}</label>
                  <input type={type || "text"} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
                </div>
              ))}

              <div>
                <label className="text-slate-400 text-sm font-medium mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Product description…"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm resize-none" />
              </div>

              <div>
                <label className="text-slate-400 text-sm font-medium mb-1.5 block">Category</label>
                <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 text-sm">
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold text-sm">Cancel</button>
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
