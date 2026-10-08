import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api.js";
import { CreditCard, Check, X } from "lucide-react";
import { formatDate, formatMoney, statusBadge } from "../lib/utils.js";

export default function WithdrawalsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const [failId, setFailId] = useState(null);
  const [failReason, setFailReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-withdrawals", filter],
    queryFn: async () => { const { data } = await api.get(`/admin/withdrawals?status=${filter}`); return data; },
  });
  const withdrawals = data?.withdrawals || [];

  const processMutation = useMutation({
    mutationFn: ({ id, status, failure_reason }) => api.put(`/admin/withdrawals/${id}/process`, { status, failure_reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-withdrawals"] }); setFailId(null); setFailReason(""); },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <CreditCard className="text-orange-400" size={22} /> Withdrawals
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage seller and driver withdrawal requests</p>
        </div>
        <div className="flex gap-2">
          {["pending","processing","completed","failed"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === s ? "bg-orange-500 text-white" : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"}`}>{s}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center py-16"><CreditCard size={40} className="mx-auto text-slate-700 mb-3" /><p className="text-slate-500">No {filter} withdrawals</p></div>
      ) : (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 font-semibold">
                  <th className="text-left px-5 py-3">User</th>
                  <th className="text-left px-5 py-3">Role</th>
                  <th className="text-left px-5 py-3">Amount</th>
                  <th className="text-left px-5 py-3">Method</th>
                  <th className="text-left px-5 py-3">Account</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-white font-semibold">{w.user_name || "—"}</p>
                      <p className="text-slate-500 text-xs">{w.user_email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${w.user_role === "seller" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"}`}>
                        {w.user_role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-orange-400 font-bold">{formatMoney(w.amount)}</td>
                    <td className="px-5 py-3 text-slate-400 capitalize">{w.method?.replace(/_/g," ")}</td>
                    <td className="px-5 py-3">
                      <p className="text-slate-300 text-xs">{w.account_number}</p>
                      {w.bank_name && <p className="text-slate-500 text-xs">{w.bank_name}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusBadge(w.status)}`}>{w.status}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{formatDate(w.created_at)}</td>
                    <td className="px-5 py-3">
                      {(w.status === "pending" || w.status === "processing") && (
                        <div className="flex gap-2">
                          <button onClick={() => processMutation.mutate({ id: w.id, status: "completed" })} disabled={processMutation.isPending}
                            className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors" title="Mark completed">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setFailId(w.id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors" title="Mark failed">
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {failId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-700">
            <h2 className="text-lg font-bold text-white mb-4">Reason for Failure</h2>
            <textarea value={failReason} onChange={(e) => setFailReason(e.target.value)}
              placeholder="e.g. Invalid account number..." rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none mb-4 text-sm" />
            <div className="flex gap-3">
              <button onClick={() => { setFailId(null); setFailReason(""); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold text-sm">Cancel</button>
              <button onClick={() => processMutation.mutate({ id: failId, status: "failed", failure_reason: failReason })}
                disabled={processMutation.isPending} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm">
                {processMutation.isPending ? "Saving…" : "Mark as Failed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
