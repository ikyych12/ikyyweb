import * as React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useStore } from "../store";
import { Toaster } from "sonner";

export function Layout() {
  const { currentUser } = useStore();
  const location = useLocation();

  // Simple state sync for localStorage updates across tabs/components
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  if (!currentUser && location.pathname !== "/login" && location.pathname !== "/register") {
    return <Navigate to="/login" replace />;
  }

  if (currentUser && (location.pathname === "/login" || location.pathname === "/register")) {
    return <Navigate to="/" replace />;
  }

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      {!isAuthPage && <Sidebar />}
      <main className={cn(
        "transition-all duration-300",
        !isAuthPage ? "md:pl-64" : ""
      )}>
        <div className="container mx-auto p-6 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

import { cn } from "../lib/utils";
