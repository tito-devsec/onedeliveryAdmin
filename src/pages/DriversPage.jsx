import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api.js";
import { Bike, CheckCircle, XCircle, FileText, X } from "lucide-react";
import { formatDate, statusBadge, vehicleEmoji } from "../lib/utils.js";

export default function DriversPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason]     = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["driver-applications", filter],
    queryFn: async () => { const { data } = await api.get(`/admin/driver-applications?status=${filter}`); return data; },
  });
  const apps = data?.applications || [];

  const approveMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/driver-applications/${id}/review`, { status: "approved" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["driver-applications"] }); qc.invalidateQueries({ queryKey: ["dashboard-stats"] }); },
  });
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.put(`/admin/driver-applications/${id}/review`, { status: "rejected", rejection_reason: reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["driver-applications"] }); setRejectId(null); setReason(""); },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Bike className="text-orange-400" size={22} /> Driver Applications</h1>
          <p className="text-slate-400 text-sm mt-1">Review documents and approve delivery drivers</p>
        </div>
        <div className="flex gap-2">
          {["pending","approved","rejected"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{f}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : apps.length === 0 ? (
        <div className="text-center py-20 text-slate-500"><Bike size={40} className="mx-auto mb-3 opacity-20" /><p>No {filter} applications</p></div>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => (
            <div key={app.id} className="bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl">
                    {vehicleEmoji(app.vehicle_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white font-bold">{app.user_name}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusBadge(app.status)}`}>{app.status}</span>
                    </div>
                    <p className="text-slate-400 text-sm">{app.user_email} · {app.user_phone || "No phone"}</p>
                  </div>
                </div>
                {app.status === "pending" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => approveMutation.mutate(app.id)} disabled={approveMutation.isPending} className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-2 rounded-lg text-sm font-semibold">
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button onClick={() => setRejectId(app.id)} className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg text-sm font-semibold">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Vehicle details */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Vehicle Type",  value: app.vehicle_type },
                  { label: "Plate Number",  value: app.plate_number },
                  { label: "Vehicle Model", value: app.vehicle_model || "N/A" },
                  { label: "Vehicle Color", value: app.vehicle_color || "N/A" },
                  { label: "License No.",   value: app.license_number || "N/A" },
                  { label: "Applied",       value: formatDate(app.created_at) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-800 rounded-xl p-3">
                    <p className="text-slate-500 text-xs mb-1">{label}</p>
                    <p className="text-white text-sm font-semibold capitalize">{value}</p>
                  </div>
                ))}
              </div>

              {/* Documents */}
              <div className="mt-4 flex flex-wrap gap-3">
                {app.id_document_url && (
                  <a href={app.id_document_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-orange-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                    <FileText size={14} /> ID Document
                  </a>
                )}
                {app.license_document_url && (
                  <a href={app.license_document_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-orange-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                    <FileText size={14} /> License
                  </a>
                )}
                {app.vehicle_photo_url && (
                  <a href={app.vehicle_photo_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-orange-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                    <FileText size={14} /> Vehicle Photo
                  </a>
                )}
                {!app.id_document_url && !app.license_document_url && !app.vehicle_photo_url && (
                  <p className="text-slate-600 text-sm">No documents uploaded</p>
                )}
              </div>

              {app.status === "rejected" && app.rejection_reason && (
                <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-red-400 text-xs"><span className="font-bold">Rejection reason:</span> {app.rejection_reason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {rejectId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Rejection Reason</h2>
              <button onClick={() => setRejectId(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why this application was rejected..." rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none mb-4 text-sm" />
            <div className="flex gap-3">
              <button onClick={() => setRejectId(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold text-sm">Cancel</button>
              <button onClick={() => rejectMutation.mutate({ id: rejectId, reason })} disabled={rejectMutation.isPending} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm">
                {rejectMutation.isPending ? "Rejecting…" : "Reject Driver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
