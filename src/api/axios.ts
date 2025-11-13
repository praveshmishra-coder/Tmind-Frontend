import axios from "axios";
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "react-toastify";

const baseURL = import.meta.env.VITE_API_URL || "https://localhost:7034";

const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});


// REQUEST INTERCEPTOR

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    toast.error("Request configuration failed!");
    return Promise.reject(error);
  }
);


// RESPONSE INTERCEPTOR (Refresh Token Logic)

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Handle expired token (401)
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // call refresh endpoint
        const refreshResponse = await axios.post(
          "https://localhost:7023/api/User/refresh-token",
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.access_token;

        if (newAccessToken) {
          localStorage.setItem("access_token", newAccessToken);
          api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest); // retry original request
        }
      } catch (refreshError) {
        // If refresh fails → clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        // window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    
    // Generic Error Messages
    
    let message = "Something went wrong! Please try again.";
    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === "string") message = data;
      else if (data.message) message = data.message;
      else if (data.error) message = data.error;
    }

    switch (status) {
      case 400:
        message = message || "Bad Request! Please check your input.";
        break;
      case 403:
        message = "Access denied! You don’t have permission.";
        break;
      case 404:
        message = "Requested resource not found!";
        break;
      case 500:
        message = "Server error! Please try again later.";
        break;
      default:
        message = message || "Unexpected error occurred!";
        break;
    }

    toast.error(message);
    return Promise.reject(error);
  }
);

export default api;
