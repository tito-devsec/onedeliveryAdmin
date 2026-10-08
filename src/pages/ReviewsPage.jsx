import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api.js";
import { Star, EyeOff } from "lucide-react";
import { formatDate } from "../lib/utils.js";

function Stars({ n }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <Star key={i} size={12} className={i <= n ? "text-yellow-400 fill-yellow-400" : "text-slate-700"} />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => { const { data } = await api.get("/admin/reviews"); return data; },
  });
  const reviews = data?.reviews || [];

  const hideMutation = useMutation({
    mutationFn: ({ id, admin_note }) => api.put(`/admin/reviews/${id}/hide`, { admin_note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reviews"] }),
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Star className="text-orange-400" size={22} /> Reviews
        </h1>
        <p className="text-slate-400 text-sm mt-1">{reviews.length} active reviews — hide inappropriate ones</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16"><Star size={40} className="mx-auto text-slate-700 mb-3" /><p className="text-slate-500">No visible reviews</p></div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {r.reviewer_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-semibold text-sm">{r.reviewer_name}</p>
                      <Stars n={r.rating} />
                      <span className="text-slate-500 text-xs">{r.rating}/5</span>
                    </div>
                    {r.product_name && <p className="text-orange-400 text-xs mb-1">Product: {r.product_name}</p>}
                    <p className="text-slate-300 text-sm">{r.comment || <em className="text-slate-600">No comment</em>}</p>
                    <p className="text-slate-600 text-xs mt-1">{formatDate(r.created_at)}</p>
                  </div>
                </div>
                <button
                  onClick={() => { if (window.confirm("Hide this review?")) hideMutation.mutate({ id: r.id, admin_note: "Hidden by admin" }); }}
                  disabled={hideMutation.isPending}
                  className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
                >
                  <EyeOff size={12} /> Hide
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
