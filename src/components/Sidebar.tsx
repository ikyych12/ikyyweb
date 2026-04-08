import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Smartphone, 
  Send, 
  Users, 
  UserCircle, 
  History, 
  ShieldCheck, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { useStore } from "../store";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { currentUser, logout } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Device", icon: Smartphone, path: "/devices" },
    { name: "Blast WA", icon: Send, path: "/blast" },
    { name: "Referral", icon: Users, path: "/referral" },
    { name: "Profil", icon: UserCircle, path: "/profile" },
    { name: "Riwayat Withdraw", icon: History, path: "/withdraw-history" },
  ];

  if (currentUser?.role === 'admin') {
    menuItems.push({ name: "Admin Panel", icon: ShieldCheck, path: "/admin" });
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-2 mb-8 px-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Send className="text-primary-foreground w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">BlastWA</span>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t">
            <div className="flex items-center gap-3 px-3 py-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{currentUser?.username}</span>
                <span className="text-xs text-muted-foreground truncate">{currentUser?.email}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
