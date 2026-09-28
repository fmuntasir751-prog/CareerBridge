import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

const PUBLIC_AUTH_PATHS = [
  "/auth/register/",
  "/auth/login/",
  "/auth/token/refresh/",
  "/auth/verify-email/",
  "/auth/resend-verification/",
  "/auth/password-reset/request/",
  "/auth/password-reset/confirm/",
];

const isPublicAuthRequest = (config) =>
  PUBLIC_AUTH_PATHS.some((path) =>
    config?.url?.startsWith(path),
  );

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(
    "careerbridge-access",
  );

  if (
    accessToken &&
    !isPublicAuthRequest(config)
  ) {
    config.headers.Authorization =
      `Bearer ${accessToken}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      isPublicAuthRequest(originalRequest)
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem(
      "careerbridge-refresh",
    );

    if (
      error.response?.status === 401 &&
      refreshToken &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/token/refresh/`,
          {
            refresh: refreshToken,
          },
        );

        const newAccessToken =
          response.data.access;

        localStorage.setItem(
          "careerbridge-access",
          newAccessToken,
        );

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem(
          "careerbridge-access",
        );
        localStorage.removeItem(
          "careerbridge-refresh",
        );

        if (
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;