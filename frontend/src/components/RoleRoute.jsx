import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import api from "../services/api";
import LoadingScreen from "./LoadingScreen.jsx";

function RoleRoute({ allowedRoles }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticationFailed, setAuthenticationFailed] =
    useState(false);

  useEffect(() => {
    let active = true;

    const loadCurrentUser = async () => {
      try {
        const response = await api.get("/auth/me/");

        if (active) {
          setUser(response.data);
        }
      } catch {
        if (active) {
          setAuthenticationFailed(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (authenticationFailed) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default RoleRoute;