export function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-TZ", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-TZ", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatMoney(n) {
  return "TZS " + parseFloat(n || 0).toLocaleString("en-TZ");
}

export function timeAgo(d) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export function statusBadge(status) {
  const map = {
    approved:  "bg-green-500/20 text-green-400 border-green-500/30",
    pending:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    rejected:  "bg-red-500/20 text-red-400 border-red-500/30",
    active:    "bg-blue-500/20 text-blue-400 border-blue-500/30",
    cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    delivered: "bg-green-500/20 text-green-400 border-green-500/30",
    shipped:   "bg-blue-500/20 text-blue-400 border-blue-500/30",
    processing:"bg-purple-500/20 text-purple-400 border-purple-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    failed:    "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return map[status?.toLowerCase()] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
}

const VEHICLES = { bodaboda: "Bodaboda", bajaj: "Bajaj", toyo: "Toyo", pickup: "Pickup / Carry" };

// Side-view picture of a vehicle type (public/vehicles/<type>.png)
export function vehicleImage(type) {
  return `/vehicles/${type in VEHICLES ? type : "bodaboda"}.png`;
}

export function vehicleName(type) {
  return VEHICLES[type] || type || "Vehicle";
}

export function getErrorMessage(err) {
  return err?.response?.data?.error || err?.message || "Something went wrong";
}
