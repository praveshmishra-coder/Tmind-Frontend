import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "@/api/authApi";
import { getCurrentUser } from "@/api/userApi"; // ✅ Current user API
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
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expired, setExpired] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpResentAt, setOtpResentAt] = useState<number>(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP Countdown Timer
  useEffect(() => {
    if (step !== "otp") return;
    setExpired(false);
    setTimer(60);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, otpResentAt]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Validation
  const validate = () => {
  const newErrors: typeof errors = {};

  // Username validation only for signup
  if (mode === "signup" && !/^[A-Za-z0-9]{3,}$/.test(username)) {
    newErrors.username = "Username must be at least 3 characters (letters or numbers only).";
  }

  // Email validation (for both login & signup)
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
    newErrors.email = "Invalid email format.";
  }

  // ✅ Password validation only for signup (skip for login)
  if (mode === "signup") {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      newErrors.password =
        "Password must include uppercase, lowercase, number, and symbol (min 8 chars).";
    }
  }

  // OTP validation only in OTP step
  if (step === "otp" && !/^\d{6}$/.test(otp)) {
    newErrors.otp = "OTP must be 6 digits.";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  // Handle Login / Signup / OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === "login") {
        if (step === "credentials") {
          const payload = { email, password };
          const response = await authApi.post("/User/Login", payload);
          toast.success(response.data.message || "OTP sent to your email.");
          setStep("otp");
        } else if (step === "otp") {
          const otpPayload = { email, otp };
          const response = await authApi.post("/User/OtpVerify", otpPayload);

          // ✅ Save tokens if returned
          if (response.data.access_token) localStorage.setItem("access_token", response.data.access_token);
          if (response.data.refresh_token) localStorage.setItem("refresh_token", response.data.refresh_token);

          // ✅ Fetch current user and save
          const currentUser = await getCurrentUser();
          localStorage.setItem("user", JSON.stringify(currentUser));

          toast.success(response.data.message || "OTP verified successfully!");
          navigate("/dashboard", { state: { IsLoggedIn: true } });
        }
      } else if (mode === "signup") {
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
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setResending(true);
    try {
      const payload = { email, password };
      const response = await authApi.post("/User/Login", payload);
      toast.success(response.data.message || "OTP resent successfully!");
      setOtp("");
      setExpired(false);
      setOtpResentAt(Date.now());
      setTimer(60);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.data?.message ||
        "Failed to resend OTP.";
      toast.error(errorMessage);
    } finally {
      setResending(false);
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

        {mode === "signup" && (
          <div>
            <label className="block text-sm mb-1 font-medium">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
          </div>
        )}

        {(mode === "signup" || step === "credentials") && (
          <>
            <div>
              <label className="block text-sm mb-1 font-medium">Email</label>
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full border border-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
          </>
        )}

        {step === "otp" && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">OTP</label>
              {!expired && timer > 0 && (
                <div className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-md font-medium">
                  Expires in: {formatTime(timer)}
                </div>
              )}
            </div>
            <div className="flex justify-between gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <input
                  key={index}
                  ref={(el) => { otpRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[index] || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/, "");
                    const newOtp = otp.split("");
                    newOtp[index] = value;
                    setOtp(newOtp.join(""));
                    if (value && index < 5) otpRefs.current[index + 1]?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otp[index] && index > 0) {
                      otpRefs.current[index - 1]?.focus();
                    }
                  }}
                  className="w-12 h-12 text-center border border-border rounded-md text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ))}
            </div>

            {expired && (
              <button
                type="button"
                disabled={resending}
                onClick={handleResendOTP}
                className={`w-full mt-4 py-2 text-sm font-medium border rounded-md transition ${
                  resending
                    ? "border-border text-muted-foreground cursor-not-allowed bg-muted"
                    : "text-primary border-primary hover:bg-primary/10"
                }`}
              >
                {resending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Resending...
                  </div>
                ) : (
                  "Resend OTP"
                )}
              </button>
            )}

            {errors.otp && <p className="text-red-500 text-xs mt-2">{errors.otp}</p>}
          </div>
        )}

        {!expired && (
          <button
            type="submit"
            disabled={loading}
            className={`mt-2 w-full py-2 rounded-md font-medium transition ${
              loading
                ? "bg-primary/70 text-primary-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </div>
            ) : mode === "signup" ? (
              "Create Account"
            ) : step === "credentials" ? (
              "Login"
            ) : (
              "Verify OTP"
            )}
          </button>
        )}

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

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
};

export default Login;
