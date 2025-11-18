import { useEffect, useState } from "react";
import { User, Menu } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

interface TopbarProps {
  onToggleSidebar?: () => void;
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const location = useLocation();

  const isLoggedInFromState = location.state?.IsLoggedIn || false;

  // Read user from localStorage
  const [user, setUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  // Update user state 
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      setUser(storedUser);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  
  const handleLogout = async () => {
      try {
        await logout();
        toast.success("Logged out successfully");
        navigate("/");
      } catch {
        toast.error("Logout failed");
      }
  };

  const handleLogin = () => {
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-4 sm:px-6 bg-card backdrop-blur-md border-b border-border shadow-sm transition-colors">
      
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-6 w-6 text-foreground" />
        </Button>

        <h1 className="text-lg font-semibold text-foreground tracking-tight">
          <span className="lg:hidden">Tmind</span>
          <span className="hidden lg:inline">Tata Manufacturing Intelligence and Network Devices</span>
        </h1>
      </div>

      
      <div className="flex items-center gap-3">
        <ThemeToggle />

        
        {user || isLoggedInFromState ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-accent/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground hidden sm:inline">
                  {user?.username || "User"}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive font-medium"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={handleLogin} variant="outline">
            Login
          </Button>
        )}
      </div>
    </header>
  );
}
