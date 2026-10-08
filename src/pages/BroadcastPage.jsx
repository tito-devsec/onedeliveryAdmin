import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "../lib/api.js";
import { Radio, Send, CheckCircle } from "lucide-react";

export default function BroadcastPage() {
  const [form, setForm] = useState({ title: "", body: "", role: "" });
  const [sent, setSent] = useState(null);

  const sendMutation = useMutation({
    mutationFn: () => api.post("/admin/broadcast", form),
    onSuccess: (res) => { setSent(res.data.message); setForm({ title: "", body: "", role: "" }); },
  });

  const roles = [
    { value: "",         label: "All Users",  desc: "Everyone on the platform" },
    { value: "customer", label: "Customers",  desc: "All registered customers" },
    { value: "seller",   label: "Sellers",    desc: "All approved sellers" },
    { value: "driver",   label: "Drivers",    desc: "All approved drivers" },
  ];

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Radio className="text-orange-400" size={22} /> Broadcast Notification
        </h1>
        <p className="text-slate-400 text-sm mt-1">Send a push notification to all users or a specific role</p>
      </div>

      {sent && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 mb-6">
          <CheckCircle size={16} /> {sent}
        </div>
      )}

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-5">
        {/* Audience */}
        <div>
          <label className="text-slate-400 text-sm font-medium mb-3 block">Audience</label>
          <div className="grid grid-cols-2 gap-3">
            {roles.map((r) => (
              <button
                key={r.value}
                onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                className={`text-left p-3 rounded-xl border transition-all ${form.role === r.value ? "bg-orange-500/10 border-orange-500/50 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"}`}
              >
                <p className="font-semibold text-sm">{r.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-slate-400 text-sm font-medium mb-2 block">Notification Title *</label>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. 🎉 Special Offer Today!"
            maxLength={80}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
          <p className="text-slate-600 text-xs mt-1 text-right">{form.title.length}/80</p>
        </div>

        {/* Body */}
        <div>
          <label className="text-slate-400 text-sm font-medium mb-2 block">Message Body *</label>
          <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="Write your message here…"
            rows={4}
            maxLength={300}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm resize-none" />
          <p className="text-slate-600 text-xs mt-1 text-right">{form.body.length}/300</p>
        </div>

        {/* Preview */}
        {form.title && (
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-500 text-xs mb-2">Preview</p>
            <div className="bg-slate-950 rounded-xl p-3 flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0">O</div>
              <div>
                <p className="text-white text-sm font-bold">{form.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{form.body}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => sendMutation.mutate()}
          disabled={!form.title || !form.body || sendMutation.isPending}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {sendMutation.isPending ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
          ) : (
            <><Send size={16} /> Send Broadcast</>
          )}
        </button>

        {sendMutation.isError && (
          <p className="text-red-400 text-sm text-center">{sendMutation.error?.response?.data?.error || "Failed to send"}</p>
        )}
      </div>
    </div>
  );
}
