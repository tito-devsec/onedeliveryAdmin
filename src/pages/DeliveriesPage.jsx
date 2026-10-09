import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api.js";
import { MapPin, Search } from "lucide-react";
import { formatDate, formatMoney, statusBadge, vehicleImage, vehicleName } from "../lib/utils.js";

const DELIVERY_STATUSES = ["all","searching","accepted","going_to_shop","picked_up","on_the_way","delivered","cancelled","no_driver"];

export default function DeliveriesPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-deliveries", filter],
    queryFn: async () => {
      const params = filter !== "all" ? `?status=${filter}&limit=100` : "?limit=100";
      const { data } = await api.get(`/admin/deliveries${params}`);
      return data;
    },
    refetchInterval: 10_000,
  });

  const deliveries = (data?.deliveries || []).filter((d) =>
    !search || d.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.driver_name?.toLowerCase().includes(search.toLowerCase())
  );

  const liveCount = (data?.deliveries || []).filter((d) =>
    ["accepted","going_to_shop","picked_up","on_the_way"].includes(d.status)
  ).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <MapPin className="text-orange-400" size={22} /> Deliveries
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {data?.total || 0} total · <span className="text-green-400 font-semibold">{liveCount} live now</span>
          </p>
        </div>
        {liveCount > 0 && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1.5 rounded-xl text-sm font-semibold">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {liveCount} active delivery{liveCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by customer or driver…"
            className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm w-64" />
        </div>
        <div className="flex flex-wrap gap-2">
          {DELIVERY_STATUSES.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter === s ? "bg-orange-500 text-white" : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"}`}>
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-16"><MapPin size={40} className="mx-auto text-slate-700 mb-3" /><p className="text-slate-500">No deliveries found</p></div>
      ) : (
        <div className="space-y-3">
          {deliveries.map((d) => {
            const isLive = ["accepted","going_to_shop","picked_up","on_the_way"].includes(d.status);
            return (
              <div key={d.id} className={`bg-slate-900 rounded-xl border p-5 transition-all ${isLive ? "border-green-500/30" : "border-slate-800"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={vehicleImage(d.vehicle_type)} alt={vehicleName(d.vehicle_type)} title={vehicleName(d.vehicle_type)} className="w-14 h-10 object-contain shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-white font-bold text-sm">#{d.id.slice(-8).toUpperCase()}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusBadge(d.status)}`}>
                          {d.status?.replace(/_/g, " ")}
                        </span>
                        {isLive && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
                      </div>
                      <p className="text-slate-400 text-xs">{formatDate(d.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-400 font-bold">{formatMoney(d.fare)}</p>
                    {d.suggested_fare != null && parseFloat(d.suggested_fare) !== parseFloat(d.fare) && (
                      <p className="text-slate-500 text-xs">suggested {formatMoney(d.suggested_fare)}</p>
                    )}
                    <p className={`text-xs font-semibold ${Number(d.delivery_fee_paid) ? "text-green-400" : "text-slate-400"}`}>
                      {Number(d.delivery_fee_paid) ? "Paid in app" : d.payment_method === "cash" ? "Cash to driver" : "Mobile money (unpaid)"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Customer", value: d.customer_name || "—" },
                    { label: "Driver",   value: d.driver_name || "Not assigned", sub: d.plate_number },
                    { label: "Pickup",   value: d.pickup_address  || `${d.pickup_lat}, ${d.pickup_lng}` },
                    { label: "Dropoff",  value: d.dropoff_address || `${d.dropoff_lat}, ${d.dropoff_lng}` },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="bg-slate-800 rounded-xl p-3">
                      <p className="text-slate-500 text-xs mb-1">{label}</p>
                      <p className="text-white text-sm font-semibold">{value}</p>
                      {sub && <p className="text-slate-500 text-xs">{sub}</p>}
                    </div>
                  ))}
                </div>
                {d.distance_km > 0 && (
                  <p className="mt-2 text-slate-600 text-xs">Distance: {parseFloat(d.distance_km).toFixed(1)} km · {formatMoney(d.fare)}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
