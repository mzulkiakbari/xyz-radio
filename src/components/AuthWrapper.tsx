"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Loader2, AlertCircle, Radio } from "lucide-react";
import { StationProvider, useStation, Station } from "./StationContext";

function AuthLogic({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const { stations, setStations, selectedStation, setSelectedStation } = useStation();
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const isPublicRoute = pathname === "/" || pathname === "/login";
      
      if (!session) {
        if (!isPublicRoute) router.push("/login");
        setIsLoading(false);
        return;
      }

      // User logged in to Supabase. Check AzuraCast.
      if (!isAuthenticated) {
        const email = session.user.email;
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
          const res = await fetch(`${backendUrl}/api/azuracast/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
          });
          const json = await res.json();

          if (json.success) {
            setStations(json.data);
            setIsAuthenticated(true);
            if (pathname === "/login") router.push("/panel");
          } else {
            // Not registered in Azuracast
            await supabase.auth.signOut();
            setAuthError(json.error);
            router.push("/login");
          }
        } catch (err) {
          setAuthError("Gagal terhubung ke Backend Server.");
          await supabase.auth.signOut();
          router.push("/login");
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, router, isAuthenticated, setStations]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors duration-300">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (pathname === "/") {
    return <>{children}</>;
  }

  if (pathname === "/login") {
    return (
      <main className="flex-1">
        {authError && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-xl shadow-xl flex items-center space-x-3">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{authError}</span>
          </div>
        )}
        {children}
      </main>
    );
  }

  if (isAuthenticated) {
    // Tampilkan Modal Pemilihan Station jika belum memilih
    if (!selectedStation) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
          <TopBar />
          <div className="flex-1 w-full flex items-center justify-center">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl w-full max-w-lg shadow-sm dark:shadow-2xl transition-colors duration-300">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                  <Radio className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Select Station</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">Pilih stasiun radio yang ingin kamu kelola</p>
                </div>
              </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {stations.length === 0 ? (
                <div className="text-center p-8 text-zinc-500">Tidak ada stasiun yang tersedia untuk akunmu.</div>
              ) : (
                stations.map(station => (
                  <button
                    key={station.id}
                    onClick={() => setSelectedStation(station)}
                    className="w-full text-left p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all group"
                  >
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{station.name}</h3>
                    <p className="text-zinc-500 text-sm line-clamp-2 mt-1">{station.description || station.shortcode}</p>
                  </button>
                ))
              )}
            </div>
            
              <button 
                onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
                className="mt-6 w-full py-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-medium"
              >
                Sign out / Ganti Akun
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Jika sudah memilih station, tampilkan Dashboard
    return (
      <>
        <Sidebar />
        <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
          <TopBar />
          {children}
        </main>
      </>
    );
  }

  return null;
}

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <StationProvider>
      <AuthLogic>{children}</AuthLogic>
    </StationProvider>
  );
}
