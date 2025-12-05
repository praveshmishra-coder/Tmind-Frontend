import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7023/api",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Use the same api instance to refresh token
        await api.post("/User/refresh-token", {});

        // Retry the original request
        return api(originalRequest);
      } catch (err) {
        console.log("Refresh token failed, redirecting to login");
        localStorage.removeItem("user");
        window.location.href = "/";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
