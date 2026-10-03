import { Navigate, Outlet, useLocation } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { useAuth } from "@/auth/AuthContext";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Loading State
  if (loading) {
    return <BarLoader className="mb-4" width={"100%"} color="#85D055" />;
  }

  // Not Logged In
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
};

export default ProtectedRoute;
