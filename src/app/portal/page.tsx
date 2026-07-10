"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, Radio, Users, Settings } from "lucide-react";

export default function PortalPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [portalOptions, setPortalOptions] = useState<{ isEmployee: boolean, isAdmin: boolean } | null>(null);
  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const { data, error } = await supabase.from('employees').select('is_admin, status').eq('id', session.user.id).maybeSingle();
        
        if (error) {
           console.error("Supabase Error:", error);
           setErrorMsg(error.message);
           setIsLoading(false);
           return;
        }

        if (data && data.status === 'Active') {
          setPortalOptions({ isEmployee: true, isAdmin: data.is_admin });
          setIsLoading(false);
        } else {
          // Jika bukan karyawan aktif, langsung ke panel radio
          router.push("/panel");
        }
      } catch (err: any) {
        console.error("Catch Error:", err);
        setErrorMsg(err.message || "Unknown error");
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-lg text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">Gagal Membaca Data Karyawan</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">{errorMsg}</p>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6"> Pastikan Row Level Security di database sudah diatur agar user bisa membaca tabel employees.</p>
          <button onClick={() => router.push("/panel")} className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-bold">Lanjutkan ke Radio Panel</button>
        </div>
      </div>
    );
  }

  if (!portalOptions) return null;

  const host = window.location.host.replace('employee.', '').replace('admin.', '');

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl w-full max-w-lg shadow-sm dark:shadow-2xl transition-colors duration-300 animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Pilih Portal</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Pilih layanan yang ingin Anda akses.</p>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => window.location.href = `${window.location.protocol}//employee.${host}`}
            className="w-full flex items-center p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all group cursor-pointer"
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
              className="w-full flex items-center p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all group cursor-pointer"
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
            onClick={() => router.push("/panel")}
            className="w-full flex items-center p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg flex items-center justify-center mr-4">
              <Radio className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-zinc-900 dark:text-white group-hover:text-orange-600">Radio Panel</h3>
              <p className="text-sm text-zinc-500">Kelola stasiun radio Anda</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
