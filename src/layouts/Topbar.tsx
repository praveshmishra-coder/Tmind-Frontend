import { useEffect, useState } from "react";
import { User, Menu,Bell } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import StartTourButton from "./StartTourButton";

interface TopbarProps {
  onToggleSidebar?: () => void;
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const location = useLocation();

  const isLoggedInFromState = location.state?.IsLoggedIn || false;

  type Notification = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
};

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "High Temperature Alert",
      message: "Asset PLC-001 exceeds threshold",
      isRead: false
    },
    {
      id: 2,
      title: "Device Offline",
      message: "Gateway-03 disconnected",
      isRead: false
    },
    {
      id: 3,
      title: "Maintenance Due",
      message: "Asset M-204 scheduled today",
      isRead: false
    },
  ]);

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
    toast.success("All notifications marked as read");
  };

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
    <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-4 sm:px-6 bg-sidebar backdrop-blur-md border-b border-border shadow-sm transition-colors">
      
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
        <StartTourButton />

        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs">
                {notifications.filter(n => !n.isRead).length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80 bg-card border border-border p-2 shadow-lg rounded-lg">

          {/* Header — Notifications + Mark All Read */}
          <div className="flex items-center justify-between px-1 pb-1">
            <DropdownMenuLabel className="text-base font-semibold">
              Notifications
            </DropdownMenuLabel>

            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={markAllAsRead}
            >
              Mark All Read
            </Button>
          </div>

          <DropdownMenuSeparator />

          {/* Empty State */}
          {notifications.length === 0 && (
            <p className="text-center text-sm text-muted-foreground p-3">
              No notifications
            </p>
          )}

          {/* Notification List */}
          <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-md border transition cursor-pointer ${
                  n.isRead ? "bg-card/50 border-transparent" : "bg-accent/40 border-accent"
                }`}
                onClick={() => markAsRead(n.id)}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium">{n.title}</p>

                  {!n.isRead && (
                    <span className="h-2 w-2 rounded-full bg-primary mt-1"></span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
              </div>
            ))}
          </div>

        </DropdownMenuContent>
      </DropdownMenu>
              
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
