import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  LayoutDashboard, Package, Tag, Star, Layers, Store, Truck,
  Award, ShoppingCart, Users, MessageSquare, LogOut, ChevronRight,
  Bike, CreditCard, Star as ReviewStar, Radio, MapPin,
} from "lucide-react";

const NAV = [
  { section: "Overview" },
  { to: "/dashboard",   icon: LayoutDashboard, label: "Dashboard" },
  { section: "Products" },
  { to: "/products",    icon: Package,         label: "All Products" },
  { to: "/pending",     icon: Layers,          label: "Pending Review" },
  { to: "/categories",  icon: Tag,             label: "Categories" },
  { to: "/featured",    icon: Star,            label: "Featured" },
  { section: "Users" },
  { to: "/sellers",     icon: Store,           label: "Seller Applications" },
  { to: "/drivers",     icon: Bike,            label: "Driver Applications" },
  { to: "/customers",   icon: Users,           label: "Customers" },
  { section: "Business" },
  { to: "/orders",      icon: ShoppingCart,    label: "Orders" },
  { to: "/deliveries",  icon: MapPin,          label: "Deliveries" },
  { to: "/packages",    icon: Award,           label: "Packages & Plans" },
  { to: "/withdrawals", icon: CreditCard,      label: "Withdrawals" },
  { section: "Support" },
  { to: "/reviews",     icon: ReviewStar,      label: "Reviews" },
  { to: "/chat",        icon: MessageSquare,   label: "Messages" },
  { to: "/broadcast",   icon: Radio,           label: "Broadcast" },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen overflow-hidden">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="One Delivery" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">One Delivery</p>
            <p className="text-orange-400 text-xs">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        {NAV.map((item, i) => {
          if (item.section) {
            return (
              <p key={i} className="text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 pt-4 pb-1 first:pt-2">
                {item.section}
              </p>
            );
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`
              }
            >
              <Icon size={16} />
              <span className="flex-1">{item.label}</span>
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-40 transition-opacity" />
            </NavLink>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-slate-800 flex-shrink-0">
        {user && (
          <div className="px-3 py-2 mb-1">
            <p className="text-white text-sm font-semibold truncate">{user.name}</p>
            <p className="text-slate-500 text-xs truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
