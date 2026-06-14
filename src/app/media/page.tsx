"use client";

import { useState, useEffect } from "react";
import { Upload, Play, MoreVertical, Search, FileAudio, MonitorPlay, Loader2, AlertCircle } from "lucide-react";
import { useStation } from "@/components/StationContext";

type MediaFile = {
  id: string;
  path: string;
  text: string;
  artist: string;
  title: string;
  length_text: string;
};

export default function MediaPage() {
  const { selectedStation } = useStation();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"local" | "youtube">("local");
  
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [ytUrl, setYtUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!selectedStation) return;

    const fetchMedia = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:3001/api/azuracast/stations/${selectedStation.id}/media`);
        const json = await res.json();
        
        if (json.success) {
          setMediaFiles(json.data || []);
        } else {
          setError(json.error || "Gagal memuat media.");
        }
      } catch (err) {
        setError("Gagal terhubung ke backend server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedia();
  }, [selectedStation]);

  const handleDownload = async () => {
    if (!ytUrl) return alert("Masukkan URL terlebih dahulu");
    setIsDownloading(true);
    try {
      const res = await fetch("http://localhost:3001/api/media/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: ytUrl })
      });
      const data = await res.json();
      if (data.success) {
        alert("Download selesai! (Fitur push ke Azuracast akan menyusul)");
        setIsUploadModalOpen(false);
        setYtUrl("");
      } else {
        alert("Download gagal: " + data.error);
      }
    } catch (err) {
      alert("Error: " + err);
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredMedia = mediaFiles.filter(m => 
    (m.title || m.text || m.path).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!selectedStation) {
    return <div className="p-8 text-zinc-400">Silakan pilih stasiun radio terlebih dahulu.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Header & Controls */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Media Library</h1>
          <p className="text-zinc-400">Kelola semua file audio untuk stasiun {selectedStation.name}</p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-900/50"
        >
          <Upload className="w-5 h-5" />
          <span>Upload Media</span>
        </button>
      </header>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Cari lagu, artis, atau album..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 mb-8 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Media List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <div className="col-span-6 md:col-span-5">File / Title</div>
          <div className="hidden md:block col-span-4">Artist</div>
          <div className="col-span-4 md:col-span-2 text-right">Duration</div>
          <div className="col-span-2 md:col-span-1 text-right">Actions</div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            {searchQuery ? "Tidak ada media yang cocok dengan pencarian." : "Belum ada media di stasiun ini."}
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {filteredMedia.map((file, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-zinc-800/30 transition-colors group">
                <div className="col-span-6 md:col-span-5 flex items-center space-x-4">
                  <button className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors flex-shrink-0">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{file.title || file.text || file.path}</p>
                    <p className="text-zinc-500 text-sm truncate">{file.path}</p>
                  </div>
                </div>
                <div className="hidden md:block col-span-4 text-zinc-400 truncate">
                  {file.artist || "Unknown Artist"}
                </div>
                <div className="col-span-4 md:col-span-2 text-right text-zinc-400 font-medium">
                  {file.length_text || "--:--"}
                </div>
                <div className="col-span-2 md:col-span-1 flex justify-end">
                  <button className="p-2 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-zinc-800">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h2 className="text-xl font-bold">Upload Media</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-zinc-500 hover:text-white">
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex p-1 bg-black rounded-xl mb-6">
                <button
                  onClick={() => setActiveTab("local")}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === "local" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  Local File
                </button>
                <button
                  onClick={() => setActiveTab("youtube")}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === "youtube" ? "bg-red-500 text-white" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  YouTube / Spotify
                </button>
              </div>

              {activeTab === "local" && (
                <div className="border-2 border-dashed border-zinc-700 hover:border-blue-500 bg-black/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileAudio className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">Click to Browse</h3>
                  <p className="text-zinc-500 text-sm">or drag and drop audio files here</p>
                  <p className="text-zinc-600 text-xs mt-4">Supports MP3, WAV, FLAC</p>
                </div>
              )}

              {activeTab === "youtube" && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-red-400 mb-4 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                    <MonitorPlay className="w-6 h-6 flex-shrink-0" />
                    <p className="text-sm font-medium">Download audio directly from YouTube or Spotify URLs.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Media URL</label>
                    <input
                      type="text"
                      placeholder="https://youtube.com/watch?v=..."
                      value={ytUrl}
                      onChange={(e) => setYtUrl(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <button 
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isDownloading ? "Downloading..." : "Extract Audio"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
