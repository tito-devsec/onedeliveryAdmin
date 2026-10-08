// OrdersPage.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api.js";
import { ShoppingCart, Search } from "lucide-react";
import { formatDate, formatMoney, statusBadge } from "../lib/utils.js";

export default function OrdersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: async () => {
      const params = filter !== "all" ? `?status=${filter}&limit=100` : "?limit=100";
      const { data } = await api.get(`/admin/orders${params}`);
      return data;
    },
    refetchInterval: 20_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const orders = (data?.orders || []).filter((o) =>
    !search || o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.id?.toLowerCase().includes(search.toLowerCase())
  );

  const statuses = ["all","awaiting_payment","pending","processing","shipped","delivered","cancelled"];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Orders</h1>
          <p className="text-slate-400 text-sm mt-1">{data?.total || 0} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders…" className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm w-56" />
        </div>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${filter === s ? "bg-orange-500 text-white" : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"}`}>
              {s.replace(/_/g," ")}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16"><ShoppingCart size={40} className="mx-auto text-slate-700 mb-3" /><p className="text-slate-500">No orders found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 font-semibold">
                  <th className="text-left px-5 py-3">Order</th>
                  <th className="text-left px-5 py-3">Customer</th>
                  <th className="text-left px-5 py-3">Seller</th>
                  <th className="text-left px-5 py-3">Total</th>
                  <th className="text-left px-5 py-3">Payment</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs">#{o.id.slice(-8).toUpperCase()}</td>
                    <td className="px-5 py-3 text-white font-medium">{o.customer_name || "—"}</td>
                    <td className="px-5 py-3 text-slate-400">{o.seller_shop || "—"}</td>
                    <td className="px-5 py-3 text-orange-400 font-bold">{formatMoney(o.total_price)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusBadge(o.payment_status)}`}>{o.payment_status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusBadge(o.status)}`}>{o.status?.replace(/_/g," ")}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{formatDate(o.created_at)}</td>
                    <td className="px-5 py-3">
                      {["pending","processing","shipped"].includes(o.status) && (
                        <select
                          defaultValue={o.status}
                          onChange={(e) => updateMutation.mutate({ id: o.id, status: e.target.value })}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
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
