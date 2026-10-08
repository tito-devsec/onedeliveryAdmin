import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api.js";
import { Star, Package, X, CheckCircle } from "lucide-react";
import { formatMoney, formatDate, statusBadge } from "../lib/utils.js";

export default function FeaturedPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [days, setDays] = useState(7);
  const [search, setSearch] = useState("");

  const { data: featData } = useQuery({
    queryKey: ["admin-featured"],
    queryFn: async () => { const { data } = await api.get("/admin/products?status=approved&limit=200"); return data; },
  });

  const { data: allData } = useQuery({
    queryKey: ["admin-products-approved"],
    queryFn: async () => { const { data } = await api.get("/admin/products?status=approved&limit=200"); return data; },
    enabled: showModal,
  });

  const featuredProducts = (featData?.products || []).filter((p) => p.is_featured);
  const allApproved      = (allData?.products   || []).filter((p) => !search || p.name?.toLowerCase().includes(search.toLowerCase()));

  const featureMutation = useMutation({
    mutationFn: ({ id, days, force }) => api.put(`/admin/products/${id}/feature`, { days, force }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-featured"] }); setShowModal(false); setSelectedId(""); setDays(7); },
    onError: (e, vars) => {
      const msg = e?.response?.data?.error || e.message || "Feature failed";
      if (msg.includes("no active paid package")) {
        if (window.confirm(`${msg}\n\nFeature it anyway (admin override)?`)) {
          featureMutation.mutate({ ...vars, force: true });
        }
      } else {
        alert(msg);
      }
    },
  });
  const unfeatureMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/products/${id}/feature`, { feature: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-featured"] }),
    onError: (e) => alert(e?.response?.data?.error || "Un-feature failed"),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Star className="text-orange-400" size={22} /> Featured Products
          </h1>
          <p className="text-slate-400 text-sm mt-1">{featuredProducts.length} products currently featured in the app</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors">
          <Star size={16} /> Feature Product
        </button>
      </div>

      {featuredProducts.length === 0 ? (
        <div className="text-center py-20">
          <Star size={40} className="mx-auto text-slate-700 mb-3" />
          <p className="text-white font-semibold">No featured products yet</p>
          <p className="text-slate-500 text-sm mt-1">Feature products to promote them at the top of the app</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredProducts.map((p) => {
            const imgs = Array.isArray(p.images) ? p.images : (typeof p.images === "string" ? JSON.parse(p.images || "[]") : []);
            return (
              <div key={p.id} className="bg-slate-900 rounded-xl border border-yellow-500/30 overflow-hidden hover:border-yellow-500/50 transition-all">
                <div className="relative">
                  {imgs[0] ? (
                    <img src={imgs[0]} alt={p.name} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-slate-800 flex items-center justify-center">
                      <Package size={32} className="text-slate-600" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star size={10} className="fill-black" /> FEATURED
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-white font-bold">{p.name}</p>
                  <p className="text-orange-400 font-extrabold mt-1">{formatMoney(p.price)}</p>
                  {p.featured_until && (
                    <p className="text-slate-500 text-xs mt-2">Featured until {formatDate(p.featured_until)}</p>
                  )}
                  <button
                    onClick={() => { if (window.confirm("Remove this product from featured?")) unfeatureMutation.mutate(p.id); }}
                    disabled={unfeatureMutation.isPending}
                    className="mt-3 w-full bg-slate-800 hover:bg-red-500/15 hover:text-red-400 text-slate-300 py-2 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5">
                    <X size={12} /> Remove from featured
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feature modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-xl p-6 border border-slate-700 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-lg font-bold text-white">Feature a Product</h2>
              <button onClick={() => { setShowModal(false); setSelectedId(""); setSearch(""); }}><X size={18} className="text-slate-400 hover:text-white" /></button>
            </div>

            <div className="flex-shrink-0 mb-4">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search approved products…"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {allApproved.map((p) => {
                const imgs = Array.isArray(p.images) ? p.images : (typeof p.images === "string" ? JSON.parse(p.images || "[]") : []);
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedId(p.id === selectedId ? "" : p.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedId === p.id ? "border-orange-500 bg-orange-500/10" : "border-slate-800 hover:border-slate-700"}`}
                  >
                    {imgs[0] ? (
                      <img src={imgs[0]} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt={p.name} />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0"><Package size={18} className="text-slate-600" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{p.name}</p>
                      <p className="text-orange-400 text-sm">{formatMoney(p.price)}</p>
                    </div>
                    {selectedId === p.id && <CheckCircle size={18} className="text-orange-400 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>

            <div className="flex-shrink-0 space-y-4 border-t border-slate-800 pt-4">
              <div>
                <label className="text-slate-400 text-sm font-medium mb-1.5 block">Feature Duration</label>
                <div className="flex gap-2">
                  {[3,7,14,30].map((d) => (
                    <button key={d} onClick={() => setDays(d)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${days === d ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowModal(false); setSelectedId(""); setSearch(""); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold text-sm">Cancel</button>
                <button
                  onClick={() => featureMutation.mutate({ id: selectedId, days })}
                  disabled={!selectedId || featureMutation.isPending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm">
                  {featureMutation.isPending ? "Featuring…" : `Feature for ${days} days`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
