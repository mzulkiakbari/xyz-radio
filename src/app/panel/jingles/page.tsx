"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Megaphone, Save, Loader2, Play, Trash2, FileAudio, AlertCircle } from "lucide-react";
import { useStation } from "@/components/StationContext";

type MediaFile = {
  id: string;
  path: string;
  text: string;
  artist: string;
  title: string;
  length_text: string;
};

type Playlist = {
  id: number;
  name: string;
  type: string; // "default", "once_per_x_songs", "once_per_x_minutes"
  play_per_songs?: number;
  play_per_minutes?: number;
  weight?: number;
  include_in_requests?: boolean;
};

export default function JinglesPage() {
  const { selectedStation } = useStation();
  
  const [jinglePlaylist, setJinglePlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [scheduleType, setScheduleType] = useState<"once_per_x_songs" | "once_per_x_minutes">("once_per_x_songs");
  const [scheduleValue, setScheduleValue] = useState<number>(3);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  
  const [ytUrl, setYtUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
  
  useEffect(() => {
    if (!selectedStation) return;
    
    const fetchPlaylists = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${backendUrl}/api/azuracast/stations/${selectedStation.id}/playlists?s=${selectedStation.serverUrl}`);
        const json = await res.json();
        
        if (json.success && json.data) {
          const found = json.data.find((p: Playlist) => p.name.toLowerCase() === "jingles & ads");
          if (found) {
            setJinglePlaylist(found);
            if (found.type === "once_per_x_songs" || found.type === "once_per_x_minutes") {
              setScheduleType(found.type);
            }
            setScheduleValue(found.play_per_songs || found.play_per_minutes || 3);
          }
        }
      } catch (err) {
        toast.error("Gagal memuat playlist.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlaylists();
  }, [selectedStation, backendUrl]);

  const handleCreatePlaylist = async () => {
    if (!selectedStation) return;
    
    setIsSaving(true);
    try {
      const payload = {
        name: "Jingles & Ads",
        type: scheduleType,
        play_per_songs: scheduleType === "once_per_x_songs" ? scheduleValue : 0,
        play_per_minutes: scheduleType === "once_per_x_minutes" ? scheduleValue : 0,
        weight: 3,
        include_in_requests: false
      };
      
      const res = await fetch(`${backendUrl}/api/azuracast/stations/${selectedStation.id}/playlists?s=${selectedStation.serverUrl}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (json.success) {
        toast.success("Playlist Jingles & Ads berhasil dibuat!");
        setJinglePlaylist(json.data);
      } else {
        toast.error(json.error || "Gagal membuat playlist");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStation || !jinglePlaylist) return;
    
    setIsSaving(true);
    try {
      const payload = {
        name: jinglePlaylist.name,
        type: scheduleType,
        play_per_songs: scheduleType === "once_per_x_songs" ? scheduleValue : 0,
        play_per_minutes: scheduleType === "once_per_x_minutes" ? scheduleValue : 0,
        include_in_requests: false
      };
      
      const res = await fetch(`${backendUrl}/api/azuracast/stations/${selectedStation.id}/playlists/${jinglePlaylist.id}?s=${selectedStation.serverUrl}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (json.success) {
        toast.success("Pengaturan jadwal berhasil disimpan!");
      } else {
        toast.error(json.error || "Gagal menyimpan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleYoutubeDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStation) return toast.error("Pilih stasiun radio terlebih dahulu!");
    if (!ytUrl) return toast.error("Masukkan URL terlebih dahulu");
    
    setIsDownloading(true);
    setDownloadProgress(0);
    setStatusText("Menghubungkan ke server...");

    try {
      const res = await fetch(`${backendUrl}/api/media/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: ytUrl, 
          stationId: selectedStation.id,
          playlistName: "Jingles & Ads" 
        })
      });

      if (!res.ok || !res.body) throw new Error("Gagal terhubung ke backend");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.progress !== undefined) setDownloadProgress(data.progress);
              if (data.statusText) setStatusText(data.statusText);
              if (data.error) {
                toast.error(`Error: ${data.statusText}`);
                break;
              }
              if (data.success) {
                toast.success("Iklan/Jingle dari YouTube berhasil diunduh!");
                setYtUrl("");
              }
            } catch (e) {
              // Abaikan jika tidak bisa di-parse
            }
          }
        }
      }
    } catch (err) {
      toast.error("Error: " + err);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      setStatusText("");
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedStation) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal adalah 10MB untuk Jingle/Iklan.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    
    const audio = new Audio(URL.createObjectURL(file));
    
    audio.addEventListener("loadedmetadata", async () => {
      if (audio.duration > 180) { // 180 detik = 3 menit
        toast.error("Durasi maksimal adalah 3 menit untuk Jingle/Iklan.");
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Data = (event.target?.result as string).split(',')[1];
          
          const res = await fetch(`${backendUrl}/api/azuracast/stations/${selectedStation.id}/media/upload?s=${selectedStation.serverUrl}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path: file.name,
              file: base64Data,
              playlistName: "Jingles & Ads"
            })
          });
          
          const json = await res.json();
          if (json.success) {
            toast.success("Iklan/Jingle berhasil diunggah!");
          } else {
            toast.error(json.error || "Gagal mengunggah file.");
          }
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setIsUploading(false);
        toast.error("Terjadi kesalahan saat membaca file.");
      }
    });

    audio.addEventListener("error", () => {
      toast.error("Format audio tidak dapat dibaca atau file rusak.");
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  if (!selectedStation) {
    return <div className="p-8 text-zinc-400">Silakan pilih stasiun radio terlebih dahulu.</div>;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-blue-500" />
          Jingles & Ads
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">Sisipkan rekaman suara atau iklan komersial secara otomatis di sela-sela lagu Anda.</p>
      </header>

      {!jinglePlaylist ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8 text-center transition-colors">
          <Megaphone className="w-12 h-12 text-blue-500 mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Playlist Iklan Belum Dibuat</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-md mx-auto">
            Sistem belum mendeteksi adanya playlist khusus untuk iklan pada radio Anda. Klik tombol di bawah untuk membuat dan mengaktifkan fitur ini.
          </p>
          <button
            onClick={handleCreatePlaylist}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/50 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Megaphone className="w-5 h-5" />}
            Aktifkan Jingles & Ads
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm transition-colors">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Pengaturan Jadwal</h2>
            <form onSubmit={handleUpdatePlaylist} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Tipe Jeda</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setScheduleType("once_per_x_songs")}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      scheduleType === "once_per_x_songs" 
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    Setiap X Lagu
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleType("once_per_x_minutes")}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      scheduleType === "once_per_x_minutes" 
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    Setiap X Menit
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Interval ({scheduleType === "once_per_x_songs" ? "Jumlah Lagu" : "Menit"})
                </label>
                <input
                  type="number"
                  min="1"
                  value={scheduleValue}
                  onChange={(e) => setScheduleValue(parseInt(e.target.value) || 1)}
                  className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
                <p className="text-xs text-zinc-500 mt-2">
                  Iklan akan diputar {scheduleType === "once_per_x_songs" ? `setelah ${scheduleValue} lagu diputar` : `setiap ${scheduleValue} menit siaran berjalan`}.
                </p>
              </div>
              
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-semibold transition-all shadow-md shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Simpan Jadwal
              </button>
            </form>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm transition-colors flex flex-col">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Tambahkan Iklan Baru</h2>
            
            <div className="space-y-6 flex-1">
              {/* Upload Local */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-6 bg-zinc-50 dark:bg-black/50">
                <FileAudio className="w-10 h-10 text-zinc-400 mb-3" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center mb-4">
                  Pilih file audio (MP3) untuk diunggah sebagai Iklan / Jingle.
                </p>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isDownloading}
                  className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                  {isUploading ? "Mengunggah..." : "Pilih File Audio"}
                </button>
              </div>

              {/* Batas */}
              <div className="flex items-center space-x-4">
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">ATAU</span>
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
              </div>

              {/* YouTube Link */}
              <form onSubmit={handleYoutubeDownload} className="space-y-3">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Unduh langsung dari tautan YouTube:</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm"
                  />
                  <button
                    type="submit"
                    disabled={isDownloading || !ytUrl || isUploading}
                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Unduh
                  </button>
                </div>
                {isDownloading && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>{statusText}</span>
                      <span>{downloadProgress}%</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-red-500 h-1.5 transition-all duration-300"
                        style={{ width: `${downloadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </form>
            </div>
            
            <div className="mt-6 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Audio yang ditambahkan akan otomatis tergabung ke dalam playlist <strong>Jingles & Ads</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
