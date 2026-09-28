import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

function ProtectedRoute() {
  const location = useLocation();

  const accessToken = localStorage.getItem(
    "careerbridge-access",
  );
  const refreshToken = localStorage.getItem(
    "careerbridge-refresh",
  );

  if (!accessToken && !refreshToken) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;