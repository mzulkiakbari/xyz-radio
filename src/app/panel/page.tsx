"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Copy, Check, Headphones, Radio, Edit, Link as LinkIcon, MoreVertical, Search, Edit2, Trash2, Upload, Play, Loader2, Music, Mic, Settings, ArrowLeft } from "lucide-react";
import { useStation } from "@/components/StationContext";

export default function OverviewPage() {
  const router = useRouter();
  const { selectedStation } = useStation();
  
  const [radioId, setRadioId] = useState<string | null>(null);

  useEffect(() => {
    const resolveRadioId = async () => {
        if (!selectedStation) {
            setRadioId(null);
            return;
        }
        
        let serverParam = "";
        if (selectedStation.serverUrl) {
            if (selectedStation.serverUrl.includes("s1.radio")) {
                serverParam = "&s=s1";
            } else if (!selectedStation.serverUrl.includes("radio.xyz-sa.site") || selectedStation.serverUrl !== "https://radio.xyz-sa.site") {
                const rawDomain = selectedStation.serverUrl.replace("https://", "").replace("http://", "");
                if (rawDomain !== "radio.xyz-sa.site") {
                    serverParam = `&s=${rawDomain}`;
                }
            }
        }
        
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
            // Hit the existing Express endpoint to get UUID
            const res = await fetch(`${backendUrl}/api/radio/resolve-id?id=${selectedStation.id}${serverParam}`);
            const json = await res.json();
            if (json.success && json.uuid) {
                setRadioId(json.uuid);
            } else {
                setRadioId(null);
            }
        } catch (e) {
            console.error("Gagal resolve UUID:", e);
            setRadioId(null);
        }
    };
    resolveRadioId();
  }, [selectedStation]);

  const [copied, setCopied] = useState(false);
  const [appUrl, setAppUrl] = useState("");

  const [state, setState] = useState<any>(null);
  const [queues, setQueues] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<"lagu" | "jingle">("lagu");
  
  // Pagination
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  
  // Modals & Action State
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [showPlayModal, setShowPlayModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<{trackId: string, title: string} | null>(null);
  
  // Upload State
  const [uploadTab, setUploadTab] = useState<"local" | "youtube">("local");
  const [uploadFile, setUploadFile] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadArtist, setUploadArtist] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit / Delete State
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);
  const [editingTrack, setEditingTrack] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");

  // Jingle Settings
  const [jingleInterval, setJingleInterval] = useState(3);
  const [jingleCount, setJingleCount] = useState(1);
  const [showJingleSettings, setShowJingleSettings] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  useEffect(() => {
    setAppUrl(process.env.NEXT_PUBLIC_APP_URL || window.location.origin);
  }, []);

  const fetchPlaylists = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!radioId) return;
    setIsLoadingMore(true);
    const isJingle = activeTab === 'jingle';
    const limit = 25;
    const from = pageNum * limit;
    const to = from + limit - 1;
    
    const { data } = await supabase
        .from("radio_playlist_items_v2")
        .select("id, is_jingle, radio_tracks_v2(*)")
        .eq("radio_id", radioId)
        .eq("is_jingle", isJingle)
        .order('created_at', { ascending: false })
        .range(from, to);
        
    if (data) {
        if (append) {
            setPlaylists(prev => {
                const newIds = new Set(data.map(d => d.id));
                const filteredPrev = prev.filter(p => !newIds.has(p.id));
                return [...filteredPrev, ...data];
            });
        } else {
            setPlaylists(data);
        }
        setHasMore(data.length === limit);
    }
    setIsLoadingMore(false);
  }, [radioId, activeTab]);

  useEffect(() => {
      if (radioId) {
          setPage(0);
          setHasMore(true);
          fetchPlaylists(0, false);
      }
  }, [radioId, activeTab, fetchPlaylists]);

  // Infinite Scroll Observer
  useEffect(() => {
      const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
              setPage(p => p + 1);
          }
      }, { threshold: 0.1 });
      
      const currentRef = loaderRef.current;
      if (currentRef) observer.observe(currentRef);
      return () => { if (currentRef) observer.unobserve(currentRef); };
  }, [hasMore, isLoadingMore]);

  useEffect(() => {
      if (page > 0) fetchPlaylists(page, true);
  }, [page, fetchPlaylists]);

  useEffect(() => {
    if (!radioId) return;
    fetchData(radioId);
    fetchJingleSettings(radioId);

    const channel = supabase.channel(`radio_${radioId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "radio_states_v2", filter: `radio_id=eq.${radioId}` }, (payload) => {
          setState(payload.new);
          fetchCurrentTrack((payload.new as any).current_track_id);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "radio_queues_v2", filter: `radio_id=eq.${radioId}` }, () => fetchQueues(radioId))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "radio_playlist_items_v2", filter: `radio_id=eq.${radioId}` }, (payload) => {
          setPlaylists(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "radio_playlist_items_v2", filter: `radio_id=eq.${radioId}` }, () => {
          setPage(0);
          fetchPlaylists(0, false);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [radioId, fetchPlaylists]);

  const fetchJingleSettings = async (id: string) => {
      const { data } = await supabase.from('radio_orders').select('jingle_interval, jingle_count').eq('id', id).single();
      if (data) {
          if (data.jingle_interval) setJingleInterval(data.jingle_interval);
          if (data.jingle_count) setJingleCount(data.jingle_count);
      }
  };

  const saveJingleSettings = async () => {
      setIsProcessing(true);
      const { error } = await supabase.from('radio_orders').update({ jingle_interval: jingleInterval, jingle_count: jingleCount }).eq('id', radioId);
      setIsProcessing(false);
      if (error) toast.error("Gagal menyimpan pengaturan jingle");
      else toast.success("Pengaturan jingle disimpan!");
      setShowJingleSettings(false);
  };

  const fetchData = async (id: string) => {
    const { data: st } = await supabase.from("radio_states_v2").select("*").eq("radio_id", id).single();
    if (st) {
        setState(st);
        if (st.current_track_id) fetchCurrentTrack(st.current_track_id);
    }
    await fetchQueues(id);
  };

  const fetchQueues = async (id: string = radioId!) => {
    const { data: q } = await supabase.from("radio_queues_v2").select("*, radio_tracks_v2(*)").eq("radio_id", id).order("position", { ascending: true });
    if (q) setQueues(q);
  };

  const fetchCurrentTrack = async (trackId: string) => {
    if (!trackId) return setCurrentTrack(null);
    const { data: t } = await supabase.from("radio_tracks_v2").select("*").eq("id", trackId).single();
    if (t) setCurrentTrack(t);
  };

  const handleSkip = async () => {
      if (!radioId) return;
      const res = await fetch(`${backendUrl}/v2/action/${radioId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'skip' })
      });
      const json = await res.json();
      if (json.success) toast.success("Skip lagu berhasil");
      else toast.error("Gagal skip: " + json.message);
  };

  const handlePlayAction = async (action: 'now' | 'queue') => {
      if (!radioId || !selectedTrack) return;
      if (action === 'queue') {
          await supabase.from("radio_queues_v2").insert({ radio_id: radioId, track_id: selectedTrack.id, requested_by: "Web DJ", position: queues.length + 1 });
          toast.success("Berhasil dimasukkan ke antrian");
      } else if (action === 'now') {
          await supabase.from("radio_queues_v2").insert({ radio_id: radioId, track_id: selectedTrack.id, requested_by: "Web DJ", position: -1 });
          await handleSkip();
      }
      setShowPlayModal(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = (reader.result as string).split(',')[1];
              setUploadFile(base64String);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleUploadLocal = async () => {
      if (!uploadFile) return toast.error("Pilih file dulu!");
      setIsProcessing(true);
      try {
          const res = await fetch(`${backendUrl}/v2/media/${radioId}/upload`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ file: uploadFile, title: uploadTitle, artist: uploadArtist, is_jingle: activeTab === 'jingle' })
          });
          const json = await res.json();
          if (json.success) {
              toast.success("Berhasil diupload!");
              setShowUploadModal(false);
              setUploadFile(null); setUploadTitle(""); setUploadArtist("");
              if (fileInputRef.current) fileInputRef.current.value = "";
          } else toast.error(json.error);
      } catch (e) {
          toast.error("Error network");
      }
      setIsProcessing(false);
  };

  const handleDownloadYt = async () => {
      if (!ytUrl) return toast.error("Masukkan URL yt-dlp!");
      setIsProcessing(true);
      try {
          const res = await fetch(`${backendUrl}/v2/media/${radioId}/download`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: ytUrl, is_jingle: activeTab === 'jingle' })
          });
          const json = await res.json();
          if (json.success) {
              toast.success("Berhasil diunduh!");
              setShowUploadModal(false);
              setYtUrl("");
          } else toast.error(json.error);
      } catch (e) {
          toast.error("Error network");
      }
      setIsProcessing(false);
  };

  const handleDeleteConfirm = async () => {
      if (!trackToDelete) return;
      setIsProcessing(true);
      try {
          const res = await fetch(`${backendUrl}/v2/media/${radioId}/${trackToDelete.trackId}`, { method: 'DELETE' });
          const json = await res.json();
          if (json.success) {
              toast.success("Berhasil dihapus");
              setPlaylists(prev => prev.filter(p => p.radio_tracks_v2?.id !== trackToDelete.trackId));
          } else {
              toast.error(json.error);
          }
      } catch (e) { toast.error("Error network"); }
      setIsProcessing(false);
      setTrackToDelete(null);
  };

  const handleEditSave = async () => {
      setIsProcessing(true);
      try {
          const res = await fetch(`${backendUrl}/v2/media/${radioId}/${editingTrack.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: editTitle, artist: editArtist })
          });
          const json = await res.json();
          if (json.success) {
              toast.success("Berhasil diupdate");
              setEditingTrack(null);
              setPlaylists(prev => prev.map(p => p.radio_tracks_v2?.id === editingTrack.id ? { ...p, radio_tracks_v2: { ...p.radio_tracks_v2, title: editTitle, artist: editArtist } } : p));
          } else toast.error(json.error);
      } catch (e) { toast.error("Error network"); }
      setIsProcessing(false);
  };

  let streamUrl = `${appUrl}/radio?id=...`;
  if (selectedStation) {
    let sParam = "";
    if (selectedStation.serverUrl) {
      if (selectedStation.serverUrl.includes("s1.radio")) {
        sParam = "&s=s1";
      } else if (!selectedStation.serverUrl.includes("radio.xyz-sa.site") || selectedStation.serverUrl !== "https://radio.xyz-sa.site") {
        const rawDomain = selectedStation.serverUrl.replace("https://", "").replace("http://", "");
        if (rawDomain !== "radio.xyz-sa.site") {
          sParam = `&s=${rawDomain}`;
        }
      }
    }
    streamUrl = `${appUrl}/radio?id=${selectedStation.id}${sParam}`;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(streamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!selectedStation || !radioId) {
      return <div className="p-8 text-zinc-400 flex items-center justify-center min-h-screen"><Loader2 className="animate-spin mr-2" /> Memuat radio...</div>;
  }

  const listeners = state?.listener_count || 0;
  const isLive = state?.is_playing || false;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full min-h-screen">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white transition-colors duration-300">
            {selectedStation.name} Panel V2
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
            Kelola stream, antrian, dan pengaturan radio Anda.
          </p>
        </div>
        <div className="flex space-x-3">
            <button onClick={() => router.push('/panel/settings')} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 px-4 py-2 rounded-xl font-medium transition flex items-center shadow-sm text-zinc-900 dark:text-white">
                <Edit className="w-4 h-4 mr-2" />
                Edit Radio
            </button>
            <button onClick={() => router.push('/panel/discord-bot')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-medium transition flex items-center shadow-sm">
                <LinkIcon className="w-4 h-4 mr-2" />
                Hubungkan Bot
            </button>
        </div>
      </header>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-500 dark:text-zinc-400 font-medium transition-colors duration-300">Listeners</h3>
            <Headphones className="text-blue-500 w-5 h-5" />
          </div>
          <p className="text-4xl font-bold text-zinc-900 dark:text-white transition-colors duration-300">{listeners}</p>
          <p className="text-sm text-zinc-500 mt-2">Current Active</p>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-500 dark:text-zinc-400 font-medium transition-colors duration-300">Stream Status</h3>
            <Radio className={`${isLive ? 'text-green-500 animate-pulse' : 'text-red-500'} w-5 h-5`} />
          </div>
          <p className={`text-4xl font-bold ${isLive ? 'text-green-500' : 'text-red-500'}`}>{isLive ? "Live" : "Offline"}</p>
          <p className="text-sm text-zinc-500 mt-2">128 kbps MP3</p>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-zinc-500 dark:text-zinc-400 font-medium mb-4 transition-colors duration-300">Link Stream Radio</h3>
          <div className="flex space-x-2">
            <div className="flex-1 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300 truncate transition-colors duration-300">
              {streamUrl}
            </div>
            <button
              onClick={handleCopy}
              className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl transition-colors duration-300"
              title="Copy link"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-sm text-zinc-500 mt-2">Paste di Audio Player game Anda</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* NOW PLAYING CARD */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="bg-zinc-100 dark:bg-black text-blue-600 dark:text-green-500 font-mono p-4 rounded-xl text-center my-4 border border-zinc-200 dark:border-zinc-800 h-28 flex flex-col justify-center transition-colors">
            {state?.is_playing ? (
              <>
                <div className="text-xl animate-pulse">▶ NOW PLAYING</div>
                <div className="text-2xl font-bold truncate mt-2 text-zinc-900 dark:text-white">{currentTrack ? currentTrack.title : "Loading..."}</div>
              </>
            ) : (
              <div className="text-2xl text-zinc-400 dark:text-zinc-500">PAUSED / IDLE</div>
            )}
          </div>

          <div className="flex justify-center space-x-4 mt-6">
            <button onClick={handleSkip} className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-8 py-3 rounded-xl font-bold transition">⏭ Skip Lagu Ini</button>
          </div>
        </div>

        {queues.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-2 text-zinc-900 dark:text-white">Antrian (Requests)</h2>
            <ul className="space-y-2">
              {queues.map((q, idx) => (
                <li key={q.id} className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl flex justify-between items-center text-zinc-800 dark:text-zinc-200">
                  <span className="truncate pr-4">{idx + 1}. {q.radio_tracks_v2?.title}</span>
                  <span className="text-sm text-zinc-500 whitespace-nowrap">Req: {q.requested_by}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4 gap-4">
            <div className="flex space-x-4 w-full sm:w-auto overflow-x-auto">
                <button onClick={() => setActiveTab('lagu')} className={`flex items-center space-x-2 pb-2 px-2 border-b-2 transition whitespace-nowrap ${activeTab === 'lagu' ? 'border-blue-500 text-blue-600 dark:border-green-500 dark:text-green-400 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'}`}>
                    <Music size={18} /> <span>Lagu</span>
                </button>
                <button onClick={() => setActiveTab('jingle')} className={`flex items-center space-x-2 pb-2 px-2 border-b-2 transition whitespace-nowrap ${activeTab === 'jingle' ? 'border-blue-500 text-blue-600 dark:border-green-500 dark:text-green-400 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'}`}>
                    <Mic size={18} /> <span>Jingle/Iklan</span>
                </button>
            </div>
            <div className="flex space-x-2 w-full sm:w-auto">
                {activeTab === 'jingle' && (
                    <button onClick={() => setShowJingleSettings(true)} className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-3 py-2 rounded-lg font-medium text-sm transition flex items-center space-x-2 flex-1 justify-center">
                        <Settings size={16} /> <span>Setelan</span>
                    </button>
                )}
                <button onClick={() => setShowUploadModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition flex items-center space-x-2 flex-1 justify-center">
                    <Upload size={16} /> <span>Tambah {activeTab === 'lagu' ? 'Lagu' : 'Jingle'}</span>
                </button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {playlists.length === 0 && !isLoadingMore ? (
                <div className="text-center text-zinc-500 py-12 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl">Belum ada media di tab ini. Tambahkan sekarang!</div>
            ) : (
                playlists.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition group relative border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <span className="truncate font-semibold text-zinc-900 dark:text-white">{item.radio_tracks_v2?.title}</span>
                            <span className="truncate text-sm text-zinc-500">{item.radio_tracks_v2?.artist || 'Unknown Artist'}</span>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                            <button onClick={() => { setSelectedTrack(item.radio_tracks_v2); setShowPlayModal(true); }} className="bg-green-500 hover:bg-green-400 text-white p-2 rounded-lg text-sm font-bold shadow sm:opacity-0 sm:group-hover:opacity-100 transition">
                                <Play size={16} />
                            </button>
                            <div className="relative">
                                <button onClick={() => setDropdownOpenId(dropdownOpenId === item.id ? null : item.id)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                                    <MoreVertical size={16} />
                                </button>
                                {dropdownOpenId === item.id && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-10 overflow-hidden">
                                        <button onClick={() => { setEditingTrack(item.radio_tracks_v2); setEditTitle(item.radio_tracks_v2?.title); setEditArtist(item.radio_tracks_v2?.artist || ""); setDropdownOpenId(null); }} className="flex items-center w-full px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition">
                                            <Edit2 size={14} className="mr-3" /> Edit Metadata
                                        </button>
                                        <button onClick={() => { setTrackToDelete({ trackId: item.radio_tracks_v2?.id, title: item.radio_tracks_v2?.title }); setDropdownOpenId(null); }} className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-zinc-700 transition border-t border-zinc-100 dark:border-zinc-700">
                                            <Trash2 size={14} className="mr-3" /> Hapus
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
            
            {hasMore && (
                <div ref={loaderRef} className="py-6 text-center text-zinc-400">
                    <Loader2 className="animate-spin inline-block" size={24} />
                </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showPlayModal && selectedTrack && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">Tindakan Pemutaran</h3>
            <p className="text-blue-600 dark:text-green-400 font-medium mb-6 line-clamp-2">{selectedTrack.title}</p>
            <div className="flex flex-col space-y-3">
              <button onClick={() => handlePlayAction('now')} className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold w-full transition">⚡ Putar Sekarang</button>
              <button onClick={() => handlePlayAction('queue')} className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white py-3 rounded-xl font-semibold w-full transition">⏳ Ke Antrian Berikutnya</button>
              <button onClick={() => setShowPlayModal(false)} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white py-2 w-full transition mt-2 font-medium">Batal</button>
            </div>
          </div>
        </div>
      )}

      {trackToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-600 dark:text-red-500" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">Hapus Lagu?</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">Lagu <span className="text-zinc-900 dark:text-white font-bold">{trackToDelete.title}</span> akan dihapus dari playlist secara permanen.</p>
            <div className="flex space-x-3">
              <button onClick={() => setTrackToDelete(null)} disabled={isProcessing} className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white py-3 rounded-xl font-semibold transition">Batal</button>
              <button onClick={handleDeleteConfirm} disabled={isProcessing} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center">
                  {isProcessing ? <Loader2 className="animate-spin mr-2" size={16}/> : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showJingleSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white flex items-center"><Settings className="mr-2 w-5 h-5"/> Setelan Jingle</h3>
            <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Putar Jingle setiap ... Lagu</label>
                <input type="number" min="1" max="50" value={jingleInterval} onChange={(e) => setJingleInterval(parseInt(e.target.value))} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            </div>
            <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Jumlah Jingle yang diputar</label>
                <input type="number" min="1" max="10" value={jingleCount} onChange={(e) => setJingleCount(parseInt(e.target.value))} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                <p className="text-xs text-zinc-500 mt-3 leading-relaxed">Sistem akan otomatis menyelipkan {jingleCount} jingle acak setelah {jingleInterval} lagu biasa selesai berputar.</p>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowJingleSettings(false)} className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white py-3 rounded-xl font-semibold transition">Batal</button>
              <button onClick={saveJingleSettings} disabled={isProcessing} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center">
                  {isProcessing ? <Loader2 className="animate-spin mr-2" size={16}/> : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTrack && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white">Edit Metadata</h3>
            <div className="space-y-4 mb-8">
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Judul Lagu</label>
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Artis / Penyanyi</label>
                    <input type="text" value={editArtist} onChange={(e) => setEditArtist(e.target.value)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setEditingTrack(null)} className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white py-3 rounded-xl font-semibold transition">Batal</button>
              <button onClick={handleEditSave} disabled={isProcessing} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center">
                  {isProcessing ? <Loader2 className="animate-spin mr-2" size={16}/> : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Tambah {activeTab === 'lagu' ? 'Lagu' : 'Jingle'}</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">✕</button>
            </div>
            <div className="flex border-b border-zinc-100 dark:border-zinc-800">
                <button onClick={() => setUploadTab('local')} className={`flex-1 py-4 font-semibold text-sm transition border-b-2 ${uploadTab === 'local' ? 'border-blue-500 text-blue-600 dark:text-white bg-white dark:bg-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-50 dark:bg-zinc-900/50'}`}>Upload File Lokal</button>
                <button onClick={() => setUploadTab('youtube')} className={`flex-1 py-4 font-semibold text-sm transition border-b-2 ${uploadTab === 'youtube' ? 'border-blue-500 text-blue-600 dark:text-white bg-white dark:bg-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-50 dark:bg-zinc-900/50'}`}>Download URL (YT/SC)</button>
            </div>
            <div className="p-6 overflow-y-auto">
                {uploadTab === 'local' ? (
                    <div className="space-y-6">
                        <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all group" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                                <Upload className="text-zinc-400 group-hover:text-blue-500" size={28} />
                            </div>
                            <p className="text-zinc-900 dark:text-white font-bold text-lg mb-2">Pilih File Audio</p>
                            <p className="text-zinc-500 text-sm">MP3 sangat disarankan. Maksimal 50MB.</p>
                            <input type="file" accept="audio/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        </div>
                        {uploadTitle && (
                            <div className="bg-zinc-50 dark:bg-black p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 mb-6 font-medium text-sm">
                                    <Check size={16} /> <span className="truncate">File: {uploadTitle}</span>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Judul</label>
                                        <input type="text" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Artis / Penyanyi</label>
                                        <input type="text" value={uploadArtist} onChange={e => setUploadArtist(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                                    </div>
                                    <button onClick={handleUploadLocal} disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold mt-2 flex items-center justify-center transition shadow-lg shadow-blue-900/20">
                                        {isProcessing ? <Loader2 className="animate-spin mr-2" size={18}/> : "Mulai Upload"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-5 rounded-2xl flex items-start space-x-4">
                            <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                                <Search size={20} />
                            </div>
                            <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
                                Paste link dari YouTube, SoundCloud, atau platform lain. Sistem kami akan otomatis mengunduh dan mengekstrak audio dalam format MP3.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">URL Media</label>
                            <input type="text" placeholder="https://youtube.com/watch?v=..." value={ytUrl} onChange={e => setYtUrl(e.target.value)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                        </div>
                        <button onClick={handleDownloadYt} disabled={isProcessing || !ytUrl} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center transition shadow-lg shadow-blue-900/20">
                            {isProcessing ? <Loader2 className="animate-spin mr-2" size={18}/> : "Mulai Download"}
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
