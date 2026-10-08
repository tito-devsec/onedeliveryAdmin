import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import LoginPage            from "./pages/LoginPage.jsx";
import DashboardPage        from "./pages/DashboardPage.jsx";
import ProductsPage         from "./pages/ProductsPage.jsx";
import PendingProductsPage  from "./pages/PendingProductsPage.jsx";
import CategoriesPage       from "./pages/CategoriesPage.jsx";
import FeaturedPage         from "./pages/FeaturedPage.jsx";
import SellerApplicationsPage from "./pages/SellerApplicationsPage.jsx";
import DriversPage          from "./pages/DriversPage.jsx";
import PackagesPage         from "./pages/PackagesPage.jsx";
import OrdersPage           from "./pages/OrdersPage.jsx";
import DeliveriesPage       from "./pages/DeliveriesPage.jsx";
import CustomersPage        from "./pages/CustomersPage.jsx";
import WithdrawalsPage      from "./pages/WithdrawalsPage.jsx";
import ReviewsPage          from "./pages/ReviewsPage.jsx";
import ChatPage             from "./pages/ChatPage.jsx";
import BroadcastPage        from "./pages/BroadcastPage.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-950">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard"   element={<DashboardPage />} />
        <Route path="products"    element={<ProductsPage />} />
        <Route path="pending"     element={<PendingProductsPage />} />
        <Route path="categories"  element={<CategoriesPage />} />
        <Route path="featured"    element={<FeaturedPage />} />
        <Route path="sellers"     element={<SellerApplicationsPage />} />
        <Route path="drivers"     element={<DriversPage />} />
        <Route path="packages"    element={<PackagesPage />} />
        <Route path="orders"      element={<OrdersPage />} />
        <Route path="deliveries"  element={<DeliveriesPage />} />
        <Route path="customers"   element={<CustomersPage />} />
        <Route path="withdrawals" element={<WithdrawalsPage />} />
        <Route path="reviews"     element={<ReviewsPage />} />
        <Route path="chat"        element={<ChatPage />} />
        <Route path="broadcast"   element={<BroadcastPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
