"use client";

import { useEffect, useState } from "react";
import { useStation } from "@/components/StationContext";
import { Podcast as PodcastIcon, Loader2, Server, Key, User } from "lucide-react";

type StreamerData = {
  id: number;
  streamer_username: string;
  comments: string;
  is_active: boolean;
};

export default function PodcastPage() {
  const { selectedStation } = useStation();
  const [streamers, setStreamers] = useState<StreamerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedStation) return;

    const fetchStreamers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/azuracast/stations/${selectedStation.id}/streamers`);
        const json = await res.json();
        
        if (json.success) {
          setStreamers(json.data);
        } else {
          setError(json.error || "Gagal memuat streamer.");
        }
      } catch (err) {
        setError("Gagal terhubung ke server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreamers();
  }, [selectedStation]);

  if (!selectedStation) {
    return <div className="p-8 text-zinc-400">Silakan pilih stasiun radio terlebih dahulu.</div>;
  }

  // IP/URL Stream (Bisa diambil dari config global/env atau default ke url panel)
  const streamHost = process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL.replace('https://', '') : "radio.xyz-sa.site";

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center space-x-3 text-zinc-900 dark:text-white transition-colors duration-300">
          <PodcastIcon className="w-8 h-8 text-blue-500" />
          <span>Web DJ & Streamer ({selectedStation.name})</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
          Informasi koneksi untuk menyiarkan audio Anda langsung ke radio menggunakan software seperti VirtualDJ, OBS, atau BUTT.
        </p>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 mb-8">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : streamers.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center shadow-sm dark:shadow-none transition-colors duration-300">
          <PodcastIcon className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-4 transition-colors duration-300" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 transition-colors duration-300">Streamer Tidak Aktif</h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md transition-colors duration-300">
            Akun streamer DJ belum diaktifkan untuk radio ini. Hubungi administrator untuk mengaktifkannya.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm p-6">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-4 flex items-center space-x-2">
              <Server className="w-5 h-5 text-blue-500" />
              <span>Server Configuration</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-500 mb-1">Server IP / Hostname</label>
                <code className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg block text-zinc-900 dark:text-zinc-200">
                  {streamHost}
                </code>
              </div>
              
              <div>
                <label className="block text-sm text-zinc-500 mb-1">Server Port</label>
                <code className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg block text-zinc-900 dark:text-zinc-200">
                  8000 <span className="text-zinc-400 text-xs">(Default Icecast)</span>
                </code>
              </div>
              
              <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 text-sm text-zinc-500">
                Gunakan mount point <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">/radio.mp3</code> atau kosongkan jika software otomatis membaca.
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {streamers.map((streamer) => (
              <div key={streamer.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm p-6 relative">
                {!streamer.is_active && (
                  <div className="absolute top-4 right-4 text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full">
                    INACTIVE
                  </div>
                )}
                
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5 text-emerald-500" />
                  <span>DJ Credentials: {streamer.streamer_username}</span>
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-500 mb-1">Username / Source</label>
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg block text-zinc-900 dark:text-zinc-200">
                      {streamer.streamer_username}
                    </code>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-500 mb-1 flex items-center space-x-1">
                      <Key className="w-3 h-3" />
                      <span>Password</span>
                    </label>
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg block text-zinc-900 dark:text-zinc-200 cursor-help" title="Password diatur oleh Admin AzuraCast">
                      ••••••••
                    </code>
                    <p className="text-xs mt-1 text-zinc-500">Gunakan password yang telah diberikan oleh tim Support kepada Anda saat menyewa server radio.</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
