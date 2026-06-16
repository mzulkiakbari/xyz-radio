"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, ShieldAlert } from "lucide-react";

export interface EmployeeData {
  id: string;
  name: string;
  discord_id: string;
  division: string;
  position: string;
  status: string;
  is_admin: boolean;
}

interface RoleGuardProps {
  children: React.ReactNode;
  allowedDivisions?: string[];
  allowedPositions?: string[];
  requireAdmin?: boolean;
}

export function RoleGuard({ children, allowedDivisions, allowedPositions, requireAdmin }: RoleGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const host = window.location.host.replace('employee.', '').replace('admin.', '');
        window.location.href = `${window.location.protocol}//${host}/login`;
        return;
      }

      // Fetch employee data
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !data || data.status !== 'Active') {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      const emp = data as EmployeeData;

      if (requireAdmin && !emp.is_admin) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      // Direksi bypasses division checks
      if (emp.division === 'Direksi') {
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      let hasDivAccess = true;
      if (allowedDivisions && allowedDivisions.length > 0) {
        hasDivAccess = allowedDivisions.includes(emp.division);
      }

      let hasPosAccess = true;
      if (allowedPositions && allowedPositions.length > 0) {
        hasPosAccess = allowedPositions.includes(emp.position);
      }

      if (hasDivAccess && hasPosAccess) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
      
      setIsLoading(false);
    };

    checkRole();
  }, [allowedDivisions, allowedPositions, requireAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-zinc-500 text-center max-w-md">
          You do not have the required permissions or active employee status to access this page. Please contact HR or the Administrator.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
