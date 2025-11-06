"use client";

import { Bell, User } from "lucide-react";
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

export default function Topbar() {
  return (
    <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 bg-card backdrop-blur-md border-b border-border shadow-sm transition-colors">
      {/* Left side title */}
      <h1 className="text-lg font-semibold text-foreground tracking-tight">
        Tata Machine Intelligence Device
      </h1>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-accent/30 transition-colors rounded-full"
            >
              <Bell className="h-5 w-5 text-foreground" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs font-medium shadow">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>

          {/* Dropdown Content */}
          <DropdownMenuContent
            align="end"
            className="w-80 bg-card border border-border shadow-lg rounded-lg p-2"
          >
            <DropdownMenuLabel className="text-sm font-semibold text-foreground">
              Notifications
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />

            {[
              {
                title: "High Temperature Alert",
                desc: "Asset PLC-001 exceeds threshold",
              },
              {
                title: "Device Offline",
                desc: "Gateway-03 disconnected",
              },
              {
                title: "Maintenance Due",
                desc: "Asset M-204 scheduled today",
              },
            ].map((item, i) => (
              <DropdownMenuItem
                key={i}
                className="flex flex-col items-start gap-1 px-2 py-2 rounded-md hover:bg-accent/40 cursor-pointer transition-colors"
              >
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-accent/30 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">
                Admin User
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-48 bg-card border border-border shadow-lg rounded-lg p-1"
          >
            <DropdownMenuLabel className="text-sm font-semibold text-foreground">
              My Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />

            <DropdownMenuItem className="hover:bg-accent/40 rounded-md transition-colors">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-accent/40 rounded-md transition-colors">
              Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border" />

            <DropdownMenuItem className="text-destructive font-medium hover:bg-destructive/10 rounded-md transition-colors">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
