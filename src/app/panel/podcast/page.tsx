"use client";

import { useEffect, useState } from "react";
import { useStation } from "@/components/StationContext";
import { Podcast as PodcastIcon, Loader2, PlayCircle, Clock } from "lucide-react";

type PodcastData = {
  id: string;
  title: string;
  description: string;
  episodes: number;
  art?: string;
  art_updated_at?: number;
};

export default function PodcastPage() {
  const { selectedStation } = useStation();
  const [podcasts, setPodcasts] = useState<PodcastData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedStation) return;

    const fetchPodcasts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        const res = await fetch(`${backendUrl}/api/azuracast/stations/${selectedStation.id}/podcasts`);
        const json = await res.json();
        
        if (json.success) {
          setPodcasts(json.data);
        } else {
          setError(json.error || "Gagal memuat podcast.");
        }
      } catch (err) {
        setError("Gagal terhubung ke server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPodcasts();
  }, [selectedStation]);

  if (!selectedStation) {
    return <div className="p-8 text-zinc-400">Silakan pilih stasiun radio terlebih dahulu.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center space-x-3 text-zinc-900 dark:text-white transition-colors duration-300">
          <PodcastIcon className="w-8 h-8 text-blue-500" />
          <span>Podcasts ({selectedStation.name})</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
          Kelola episode podcast langsung dari server AzuraCast Anda.
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
      ) : podcasts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center shadow-sm dark:shadow-none transition-colors duration-300">
          <PodcastIcon className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-4 transition-colors duration-300" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 transition-colors duration-300">Belum ada Podcast</h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md transition-colors duration-300">
            Anda belum memiliki podcast yang di-publish di stasiun radio ini. Silakan tambahkan melalui dashboard AzuraCast utama.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((podcast) => (
            <div key={podcast.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-colors group shadow-sm dark:shadow-none">
              <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 relative flex items-center justify-center overflow-hidden transition-colors duration-300">
                {podcast.art ? (
                  <img src={podcast.art} alt={podcast.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <PodcastIcon className="w-16 h-16 text-zinc-400 dark:text-zinc-700 group-hover:scale-110 transition-transform duration-500" />
                )}
                <button className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <PlayCircle className="w-16 h-16 text-white drop-shadow-lg" />
                </button>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-2 line-clamp-1 transition-colors duration-300">{podcast.title || "Untitled Podcast"}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-2 mb-4 transition-colors duration-300">{podcast.description || "Tidak ada deskripsi."}</p>
                <div className="flex items-center space-x-4 text-xs text-zinc-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{podcast.episodes} Episodes</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
