"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Upload, Play, Square, MoreVertical, Search, FileAudio, MonitorPlay, Loader2, AlertCircle, Edit2, Trash2, Headphones, Radio, SkipForward, LogOut } from "lucide-react";

type MediaFile = {
  id: string;
  path: string;
  text: string;
  artist: string;
  title: string;
  length_text: string;
  playlists?: any[];
};

export default function EventPage() {
  const router = useRouter();
  const [eventName, setEventName] = useState("Event");
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const stationId = 8;
  const serverUrl = "https://s1.radio.xyz-sa.site";

  const [playlists, setPlaylists] = useState<any[]>([]);

  const [uploadPlaylist, setUploadPlaylist] = useState<string>("default");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editPlaylistName, setEditPlaylistName] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"local" | "youtube">("local");
  
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);
  const [editingMedia, setEditingMedia] = useState<MediaFile | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deletingMedia, setDeletingMedia] = useState<MediaFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [nowPlaying, setNowPlaying] = useState<any>(null);
  const [isSkipping, setIsSkipping] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("event_token");
    const name = localStorage.getItem("event_name");
    if (!token) {
      router.push("/event/login");
    } else {
      setEventName(name || "Event");
    }
  }, [router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [ytUrl, setYtUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);
  const [localUploadProgress, setLocalUploadProgress] = useState(0);

  const fetchPlaylists = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/azuracast/stations/${stationId}/playlists?s=${serverUrl}&t=${Date.now()}`);
      const json = await res.json();
      if (json.success && json.data) setPlaylists(json.data);
    } catch (err) {}
  };

  const fetchMedia = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/azuracast/stations/${stationId}/media?s=${serverUrl}&t=${Date.now()}`);
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

  const fetchNowPlaying = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/azuracast/stations/${stationId}/nowplaying?s=${serverUrl}`);
      const json = await res.json();
      if (json.success && json.data) {
        setNowPlaying(json.data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchPlaylists();
    fetchMedia();
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 10000);
    return () => clearInterval(interval);
  }, []);

  const reloadMedia = async () => {
    fetchMedia();
    setSelectedMediaIds([]);
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/event/skip`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast.success("Berhasil me-skip lagu!");
        fetchNowPlaying();
      } else {
        toast.error(json.error || "Gagal me-skip lagu");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setIsSkipping(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("event_token");
    localStorage.removeItem("event_name");
    router.push("/event/login");
  };

  const handleStartStopEvent = async (action: "start" | "stop") => {
    setIsActionLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/event/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, eventName })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(action === "start" ? "Event Berhasil Dimulai!" : "Event Berhasil Dihentikan!");
        if (action === "stop") {
          setMediaFiles([]);
          setPlaylists([]);
          fetchPlaylists();
        }
      } else {
        toast.error("Gagal " + action + " event: " + json.error);
      }
    } catch (err) {
      toast.error("Gagal menghubungi server");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    setIsCreatingPlaylist(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/azuracast/stations/${stationId}/playlists?s=${serverUrl}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlaylistName, is_enabled: false, playback_order: "sequential" })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Playlist berhasil dibuat!");
        setNewPlaylistName("");
        fetchPlaylists();
      } else {
        toast.error("Gagal membuat playlist");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const handlePlayPlaylist = async (targetPlaylistId: string, targetPlaylistName: string) => {
    setIsActionLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      
      const res = await fetch(`${backendUrl}/api/azuracast/stations/${stationId}/playlists/${targetPlaylistId}/activate?s=${serverUrl}`, {
        method: "PUT"
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Memutar Playlist " + targetPlaylistName);
        fetchPlaylists();
      } else {
        toast.error("Gagal memutar playlist");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditPlaylistSave = async (playlistId: string) => {
    if (!editPlaylistName.trim()) return;
    setIsActionLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/azuracast/stations/${stationId}/playlists/${playlistId}?s=${serverUrl}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editPlaylistName })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Nama playlist berhasil diubah!");
        setEditingPlaylistId(null);
        fetchPlaylists();
      } else {
        toast.error("Gagal mengubah nama playlist: " + (json.error || "Unknown error"));
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditSave = async () => {
    if (!editingMedia || !editTitle.trim()) return;
    setIsProcessing(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/azuracast/stations/${stationId}/media/${editingMedia.id}?s=${serverUrl}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessToast("Judul lagu berhasil diperbarui!");
        setTimeout(() => setSuccessToast(""), 3000);
        setEditingMedia(null);
        reloadMedia();
      } else {
        toast.error("Gagal mengupdate judul: " + (json.error || "Unknown error"));
      }
    } catch(err) {
      toast.error("Error: " + err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMedia) return;
    setIsProcessing(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/azuracast/stations/${stationId}/media/${deletingMedia.id}?s=${serverUrl}`, {
        method: "DELETE"
      });
      const json = await res.json();
      if (json.success) {
        setSuccessToast("Lagu berhasil dihapus!");
        setTimeout(() => setSuccessToast(""), 3000);
        setDeletingMedia(null);
        reloadMedia();
      } else {
        toast.error("Gagal menghapus lagu: " + (json.error || "Unknown error"));
      }
    } catch(err) {
      toast.error("Error: " + err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchDeleteConfirm = async () => {
    if (selectedMediaIds.length === 0) return;
    setIsBatchDeleting(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      let successCount = 0;
      let failCount = 0;
      await Promise.all(
        selectedMediaIds.map(async (id) => {
          try {
            const res = await fetch(`${backendUrl}/api/azuracast/stations/${stationId}/media/${id}?s=${serverUrl}`, {
              method: "DELETE"
            });
            const json = await res.json();
            if (json.success) successCount++;
            else failCount++;
          } catch (err) {
            failCount++;
          }
        })
      );
      if (successCount > 0) {
        setSuccessToast(`${successCount} lagu berhasil dihapus!`);
        setTimeout(() => setSuccessToast(""), 3000);
      }
      if (failCount > 0) toast.error(`${failCount} lagu gagal dihapus.`);
      setShowBatchDeleteConfirm(false);
      setSelectedMediaIds([]);
      reloadMedia();
    } catch(err) {
      toast.error("Error: " + err);
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (!ytUrl) return toast.error("Masukkan URL terlebih dahulu");
    setIsDownloading(true);
    setDownloadProgress(0);
    setStatusText("Menghubungkan ke server...");
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/media/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: ytUrl, stationId, playlistName: uploadPlaylist, serverUrl })
      });
      if (!res.ok || !res.body) throw new Error("Gagal terhubung ke backend");
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let isSuccess = false;
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
                isSuccess = true;
                setSuccessToast("Berhasil! Lagu baru akan diputar pada antrean berikutnya.");
                setTimeout(() => setSuccessToast(""), 5000);
                setIsUploadModalOpen(false);
                setYtUrl("");
              }
            } catch (e) {}
          }
        }
      }
      if (isSuccess) reloadMedia();
    } catch (err) {
      toast.error("Error: " + err);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      setStatusText("");
    }
  };

  const handleLocalUpload = async (file: File) => {
    if (!file.type.startsWith('audio/')) return toast.error("Hanya file audio yang diizinkan!");
    if (file.size > 20 * 1024 * 1024) return toast.error("Ukuran file terlalu besar! Maksimal 20MB.");
    setIsUploadingLocal(true);
    setLocalUploadProgress(0);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        if (!result) return;
        const base64Data = result.split(',')[1];
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        const progressInterval = setInterval(() => {
          setLocalUploadProgress(prev => prev >= 90 ? prev : prev + 10);
        }, 300);
        const res = await fetch(`${backendUrl}/api/azuracast/stations/${stationId}/media/upload?s=${serverUrl}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: file.name.replace(/\s+/g, '_'), file: base64Data, playlistName: uploadPlaylist })
        });
        clearInterval(progressInterval);
        const json = await res.json();
        if (json.success) {
          setLocalUploadProgress(100);
          setSuccessToast("File audio berhasil diupload!");
          setTimeout(() => setSuccessToast(""), 5000);
          setIsUploadModalOpen(false);
          reloadMedia();
        } else {
          toast.error(`Gagal upload file: ${json.error}`);
        }
        setIsUploadingLocal(false);
      };
      reader.onerror = () => { toast.error("Gagal membaca file"); setIsUploadingLocal(false); };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error("Error: " + err);
      setIsUploadingLocal(false);
    }
  };

  const filteredMedia = mediaFiles.filter(m => {
    const matchesSearch = (m.title || m.text || m.path).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white flex items-center gap-3">
            <Radio className="w-8 h-8 text-indigo-500" />
            {eventName}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">Event Radio Stream Panel</p>
        </div>
        <div className="flex items-center gap-3">
          {nowPlaying?.station?.name === eventName ? (
            <button
              onClick={() => handleStartStopEvent("stop")}
              disabled={isActionLoading}
              className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all border border-red-200 dark:border-red-900/30 disabled:opacity-50"
            >
              {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MonitorPlay className="w-5 h-5" />}
              <span>Stop Event</span>
            </button>
          ) : (
            <button
              onClick={() => handleStartStopEvent("start")}
              disabled={isActionLoading}
              className="bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400 px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all border border-green-200 dark:border-green-900/30 disabled:opacity-50"
            >
              {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              <span>Start Event</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-400 px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all border border-zinc-200 dark:border-zinc-700"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Now Playing Card */}
      {nowPlaying && (
        <div className="mb-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="flex items-center gap-6 relative z-10 w-full">
            <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg border border-white/30 flex-shrink-0">
              <Headphones className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-200 mb-1">Now Playing</h3>
              <p className="text-2xl font-bold truncate mb-1">{nowPlaying.now_playing?.song?.title || nowPlaying.now_playing?.song?.text || "Tidak ada lagu"}</p>
              <p className="text-blue-200 truncate">{nowPlaying.now_playing?.song?.artist || "Mulai memutar lagu dari Library"}</p>
            </div>
          </div>
          <div className="relative z-10 flex-shrink-0">
            <button
              onClick={handleSkip}
              disabled={isSkipping}
              className="bg-white text-indigo-600 hover:bg-zinc-100 px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSkipping ? <Loader2 className="w-5 h-5 animate-spin" /> : <SkipForward className="w-5 h-5" />}
              <span>Skip Song</span>
            </button>
          </div>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Media Library</h2>
          <p className="text-zinc-500 text-sm">Kelola file audio event kamu</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <input 
              type="text" 
              placeholder="New Playlist..." 
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-48 bg-white dark:bg-zinc-900 text-sm px-3 py-2 rounded-lg border-none focus:ring-0 outline-none"
            />
            <button
              onClick={handleCreatePlaylist}
              disabled={isCreatingPlaylist || !newPlaylistName.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {isCreatingPlaylist ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Add New Playlist"}
            </button>
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-900/50"
          >
            <Upload className="w-5 h-5" />
            <span className="whitespace-nowrap">Upload Media</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
        <input
          type="text"
          placeholder="Cari lagu, artis, atau album..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-4 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors shadow-sm dark:shadow-none"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 mb-8 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Batch Action Bar */}
      {selectedMediaIds.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-4 mb-6 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <span className="font-semibold">{selectedMediaIds.length} item dipilih</span>
          </div>
          <button
            onClick={() => setShowBatchDeleteConfirm(true)}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Hapus Terpilih
          </button>
        </div>
      )}

      {/* Playlists & Media Cards */}
      <div className="space-y-6 mb-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          playlists.map((playlist) => {
            const playlistMedia = filteredMedia.filter(m => m.playlists && m.playlists.some((p: any) => Number(p.id) === Number(playlist.id)));
            const isDefault = playlist.name.toLowerCase() === "default";
            
            return (
              <div key={playlist.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden transition-colors duration-300">
                <div className="bg-zinc-50 dark:bg-zinc-950 p-5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handlePlayPlaylist(playlist.id, playlist.name)}
                      disabled={isActionLoading || playlist.is_enabled}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm flex-shrink-0 disabled:opacity-50 ${
                        playlist.is_enabled 
                          ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 cursor-default" 
                          : "bg-emerald-100 hover:bg-emerald-200 text-emerald-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400"
                      }`}
                      title={playlist.is_enabled ? `Sedang Diputar: ${playlist.name}` : `Putar Playlist ${playlist.name}`}
                    >
                      {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : playlist.is_enabled ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-1" />}
                    </button>
                    
                    {editingPlaylistId === playlist.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editPlaylistName}
                          onChange={(e) => setEditPlaylistName(e.target.value)}
                          className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 w-48"
                        />
                        <button onClick={() => handleEditPlaylistSave(playlist.id)} className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold px-2">Save</button>
                        <button onClick={() => setEditingPlaylistId(null)} className="text-zinc-500 hover:text-zinc-700 px-2">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                          {playlist.name}
                          {isDefault && <span className="text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded">AutoDJ Utama</span>}
                        </h3>
                        <button
                          onClick={() => {
                            setEditingPlaylistId(playlist.id);
                            setEditPlaylistName(playlist.name);
                          }}
                          className="text-zinc-400 hover:text-indigo-500 transition-colors p-1"
                          title="Edit Playlist Name"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-medium text-zinc-500">
                    {playlistMedia.length} Tracks
                    <span className="ml-2 text-xs text-red-500">
                      (Total media: {filteredMedia.length}, matches ID {playlist.id}: {filteredMedia.filter(m => m.playlists && m.playlists.some((p: any) => Number(p.id) === Number(playlist.id))).length})
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {playlistMedia.length === 0 ? (
                    <div className="p-6 text-center text-zinc-500 text-sm">
                      Belum ada lagu di playlist ini.
                    </div>
                  ) : (
                    playlistMedia.map((file: any) => (
                      <div key={file.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <input 
                            type="checkbox" 
                            checked={selectedMediaIds.includes(file.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedMediaIds(prev => [...prev, file.id]);
                              else setSelectedMediaIds(prev => prev.filter(id => id !== file.id));
                            }}
                            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 dark:bg-zinc-800 cursor-pointer flex-shrink-0"
                          />
                          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                            <FileAudio className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-zinc-900 dark:text-white font-medium truncate text-sm">{file.title || file.text || file.path}</p>
                            <p className="text-zinc-500 text-xs truncate">{file.artist || "Unknown Artist"}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end space-x-4 mt-3 sm:mt-0">
                          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            {file.length_text || "--:--"}
                          </div>
                          <div className="flex items-center relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropdownOpenId(dropdownOpenId === file.id ? null : file.id);
                              }}
                              className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            {dropdownOpenId === file.id && (
                              <div className="absolute right-0 top-10 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                                <button 
                                  onClick={() => { setEditTitle(file.title || file.text || ""); setEditingMedia(file); setDropdownOpenId(null); }}
                                  className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center space-x-2"
                                >
                                  <Edit2 className="w-4 h-4" /><span>Edit Title</span>
                                </button>
                                <button 
                                  onClick={() => { setDeletingMedia(file); setDropdownOpenId(null); }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                                >
                                  <Trash2 className="w-4 h-4" /><span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm transition-colors duration-300">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl transition-colors duration-300">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Upload Media</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Pilih Playlist Tujuan</label>
                <select
                  value={uploadPlaylist}
                  onChange={(e) => setUploadPlaylist(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="default">default (AutoDJ Utama)</option>
                  {playlists.filter(p => p.name.toLowerCase() !== "default").map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex p-1 bg-zinc-100 dark:bg-black rounded-xl mb-6 transition-colors duration-300">
                <button
                  onClick={() => setActiveTab("local")}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === "local" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  Local File
                </button>
                <button
                  onClick={() => setActiveTab("youtube")}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === "youtube" ? "bg-red-500 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  YouTube / Spotify
                </button>
              </div>

              {activeTab === "local" && (
                <div 
                  className={`border-2 border-dashed ${isDragging ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-black/50"} hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group`}
                  onClick={() => !isUploadingLocal && fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (!isUploadingLocal && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleLocalUpload(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="audio/*" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleLocalUpload(e.target.files[0]);
                      }
                    }}
                  />
                  {isUploadingLocal ? (
                    <div className="flex flex-col items-center space-y-4 w-full">
                      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                      <div className="w-full max-w-xs">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">Uploading...</span>
                          <span className="font-bold text-indigo-500">{localUploadProgress}%</span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: `${localUploadProgress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileAudio className="w-8 h-8 text-indigo-500" />
                      </div>
                      <h3 className="font-bold text-lg mb-1 text-zinc-900 dark:text-white transition-colors duration-300">Click to Browse</h3>
                      <p className="text-zinc-500 text-sm">or drag and drop audio files here</p>
                      <p className="text-zinc-400 dark:text-zinc-600 text-xs mt-4 transition-colors duration-300">Supports MP3, WAV, FLAC, M4A, OGG</p>
                    </>
                  )}
                </div>
              )}

              {activeTab === "youtube" && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-red-400 mb-4 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                    <MonitorPlay className="w-6 h-6 flex-shrink-0" />
                    <p className="text-sm font-medium">Download audio directly from YouTube or Spotify URLs.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2 transition-colors duration-300">Media URL</label>
                    <input
                      type="text"
                      placeholder="https://youtube.com/watch?v=..."
                      value={ytUrl}
                      onChange={(e) => setYtUrl(e.target.value)}
                      disabled={isDownloading}
                      className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50"
                    />
                  </div>

                  {isDownloading && (
                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium transition-colors duration-300">{statusText || "Memproses..."}</span>
                        <span className="text-sm font-bold text-red-500">{downloadProgress}%</span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-black rounded-full h-2.5 overflow-hidden transition-colors duration-300">
                        <div 
                          className="bg-red-500 h-2.5 rounded-full transition-all duration-300 ease-out" 
                          style={{ width: `${downloadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isDownloading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Downloading...</span>
                      </>
                    ) : "Extract Audio"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm transition-colors duration-300">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl transition-colors duration-300">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Edit Media Title</h2>
              <button onClick={() => setEditingMedia(null)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2 transition-colors duration-300">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={isProcessing}
                className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 mb-6"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditingMedia(null)}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={isProcessing || !editTitle.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-900/50 disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm transition-colors duration-300">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl transition-colors duration-300">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
              <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Hapus Media
              </h2>
              <button onClick={() => setDeletingMedia(null)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-zinc-600 dark:text-zinc-300 mb-6">
                Apakah Anda yakin ingin menghapus <strong>{deletingMedia.title || deletingMedia.text || deletingMedia.path}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingMedia(null)}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isProcessing}
                  className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-red-900/50 disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm transition-colors duration-300">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl transition-colors duration-300">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
              <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Hapus {selectedMediaIds.length} Media
              </h2>
              <button onClick={() => setShowBatchDeleteConfirm(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-zinc-600 dark:text-zinc-300 mb-6">
                Apakah Anda yakin ingin menghapus <strong>{selectedMediaIds.length}</strong> media yang dipilih? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowBatchDeleteConfirm(false)}
                  disabled={isBatchDeleting}
                  className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleBatchDeleteConfirm}
                  disabled={isBatchDeleting}
                  className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-red-900/50 disabled:opacity-50 flex items-center gap-2"
                >
                  {isBatchDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ya, Hapus Semua
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-4 rounded-xl shadow-[0_10px_40px_rgba(34,197,94,0.3)] font-medium flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          {successToast}
        </div>
      )}
    </div>
  );
}
