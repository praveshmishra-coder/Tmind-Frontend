import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "https://localhost:7034";

const api = axios.create({
  baseURL: baseURL,  
  withCredentials: true, // important for cookies
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

   
    if (error.response?.status === 404 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        
        await axios.post(
          "https://localhost:7023/api/User/refresh-token",
          {},
          { withCredentials: true }
        );

        
        return api(originalRequest);
      } catch (err) {
        console.log("Refresh token failed, redirecting to Register");
        localStorage.removeItem("user");
        window.location.href = "/";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;