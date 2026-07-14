"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { MoreVertical, Search, Edit2, Trash2, Upload, Play, Loader2, Music, Mic, Settings, ArrowLeft } from "lucide-react";

export default function DJPanelV2() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;
  const [radioId, setRadioId] = useState<string | null>(null);

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
  const [showJingleSettings, setShowJingleSettings] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  useEffect(() => {
    const resolveId = async () => {
        if (!rawId) return;
        if (!rawId.includes("-")) {
            try {
                const res = await fetch(`${backendUrl}/api/radio/resolve-id?id=${rawId}`);
                const json = await res.json();
                if (json.success && json.uuid) {
                    setRadioId(json.uuid);
                    return;
                }
            } catch (e) {
                console.error("Gagal resolve ID");
            }
        } else {
            setRadioId(rawId);
        }
    };
    resolveId();
  }, [rawId, backendUrl]);

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
                // Mencegah duplikasi data jika trigger dobel
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
          // Restart fetch ke halaman pertama untuk mendapatkan relasi join
          setPage(0);
          fetchPlaylists(0, false);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [radioId, fetchPlaylists]);

  const fetchJingleSettings = async (id: string) => {
      const { data } = await supabase.from('radio_orders').select('jingle_interval').eq('id', id).single();
      if (data && data.jingle_interval) setJingleInterval(data.jingle_interval);
  };

  const saveJingleSettings = async () => {
      setIsProcessing(true);
      const { error } = await supabase.from('radio_orders').update({ jingle_interval: jingleInterval }).eq('id', radioId);
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
    const { data: q } = await supabase.from("radio_queues_v2").select("*, radio_tracks_v2(*)").eq("radio_id", id).gte("position", 0).order("position", { ascending: true });
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
          setShowPlayModal(false);
      } else if (action === 'now') {
          setShowPlayModal(false); // Langsung close modal
          await supabase.from("radio_queues_v2").insert({ radio_id: radioId, track_id: selectedTrack.id, requested_by: "Web DJ", position: -1 });
          await handleSkip();
      }
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
              // Optimistic update
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
              // Optimistic edit
              setPlaylists(prev => prev.map(p => p.radio_tracks_v2?.id === editingTrack.id ? { ...p, radio_tracks_v2: { ...p.radio_tracks_v2, title: editTitle, artist: editArtist } } : p));
          } else toast.error(json.error);
      } catch (e) { toast.error("Error network"); }
      setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => router.push('/panel')}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-colors border-2 border-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-green-400">DJ PANEL V2</h1>
        </div>
        <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6 shadow-2xl">
          
          <div className="bg-black text-green-500 font-mono p-4 rounded text-center my-4 border border-gray-700 h-24 flex flex-col justify-center">
            {state?.is_playing ? (
              <>
                <div className="text-xl animate-pulse">▶ NOW PLAYING</div>
                <div className="text-2xl font-bold truncate mt-2">{currentTrack ? currentTrack.title : "Loading..."}</div>
              </>
            ) : (
              <div className="text-2xl text-gray-500">PAUSED / IDLE</div>
            )}
          </div>

          <div className="flex justify-center space-x-4">
            <button className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-full font-bold transition">⏮ Prev</button>
            <button onClick={handleSkip} className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-full font-bold transition">⏭ Skip</button>
          </div>
        </div>

        {queues.length > 0 && (
          <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Antrian (Requests)</h2>
            <ul className="space-y-2">
              {queues.map((q, idx) => (
                <li key={q.id} className="bg-gray-700 p-3 rounded flex justify-between items-center">
                  <span>{idx + 1}. {q.radio_tracks_v2?.title}</span>
                  <span className="text-sm text-gray-400">Req: {q.requested_by}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
            <div className="flex space-x-4">
                <button onClick={() => setActiveTab('lagu')} className={`flex items-center space-x-2 pb-2 px-2 border-b-2 transition ${activeTab === 'lagu' ? 'border-green-500 text-green-400 font-bold' : 'border-transparent text-gray-400 hover:text-white'}`}>
                    <Music size={18} /> <span>Lagu</span>
                </button>
                <button onClick={() => setActiveTab('jingle')} className={`flex items-center space-x-2 pb-2 px-2 border-b-2 transition ${activeTab === 'jingle' ? 'border-green-500 text-green-400 font-bold' : 'border-transparent text-gray-400 hover:text-white'}`}>
                    <Mic size={18} /> <span>Jingle/Iklan</span>
                </button>
            </div>
            <div className="flex space-x-2">
                {activeTab === 'jingle' && (
                    <button onClick={() => setShowJingleSettings(true)} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded font-bold text-sm transition flex items-center space-x-2">
                        <Settings size={16} /> <span>Setelan Jingle</span>
                    </button>
                )}
                <button onClick={() => setShowUploadModal(true)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-bold text-sm transition flex items-center space-x-2">
                    <Upload size={16} /> <span>Tambah {activeTab === 'lagu' ? 'Lagu' : 'Jingle'}</span>
                </button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {playlists.length === 0 && !isLoadingMore ? (
                <div className="text-center text-gray-400 py-8">Belum ada data di tab ini.</div>
            ) : (
                playlists.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-gray-700 p-3 rounded hover:bg-gray-600 transition group relative">
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <span className="truncate font-bold text-white">{item.radio_tracks_v2?.title}</span>
                            <span className="truncate text-sm text-gray-400">{item.radio_tracks_v2?.artist || 'Unknown Artist'}</span>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                            <button onClick={() => { setSelectedTrack(item.radio_tracks_v2); setShowPlayModal(true); }} className="bg-green-600 hover:bg-green-500 p-2 rounded text-sm font-bold shadow opacity-0 group-hover:opacity-100 transition">
                                <Play size={16} />
                            </button>
                            <div className="relative">
                                <button onClick={() => setDropdownOpenId(dropdownOpenId === item.id ? null : item.id)} className="p-2 text-gray-400 hover:text-white transition">
                                    <MoreVertical size={20} />
                                </button>
                                {dropdownOpenId === item.id && (
                                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded shadow-xl z-10">
                                        <button onClick={() => { setEditingTrack(item.radio_tracks_v2); setEditTitle(item.radio_tracks_v2?.title); setEditArtist(item.radio_tracks_v2?.artist || ""); setDropdownOpenId(null); }} className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 transition">
                                            <Edit2 size={14} className="mr-2" /> Edit Metadata
                                        </button>
                                        <button onClick={() => { setTrackToDelete({ trackId: item.radio_tracks_v2?.id, title: item.radio_tracks_v2?.title }); setDropdownOpenId(null); }} className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition">
                                            <Trash2 size={14} className="mr-2" /> Hapus
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
            
            {hasMore && (
                <div ref={loaderRef} className="py-4 text-center text-gray-400">
                    <Loader2 className="animate-spin inline-block" size={24} />
                </div>
            )}
            {!hasMore && playlists.length > 0 && (
                <div className="py-4 text-center text-gray-500 text-sm">
                    Sudah menampilkan semua data.
                </div>
            )}
          </div>
        </div>
      </div>

      {showPlayModal && selectedTrack && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full text-center">
            <h3 className="text-xl font-bold mb-4 text-white">Tindakan Pemutaran</h3>
            <p className="text-green-400 font-medium mb-6 line-clamp-2">{selectedTrack.title}</p>
            <div className="flex flex-col space-y-3">
              <button onClick={() => handlePlayAction('now')} className="bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold w-full transition">⚡ Putar Sekarang (Interrupt)</button>
              <button onClick={() => handlePlayAction('queue')} className="bg-gray-600 hover:bg-gray-500 py-3 rounded font-bold w-full transition">⏳ Masukkan ke Antrian</button>
              <button onClick={() => setShowPlayModal(false)} className="bg-red-600 hover:bg-red-500 py-2 rounded w-full transition mt-2">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS (GANTI WINDOW.CONFIRM) */}
      {trackToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full text-center">
            <Trash2 className="mx-auto text-red-500 mb-4" size={48} />
            <h3 className="text-xl font-bold mb-2 text-white">Hapus Media Ini?</h3>
            <p className="text-gray-400 text-sm mb-6">Apakah Anda yakin ingin menghapus lagu <span className="text-white font-bold">{trackToDelete.title}</span> dari playlist? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex space-x-3">
              <button onClick={handleDeleteConfirm} disabled={isProcessing} className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded font-bold transition flex items-center justify-center">
                  {isProcessing ? <Loader2 className="animate-spin mr-2" size={16}/> : "Ya, Hapus"}
              </button>
              <button onClick={() => setTrackToDelete(null)} disabled={isProcessing} className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded font-bold transition">Batal</button>
            </div>
          </div>
        </div>
      )}

      {showJingleSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center"><Settings className="mr-2"/> Pengaturan Jingle V2</h3>
            <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Putar 1 Jingle setiap ... Lagu</label>
                <input type="number" min="1" max="50" value={jingleInterval} onChange={(e) => setJingleInterval(parseInt(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white outline-none focus:border-green-500" />
                <p className="text-xs text-gray-500 mt-2">Jika diisi 3, maka bot akan memutar 1 jingle acak setelah 3 lagu biasa selesai berputar.</p>
            </div>
            <div className="flex space-x-3">
              <button onClick={saveJingleSettings} disabled={isProcessing} className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded font-bold transition flex items-center justify-center">
                  {isProcessing ? <Loader2 className="animate-spin mr-2" size={16}/> : "Simpan"}
              </button>
              <button onClick={() => setShowJingleSettings(false)} className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded font-bold transition">Batal</button>
            </div>
          </div>
        </div>
      )}

      {editingTrack && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-white">Edit Metadata Lagu</h3>
            <div className="space-y-4 mb-6">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Judul Lagu</label>
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Artis / Penyanyi</label>
                    <input type="text" value={editArtist} onChange={(e) => setEditArtist(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={handleEditSave} disabled={isProcessing} className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold transition flex items-center justify-center">
                  {isProcessing ? <Loader2 className="animate-spin mr-2" size={16}/> : "Simpan Perubahan"}
              </button>
              <button onClick={() => setEditingTrack(null)} className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded font-bold transition">Batal</button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-600 rounded-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Tambah Media ke {activeTab === 'lagu' ? 'Lagu' : 'Jingle'}</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="flex border-b border-gray-700">
                <button onClick={() => setUploadTab('local')} className={`flex-1 py-3 font-bold transition ${uploadTab === 'local' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>Upload File Lokal</button>
                <button onClick={() => setUploadTab('youtube')} className={`flex-1 py-3 font-bold transition ${uploadTab === 'youtube' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>Download YT-DLP</button>
            </div>
            <div className="p-6 overflow-y-auto">
                {uploadTab === 'local' ? (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                            <p className="text-white font-bold">Klik untuk memilih file audio</p>
                            <p className="text-gray-400 text-sm mt-2">Format MP3 disarankan. Maksimal 50MB.</p>
                            <input type="file" accept="audio/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        </div>
                        {uploadTitle && (
                            <div className="bg-gray-900 p-4 rounded border border-green-500/30">
                                <p className="text-sm text-green-400 mb-4 font-mono truncate">✓ File terpilih: {uploadTitle}</p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Judul Lagu</label>
                                        <input type="text" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Artis / Penyanyi</label>
                                        <input type="text" value={uploadArtist} onChange={e => setUploadArtist(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500" />
                                    </div>
                                    <button onClick={handleUploadLocal} disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold mt-4 flex items-center justify-center transition">
                                        {isProcessing ? <Loader2 className="animate-spin mr-2" size={16}/> : <><Upload className="mr-2" size={16}/> Mulai Upload</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded text-blue-300 text-sm flex items-start space-x-3">
                            <Search className="mt-0.5 flex-shrink-0" size={16} />
                            <p>Masukkan URL dari YouTube, SoundCloud, atau platform lain yang didukung yt-dlp. Sistem akan mengunduh dan mengekstrak audio secara otomatis.</p>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">URL Media</label>
                            <input type="text" placeholder="https://youtube.com/watch?v=..." value={ytUrl} onChange={e => setYtUrl(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white outline-none focus:border-blue-500" />
                        </div>
                        <button onClick={handleDownloadYt} disabled={isProcessing || !ytUrl} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold disabled:opacity-50 flex items-center justify-center transition">
                            {isProcessing ? <Loader2 className="animate-spin mr-2" size={16}/> : <><Search className="mr-2" size={16}/> Mulai Download</>}
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
