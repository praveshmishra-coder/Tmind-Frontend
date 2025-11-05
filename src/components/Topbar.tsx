import ThemeToggle from "./ThemeToggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Topbar() {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border">
      <h1 className="text-xl font-semibold">Tata Machine Intelligence Device</h1>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Avatar>
          <AvatarFallback>TM</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
