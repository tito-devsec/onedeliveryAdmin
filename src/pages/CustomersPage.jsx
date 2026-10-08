import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api.js";
import { Users, Search, ShieldOff, ShieldCheck } from "lucide-react";
import { formatDate, statusBadge } from "../lib/utils.js";

export default function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole]     = useState("customer");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", role],
    queryFn: async () => { const { data } = await api.get(`/admin/users?role=${role}&limit=200`); return data; },
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: (e) => alert(e?.response?.data?.error || "Delete failed"),
  });

  const users = (data?.users || []).filter((u) =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const ROLES = [
    { value: "customer", label: "Customers" },
    { value: "seller",   label: "Sellers"   },
    { value: "driver",   label: "Drivers"   },
    { value: "admin",    label: "Admins"    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Users className="text-orange-400" size={22}/> Users
          </h1>
          <p className="text-slate-400 text-sm mt-1">{data?.total || 0} {role}s registered</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm w-64" />
        </div>
        <div className="flex gap-2">
          {ROLES.map((r) => (
            <button key={r.value} onClick={() => setRole(r.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${role === r.value ? "bg-orange-500 text-white" : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16"><Users size={40} className="mx-auto text-slate-700 mb-3" /><p className="text-slate-500">No {role}s found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 font-semibold">
                  <th className="text-left px-5 py-3">User</th>
                  <th className="text-left px-5 py-3">Phone</th>
                  <th className="text-left px-5 py-3">Role</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Joined</th>
                  <th className="text-right px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold text-sm flex-shrink-0">
                          {u.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{u.name}</p>
                          <p className="text-slate-500 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{u.phone || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${u.role === "admin" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : u.role === "driver" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : u.role === "seller" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${u.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                        {u.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      {u.role !== "admin" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { if (window.confirm(u.is_active ? "Suspend this user?" : "Activate this user?")) toggleMutation.mutate(u.id); }}
                            disabled={toggleMutation.isPending}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${u.is_active ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30" : "bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30"}`}>
                            {u.is_active ? <><ShieldOff size={12}/> Suspend</> : <><ShieldCheck size={12}/> Activate</>}
                          </button>
                          <button
                            onClick={() => { if (window.confirm(`Permanently delete ${u.name}? This removes their profile, applications and tokens.`)) deleteMutation.mutate(u.id); }}
                            disabled={deleteMutation.isPending}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors">
                            Delete
                          </button>
                        </div>
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
