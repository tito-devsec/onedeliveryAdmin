import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../lib/api.js";
import { formatMoney, formatDate, statusBadge } from "../lib/utils.js";
import {
  TrendingUp, Package, ShoppingCart, Users, Store, Truck,
  Clock, AlertCircle, MapPin, CreditCard, Star, Radio,
} from "lucide-react";

function StatCard({ label, value, icon: Icon, color, bg, to }) {
  return (
    <Link to={to} className="bg-slate-900 hover:bg-slate-800 rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition-all block group">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon size={20} className={color} />
      </div>
      <p className={`text-2xl font-extrabold ${color} mb-0.5`}>{value}</p>
      <p className="text-slate-400 text-sm">{label}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => { const { data } = await api.get("/admin/dashboard"); return data; },
    refetchInterval: 30_000,
  });
  const { data: ordersData } = useQuery({
    queryKey: ["admin-orders-recent"],
    queryFn: async () => { const { data } = await api.get("/admin/orders?limit=6"); return data; },
  });
  const { data: delivData } = useQuery({
    queryKey: ["admin-deliveries-live"],
    queryFn: async () => { const { data } = await api.get("/admin/deliveries?status=on_the_way&limit=5"); return data; },
    refetchInterval: 10_000,
  });

  const orders     = ordersData?.orders || [];
  const liveDelivs = delivData?.deliveries || [];

  const statsCards = [
    { label: "Total Revenue",    value: isLoading ? "…" : formatMoney(stats?.totalRevenue),    icon: TrendingUp,  color: "text-orange-400", bg: "bg-orange-400/10", to: "/orders" },
    { label: "Total Orders",     value: isLoading ? "…" : stats?.totalOrders ?? 0,             icon: ShoppingCart,color: "text-blue-400",   bg: "bg-blue-400/10",  to: "/orders" },
    { label: "Customers",        value: isLoading ? "…" : stats?.totalCustomers ?? 0,          icon: Users,       color: "text-green-400",  bg: "bg-green-400/10", to: "/customers" },
    { label: "Products Live",    value: isLoading ? "…" : stats?.totalProducts ?? 0,           icon: Package,     color: "text-purple-400", bg: "bg-purple-400/10",to: "/products" },
    { label: "Drivers Online",   value: isLoading ? "…" : stats?.activeDrivers ?? 0,           icon: Truck,       color: "text-teal-400",   bg: "bg-teal-400/10",  to: "/drivers" },
    { label: "Today's Orders",   value: isLoading ? "…" : stats?.todayOrders ?? 0,             icon: Clock,       color: "text-yellow-400", bg: "bg-yellow-400/10",to: "/orders" },
  ];

  const alerts = [
    stats?.pendingProducts  && { label: `${stats.pendingProducts} products awaiting review`, to: "/pending",  color: "yellow" },
    stats?.pendingSellers   && { label: `${stats.pendingSellers} seller applications pending`, to: "/sellers", color: "blue" },
    stats?.pendingDrivers   && { label: `${stats.pendingDrivers} driver applications pending`, to: "/drivers", color: "purple" },
  ].filter(Boolean);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">OneDelivery platform overview</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {alerts.map((a, i) => (
            <Link key={i} to={a.to} className={`flex items-center gap-2 bg-${a.color}-500/10 border border-${a.color}-500/30 text-${a.color}-400 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity`}>
              <AlertCircle size={14} /> {a.label}
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsCards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Live deliveries + Recent orders */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Live Deliveries */}
        <div className="bg-slate-900 rounded-xl border border-slate-800">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-white font-bold flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live Deliveries
            </h2>
            <Link to="/deliveries" className="text-orange-400 text-xs font-semibold hover:text-orange-300">View all →</Link>
          </div>
          {liveDelivs.length === 0 ? (
            <div className="py-10 text-center">
              <MapPin size={32} className="mx-auto text-slate-700 mb-2" />
              <p className="text-slate-500 text-sm">No live deliveries</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {liveDelivs.map((d) => (
                <div key={d.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-semibold">{d.customer_name || "Customer"}</p>
                    <p className="text-slate-500 text-xs">{d.driver_name || "Driver"} · {d.vehicle_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-400 text-sm font-bold">{formatMoney(d.fare)}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusBadge(d.status)}`}>
                      {d.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-slate-900 rounded-xl border border-slate-800">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-white font-bold">Recent Orders</h2>
            <Link to="/orders" className="text-orange-400 text-xs font-semibold hover:text-orange-300">View all →</Link>
          </div>
          {orders.length === 0 ? (
            <div className="py-10 text-center">
              <ShoppingCart size={32} className="mx-auto text-slate-700 mb-2" />
              <p className="text-slate-500 text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {orders.map((o) => (
                <div key={o.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-semibold">{o.customer_name || "Customer"}</p>
                    <p className="text-slate-500 text-xs">{formatDate(o.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-400 text-sm font-bold">{formatMoney(o.total_price)}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusBadge(o.status)}`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-white font-bold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { to: "/pending",     icon: Clock,     label: "Review Products", color: "text-yellow-400" },
            { to: "/sellers",     icon: Store,     label: "Seller Apps",     color: "text-blue-400" },
            { to: "/drivers",     icon: Truck,     label: "Driver Apps",     color: "text-purple-400" },
            { to: "/withdrawals", icon: CreditCard,label: "Withdrawals",     color: "text-green-400" },
            { to: "/reviews",     icon: Star,      label: "Reviews",         color: "text-orange-400" },
            { to: "/broadcast",   icon: Radio,     label: "Broadcast",       color: "text-teal-400" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.to} to={a.to} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl p-4 flex flex-col items-center gap-2 transition-colors group">
                <Icon size={20} className={a.color} />
                <span className="text-slate-400 group-hover:text-white text-xs font-medium text-center transition-colors">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
