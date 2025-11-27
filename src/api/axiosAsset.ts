import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "https://localhost:7208/api";

const apiAsset = axios.create({
  baseURL,
  withCredentials: true,
});

// 🔁 Auto-refresh token interceptor
apiAsset.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
       await axios.post(
          "http://localhost:5000/auth/User/refresh-token",  // Through gateway
         {},
        { withCredentials: true }
       );

        return apiAsset(originalRequest);
      } catch (err) {
        console.error("Refresh token failed. Redirecting...");
        localStorage.removeItem("user");
        // window.location.href = "/";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default apiAsset;
