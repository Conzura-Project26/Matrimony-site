import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const userRole = localStorage.getItem("role");
    const location = useLocation();


  // Not logged in
  if (!userRole) {
    return <Navigate to="/login" state={{ from: location }} replace/>;
  }

  // Role mismatch
  if (role && userRole !== role) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;