import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle"; // your custom toggle

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Just simulate navigation — no backend logic
    if (mode === "signup") {
      console.log("User signed up:", { username, email, password });
    } else {
      console.log("User logged in:", { email, password });
    }
    navigate("/dashboard"); // move to dashboard or detail page
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground transition-colors">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-6">
        <ThemeToggle />
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-[90%] max-w-md bg-card border border-border rounded-2xl shadow-md p-8"
      >
        <h1 className="text-2xl font-semibold text-center mb-2">
          {mode === "signup" ? "Create Account" : "Welcome Back"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-4">
          {mode === "signup"
            ? "Sign up to start managing your devices"
            : "Login to access your TMind dashboard"}
        </p>

        {mode === "signup" && (
          <div>
            <label className="block text-sm mb-1 font-medium">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full border border-border rounded-md p-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        <div>
          <label className="block text-sm mb-1 font-medium">Email</label>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-border rounded-md p-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 font-medium">Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-border rounded-md p-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          className="mt-2 w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 transition"
        >
          {mode === "signup" ? "Create Account" : "Login"}
        </button>

        <p className="text-center text-sm mt-3 text-muted-foreground">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <span
                onClick={() => setMode("login")}
                className="text-primary underline cursor-pointer"
              >
                Login here
              </span>
            </>
          ) : (
            <>
              Don’t have an account?{" "}
              <span
                onClick={() => setMode("signup")}
                className="text-primary underline cursor-pointer"
              >
                Sign up
              </span>
            </>
          )}
        </p>
      </form>
    </div>
  );
};

export default Login;
