import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
} from "react-router-dom";

import api from "../services/api";

function RoleRoute({ allowedRoles }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticationFailed, setAuthenticationFailed] =
    useState(false);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await api.get("/auth/me/");
        setUser(response.data);
      } catch {
        setAuthenticationFailed(true);
      } finally {
        setLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  if (loading) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p>Loading...</p>
        </section>
      </main>
    );
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