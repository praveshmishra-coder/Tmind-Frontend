import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "@/api/authApi"; // ✅ your axios instance
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string; otp?: string }>({});

  // ✅ Validation logic
  const validate = () => {
    const newErrors: typeof errors = {};

    if (mode === "signup" && !/^[A-Za-z0-9]{3,}$/.test(username)) {
      newErrors.username = "Username must be at least 3 characters (letters or numbers only).";
    }

    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
      newErrors.email = "Invalid email format.";
    }

    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
    }

    if (step === "otp" && !/^\d{6}$/.test(otp)) {
      newErrors.otp = "OTP must be 6 digits.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle Login / Signup / OTP verify
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (mode === "login") {
        if (step === "credentials") {
          // Step 1: Login (send email + password)
          const payload = { email, password };
          const response = await authApi.post("/User/Login", payload);
          toast.success(response.data.message || "Login successful! OTP sent to your email.");
          setStep("otp");
        } else if (step === "otp") {
          // Step 2: Verify OTP
          const otpPayload = { email, otp };
          const response = await authApi.post("/User/OtpVerify", otpPayload);
          toast.success(response.data.message || "OTP verified successfully!");
          navigate("/dashboard");
        }
      } else if (mode === "signup") {
        // Signup flow
        const registerPayload = { username, email, password };
        const response = await authApi.post("/User/Register", registerPayload);
        toast.success(response.data.message || "Registered successfully! Please login.");
        setMode("login");
        setStep("credentials");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(errorMessage);
      console.error("API Error:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground transition-colors">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-[90%] max-w-md bg-card border border-border rounded-2xl shadow-md p-8"
      >
        <h1 className="text-2xl font-semibold text-center mb-2">
          {mode === "signup" ? "Create Account" : step === "credentials" ? "Welcome Back" : "Enter OTP"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-4">
          {mode === "signup"
            ? "Sign up to start managing your devices"
            : step === "credentials"
            ? "Login to access your TMind dashboard"
            : "Enter the 6-digit OTP sent to your email"}
        </p>

        {/* Signup Fields */}
        {mode === "signup" && (
          <div>
            <label className="block text-sm mb-1 font-medium">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-border rounded-md p-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
          </div>
        )}

        {/* Email + Password (for login or signup) */}
        {(mode === "signup" || step === "credentials") && (
          <>
            <div>
              <label className="block text-sm mb-1 font-medium">Email</label>
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border rounded-md p-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm mb-1 font-medium">Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border rounded-md p-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
          </>
        )}

        {/* OTP Step */}
        {step === "otp" && (
          <div>
            <label className="block text-sm mb-2 font-medium">OTP</label>
            <div className="flex justify-between gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[index] || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/, "");
                    if (!value) return;

                    const newOtp = otp.split("");
                    newOtp[index] = value;
                    const updatedOtp = newOtp.join("");
                    setOtp(updatedOtp);

                    const nextInput = document.getElementById(`otp-${index + 1}`);
                    if (nextInput && value) (nextInput as HTMLInputElement).focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace") {
                      const newOtp = otp.split("");
                      newOtp[index] = "";
                      setOtp(newOtp.join(""));
                      if (index > 0) {
                        const prevInput = document.getElementById(`otp-${index - 1}`);
                        (prevInput as HTMLInputElement)?.focus();
                      }
                    }
                  }}
                  id={`otp-${index}`}
                  className="w-12 h-12 text-center border border-border rounded-md text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ))}
            </div>
            {errors.otp && <p className="text-red-500 text-xs mt-2">{errors.otp}</p>}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="mt-2 w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 transition"
        >
          {mode === "signup" ? "Create Account" : step === "credentials" ? "Login" : "Verify OTP"}
        </button>

        {/* Switch Mode Links */}
        {mode === "login" && step === "credentials" && (
          <p className="text-center text-sm mt-3 text-muted-foreground">
            Don’t have an account?{" "}
            <span onClick={() => setMode("signup")} className="text-primary underline cursor-pointer">
              Sign up
            </span>
          </p>
        )}

        {mode === "signup" && (
          <p className="text-center text-sm mt-3 text-muted-foreground">
            Already have an account?{" "}
            <span
              onClick={() => {
                setMode("login");
                setStep("credentials");
              }}
              className="text-primary underline cursor-pointer"
            >
              Login here
            </span>
          </p>
        )}
      </form>

      {/* Toasts */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
};

export default Login;
