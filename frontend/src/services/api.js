import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

const REQUEST_TIMEOUT = 45000;

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

const clearAuthentication = () => {
  localStorage.removeItem("careerbridge-access");
  localStorage.removeItem("careerbridge-refresh");
};

const redirectToLogin = () => {
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshRequest = null;

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(
    "careerbridge-access",
  );

  if (accessToken && !isPublicAuthRequest(config)) {
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

    if (isPublicAuthRequest(originalRequest)) {
      return Promise.reject(error);
    }

    const isUnauthorized =
      error.response?.status === 401;

    if (!isUnauthorized) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem(
      "careerbridge-refresh",
    );

    if (
      !refreshToken ||
      !originalRequest ||
      originalRequest._retry
    ) {
      clearAuthentication();
      redirectToLogin();

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshRequest) {
        refreshRequest = axios
          .post(
            `${API_BASE_URL}/auth/token/refresh/`,
            {
              refresh: refreshToken,
            },
            {
              timeout: REQUEST_TIMEOUT,
              headers: {
                "Content-Type": "application/json",
              },
            },
          )
          .finally(() => {
            refreshRequest = null;
          });
      }

      const response = await refreshRequest;
      const newAccessToken = response.data.access;

      localStorage.setItem(
        "careerbridge-access",
        newAccessToken,
      );

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearAuthentication();
      redirectToLogin();

      return Promise.reject(refreshError);
    }
  },
);

export const getApiErrorMessage = (
  error,
  fallbackMessage,
) => {
  if (error.code === "ECONNABORTED") {
    return (
      "The server is taking longer than expected. " +
      "Please try again."
    );
  }

  if (!error.response) {
    return (
      "Unable to connect to the server. " +
      "Please check your internet connection."
    );
  }

  const responseData = error.response.data;

  if (typeof responseData === "string") {
    return responseData;
  }

  if (responseData?.detail) {
    return responseData.detail;
  }

  if (responseData && typeof responseData === "object") {
    const messages = Object.values(responseData)
      .flat()
      .filter(Boolean)
      .join(" ");

    if (messages) {
      return messages;
    }
  }

  return fallbackMessage;
};

export default api;