import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"credentials" | "otp">("credentials"); // <-- added step
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string; otp?: string }>({});

  // ✅ Validation logic
  const validate = () => {
    const newErrors: { username?: string; email?: string; password?: string; otp?: string } = {};

    if (mode === "signup" && !/^[A-Za-z0-9]{3,}$/.test(username)) {
      newErrors.username = "Username must be at least 3 characters (letters or numbers only).";
    }

    if (!/^[A-Za-z0-9._%+-]+@gmail\.com$/.test(email)) {
      newErrors.email = "Invalid Domain";
    }

    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    if (step === "otp" && !/^\d{6}$/.test(otp)) {
      newErrors.otp = "OTP must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (mode === "signup") {
      console.log("User signed up:", { username, email, password });
      navigate("/dashboard");
    } else {
      if (step === "credentials") {
        // For demonstration, we skip backend password verification
        console.log("Credentials valid, proceed to OTP:", { email, password });
        setStep("otp");
        setOtp("");
        setErrors({});
      } else if (step === "otp") {
        console.log("OTP verified:", otp);
        navigate("/dashboard");
      }
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
              className="w-full border border-border rounded-md p-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
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

        {step === "otp" && (
          <div>
            <label className="block text-sm mb-1 font-medium">OTP</label>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border border-border rounded-md p-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.otp && <p className="text-red-500 text-xs mt-1">{errors.otp}</p>}
          </div>
        )}

        <button
          type="submit"
          className="mt-2 w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 transition"
        >
          {mode === "signup" ? "Create Account" : step === "credentials" ? "Login" : "Verify OTP"}
        </button>

        {mode === "login" && step === "credentials" && (
          <p className="text-center text-sm mt-3 text-muted-foreground">
            Don’t have an account?{" "}
            <span
              onClick={() => setMode("signup")}
              className="text-primary underline cursor-pointer"
            >
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
    </div>
  );
};

export default Login;