import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api.js";
import { CheckCircle, XCircle, Package, ExternalLink } from "lucide-react";
import { formatDate, formatMoney } from "../lib/utils.js";

export default function PendingProductsPage() {
  const qc = useQueryClient();
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason]     = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["pending-products"],
    queryFn: async () => { const { data } = await api.get("/admin/products?status=pending&limit=50"); return data; },
  });
  const products = data?.products || [];

  const approveMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/products/${id}/approve`, { status: "approved" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pending-products"] }); qc.invalidateQueries({ queryKey: ["dashboard-stats"] }); },
  });
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.put(`/admin/products/${id}/approve`, { status: "rejected", rejection_reason: reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pending-products"] }); setRejectId(null); setReason(""); },
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">Pending Products</h1>
        <p className="text-slate-400 text-sm mt-1">{products.length} product{products.length !== 1 ? "s" : ""} awaiting review</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto text-slate-700 mb-4" />
          <p className="text-white font-semibold text-lg">All caught up!</p>
          <p className="text-slate-500 text-sm mt-1">No pending products to review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((p) => {
            const imgs = Array.isArray(p.images) ? p.images : (typeof p.images === "string" ? JSON.parse(p.images || "[]") : []);
            return (
              <div key={p.id} className="bg-slate-900 rounded-xl border border-yellow-500/20 overflow-hidden hover:border-yellow-500/40 transition-all">
                <div className="flex gap-4 p-5">
                  {imgs[0] ? (
                    <img src={imgs[0]} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" alt={p.name} />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <Package size={28} className="text-slate-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-white font-bold text-base">{p.name}</h3>
                        <p className="text-slate-400 text-sm">
                          by <span className="text-orange-400">{p.seller_user_name || p.shop_name || "Admin"}</span>
                          {p.category_name && <span className="text-slate-500"> · {p.category_name}</span>}
                        </p>
                      </div>
                      <p className="text-orange-400 font-extrabold text-lg whitespace-nowrap">{formatMoney(p.price)}</p>
                    </div>
                    {p.description && <p className="text-slate-500 text-sm mb-3 line-clamp-2">{p.description}</p>}
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="bg-slate-800 px-2 py-1 rounded-lg">📦 Stock: {p.stock || 0}</span>
                      <span className="bg-slate-800 px-2 py-1 rounded-lg">📅 {formatDate(p.created_at)}</span>
                      {imgs.length > 1 && <span className="bg-slate-800 px-2 py-1 rounded-lg">🖼 {imgs.length} images</span>}
                    </div>
                    {imgs.length > 1 && (
                      <div className="flex gap-2 mt-3">
                        {imgs.slice(1, 4).map((url, i) => (
                          <img key={i} src={url} className="w-12 h-12 rounded-lg object-cover" alt="" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex border-t border-slate-800">
                  <button
                    onClick={() => approveMutation.mutate(p.id)}
                    disabled={approveMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 text-green-400 hover:bg-green-400/10 transition-colors font-semibold text-sm disabled:opacity-50"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <div className="w-px bg-slate-800" />
                  <button
                    onClick={() => setRejectId(p.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 text-red-400 hover:bg-red-400/10 transition-colors font-semibold text-sm"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-700 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Reason for Rejection</h2>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell the seller why their product was rejected..."
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none mb-4 text-sm"
            />
            <div className="flex gap-3">
              <button onClick={() => { setRejectId(null); setReason(""); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold text-sm">Cancel</button>
              <button onClick={() => rejectMutation.mutate({ id: rejectId, reason })} disabled={rejectMutation.isPending} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm">
                {rejectMutation.isPending ? "Rejecting…" : "Reject Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
