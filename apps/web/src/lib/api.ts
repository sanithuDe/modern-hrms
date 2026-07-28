import axios, {
    type AxiosError,
    type InternalAxiosRequestConfig,
} from "axios";

export const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:5000/api",
});

api.interceptors.request.use(
  (
    config: InternalAxiosRequestConfig,
  ) => {
    if (
      typeof window !==
      "undefined"
    ) {
      const token =
        window.localStorage.getItem(
          "accessToken",
        );

      if (token) {
        config.headers.Authorization =
          `Bearer ${token}`;
      }
    }

    return config;
  },
  (
    error: AxiosError,
  ) =>
    Promise.reject(
      error,
    ),
);

api.interceptors.response.use(
  (response) =>
    response,

  (
    error: AxiosError,
  ) => {
    if (
      typeof window !==
        "undefined" &&
      error.response?.status ===
        401
    ) {
      window.localStorage.removeItem(
        "accessToken",
      );

      window.localStorage.removeItem(
        "authUser",
      );

      window.location.href =
        "/login";
    }

    return Promise.reject(
      error,
    );
  },
);