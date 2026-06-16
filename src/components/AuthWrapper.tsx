"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Loader2, AlertCircle, Radio, Users, Settings } from "lucide-react";
import { StationProvider, useStation, Station } from "./StationContext";

function AuthLogic({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [radioError, setRadioError] = useState(false);
  const [portalOptions, setPortalOptions] = useState<{ isEmployee: boolean, isAdmin: boolean } | null>(null);
  
  const { stations, setStations, selectedStation, setSelectedStation } = useStation();
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const isPublicRoute = pathname === "/" || pathname === "/login";
      const isEmployeeOrAdmin = pathname.startsWith("/employee") || pathname.startsWith("/admin");

      if (isEmployeeOrAdmin) {
        setIsLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (!isPublicRoute) router.push("/login");
        setIsLoading(false);
        return;
      }

      if (pathname.startsWith("/panel") && !isAuthenticated) {
        const email = session.user.email;
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
          const res = await fetch(`${backendUrl}/api/radio/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
          });
          const json = await res.json();

          if (json.success) {
            setStations(json.data);
            setIsAuthenticated(true);
          } else {
            setRadioError(true);
          }
        } catch (err) {
          setRadioError(true);
        }
      } else if (pathname === "/login") {
        try {
          const { data } = await supabase.from('employees').select('is_admin, status').eq('id', session.user.id).single();
          if (data && data.status === 'Active') {
            setPortalOptions({ isEmployee: true, isAdmin: data.is_admin });
          } else {
            router.push("/panel");
          }
        } catch(err) {
          router.push("/panel");
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

  if (pathname.startsWith("/employee") || pathname.startsWith("/admin") || pathname === "/") {
    return <main className="flex-1 w-full h-full">{children}</main>;
  }

  if (portalOptions) {
    const host = window.location.host.replace('employee.', '').replace('admin.', '');
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl w-full max-w-lg shadow-sm dark:shadow-2xl transition-colors duration-300">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Pilih Portal</h2>
            <p className="text-zinc-500 dark:text-zinc-400">Pilih layanan yang ingin Anda akses.</p>
          </div>
          <div className="space-y-4">
            <button 
              onClick={() => window.location.href = `${window.location.protocol}//employee.${host}`}
              className="w-full flex items-center p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all group"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center mr-4">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-zinc-900 dark:text-white group-hover:text-blue-600">Employee Management</h3>
                <p className="text-sm text-zinc-500">Akses panel karyawan XYZ Co</p>
              </div>
            </button>

            {portalOptions.isAdmin && (
              <button 
                onClick={() => window.location.href = `${window.location.protocol}//admin.${host}`}
                className="w-full flex items-center p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all group"
              >
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg flex items-center justify-center mr-4">
                  <Settings className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-zinc-900 dark:text-white group-hover:text-purple-600">Admin Panel</h3>
                  <p className="text-sm text-zinc-500">Kontrol teknis bot dan sistem</p>
                </div>
              </button>
            )}

            <button 
              onClick={() => { setPortalOptions(null); router.push("/panel"); }}
              className="w-full flex items-center p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all group"
            >
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg flex items-center justify-center mr-4">
                <Radio className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-zinc-900 dark:text-white group-hover:text-orange-600">Customer Radio</h3>
                <p className="text-sm text-zinc-500">Kelola stasiun radio Anda</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (radioError) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Akses Ditolak</h1>
        <p className="text-zinc-500 text-center max-w-md mb-6">
          Anda tidak memiliki izin ke panel radio. Jika anda sudah memesan silahkan beritahu tim marketing secara Private Message atau order radio kalau belum ada.
        </p>
        <a href="https://bit.ly/XYZCo" target="_blank" rel="noreferrer" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
          Hubungi via Discord
        </a>
        <button 
          onClick={() => supabase.auth.signOut().then(() => { setRadioError(false); window.location.href = "/login"; })}
          className="mt-6 py-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-medium"
        >
          Sign out / Ganti Akun
        </button>
      </div>
    );
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
