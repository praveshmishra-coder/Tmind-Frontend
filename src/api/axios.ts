// src/api/axios.ts
import axios from "axios";
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "react-toastify";

// Base URL from environment
const baseURL = import.meta.env.VITE_API_URL || "https://localhost:7034";

const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true, // ready for cookies or auth
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ==========================
// Request Interceptor
// ==========================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add headers or tokens later here
    // Example:
    // const token = localStorage.getItem("token");
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    toast.error("Request configuration failed!");
    return Promise.reject(error);
  }
);

// ==========================
// Response Interceptor
// ==========================
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    console.error("API Error:", error);

    let message = "Something went wrong! Please try again.";

    // If backend sends structured error
    if (error.response?.data) {
      const data = error.response.data;

      if (typeof data === "string") {
        message = data;
      } else if (data.message) {
        message = data.message;
      } else if (data.error) {
        message = data.error;
      }
    }

    // Handle by status code
    const status = error.response?.status;
    switch (status) {
      case 400:
        message = message || "Bad Request! Please check your input.";
        break;
      case 401:
        message = "Unauthorized! Please log in again.";
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

    // Show toast message
    toast.error(message);

    return Promise.reject(error);
  }
);

export default api;
