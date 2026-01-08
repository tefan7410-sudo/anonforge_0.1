import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMaintenanceMode } from "@/hooks/use-status";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: maintenanceMode, isLoading } = useMaintenanceMode();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Check if current user is admin
  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        setIsAdmin(!!data);
      } catch {
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  // Redirect to status page if maintenance mode is active and user is not admin
  useEffect(() => {
    if (isLoading || checkingAdmin) return;
    
    const isStatusPage = location.pathname === "/status";
    const isMaintenanceActive = maintenanceMode?.enabled === true;
    
    if (isMaintenanceActive && !isAdmin && !isStatusPage) {
      navigate("/status", { replace: true });
    }
  }, [maintenanceMode, isAdmin, location.pathname, navigate, isLoading, checkingAdmin]);

  // Show nothing while checking (to prevent flash)
  if (isLoading || checkingAdmin) {
    return null;
  }

  return <>{children}</>;
}
