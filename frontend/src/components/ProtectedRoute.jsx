import { Navigate, Outlet, useLocation } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { useAuth } from "@/auth/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Loading State
  if (loading) {
    return <BarLoader className="mb-4" width={"100%"} color="#85D055" />;
  }

  // Not Logged In
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
