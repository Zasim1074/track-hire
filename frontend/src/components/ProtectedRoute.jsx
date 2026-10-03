import { useUser } from "@clerk/clerk-react";
import { Navigate, Outlet, useLocation, } from "react-router-dom";
import { BarLoader } from "react-spinners";

const ProtectedRoute = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const location = useLocation();
  const { pathname } = location;

  // Loading State
  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#85D055" />;
  }

  // Not Logged In
  if (!isSignedIn) {
    return <Navigate to="/?sign-in=true" state={{ from: location }} replace />;
  }

  // Logged in but role not selected
  if (user && !user?.unsafeMetadata?.role && pathname !== "/on-boarding") {
    return <Navigate to="/on-boarding" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
