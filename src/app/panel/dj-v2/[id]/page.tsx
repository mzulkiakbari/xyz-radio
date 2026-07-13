"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DJPanelV2() {
  const params = useParams();
  const rawId = params?.id as string;
  const [radioId, setRadioId] = useState<string | null>(null);

  const [state, setState] = useState<any>(null);
  const [queues, setQueues] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  
  // Debug State
  const [debugInfo, setDebugInfo] = useState<string>("");
  
  // Modal State
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const resolveId = async () => {
        if (!rawId) return;
        // Cek apakah rawId adalah AzuraCast ID (angka) atau UUID via API backend
        if (!rawId.includes("-")) {
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
                const res = await fetch(`${backendUrl}/api/radio/resolve-id?id=${rawId}`);
                if (!res.ok) {
                    throw new Error(`HTTP Error: ${res.status}`);
                }
                const json = await res.json();
                console.log("DEBUG: resolve-id response:", json);
                if (json.success && json.uuid) {
                    setRadioId(json.uuid);
                    return;
                }
            } catch (e) {
                console.error("Gagal resolve ID dari backend:", e);
                alert("Gagal menghubungi server untuk resolve ID Radio! Pastikan server.js terbaru sudah di-upload ke VPS dan direstart.");
            }
        }
        setRadioId(rawId);
    };
    resolveId();
  }, [rawId]);

  useEffect(() => {
    if (!radioId) return;

    fetchData(radioId);

    // Setup Supabase Realtime
    const channel = supabase.channel(`radio_${radioId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "radio_states_v2", filter: `radio_id=eq.${radioId}` },
        (payload) => {
          const newData = payload.new as any;
          setState(newData);
          fetchCurrentTrack(newData.current_track_id);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "radio_queues_v2", filter: `radio_id=eq.${radioId}` },
        () => {
          fetchQueues();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "radio_playlist_items_v2", filter: `radio_id=eq.${radioId}` },
        () => {
          fetchData(radioId); // Fetch ulang playlist jika ada perubahan
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [radioId]);

  const fetchData = async (id: string) => {
    // 1. Fetch State
    const { data: st } = await supabase.from("radio_states_v2").select("*").eq("radio_id", id).single();
    if (st) {
        setState(st);
        if (st.current_track_id) fetchCurrentTrack(st.current_track_id);
    }
    
    // 2. Fetch Queues
    await fetchQueues(id);

    // 3. Fetch Playlist (Media List)
    const { data: pl, error: plErr } = await supabase
      .from("radio_playlist_items_v2")
      .select("*, radio_tracks_v2(*)")
      .eq("radio_id", id)
      .eq("is_jingle", false);
    
    console.log("DEBUG: Playlist response:", { pl, plErr, id });
    setDebugInfo(prev => prev + ` | PL: ${pl?.length || 0} items`);
    if (plErr) setDebugInfo(prev => prev + ` | PLError: ${plErr.message}`);
    
    if (pl) setPlaylists(pl);
  };

  const fetchQueues = async (id: string = radioId as string) => {
    const { data: q, error: qErr } = await supabase
      .from("radio_queues_v2")
      .select("*, radio_tracks_v2(*)")
      .eq("radio_id", id)
      .order("position", { ascending: true });
    
    console.log("DEBUG: Queues response:", { q, qErr, id });
    if (qErr) setDebugInfo(prev => prev + ` | QError: ${qErr.message}`);
    
    if (q) setQueues(q);
  };

  const fetchCurrentTrack = async (trackId: string) => {
    if (!trackId) {
        setCurrentTrack(null);
        return;
    }
    const { data: t } = await supabase.from("radio_tracks_v2").select("*").eq("id", trackId).single();
    if (t) setCurrentTrack(t);
  };

  const handleSkip = async () => {
    // Untuk simplifikasi, panggil fungsi API jika ada, atau update state untuk memberi tahu bot
    // Tapi karena bot mendengarkan discord event, idealnya panggil API POST /v2/action
    // Karena kita tes lokal, buat fetch saja
    try {
        await fetch(`http://localhost:3001/v2/action/${radioId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'skip' })
        });
    } catch(e) {
        console.error(e);
        alert("Bot harus berjalan lokal untuk aksi skip.");
    }
  };

  const handlePlayAction = async (action: 'now' | 'queue') => {
      if (!selectedTrack) return;

      if (action === 'queue') {
          await supabase.from("radio_queues_v2").insert({
              radio_id: radioId,
              track_id: selectedTrack.id,
              requested_by: "Web DJ",
              position: queues.length + 1
          });
      } else if (action === 'now') {
          // Interrupt: Masukkan ke urutan 1, lalu skip lagu sekarang
          await supabase.from("radio_queues_v2").insert({
            radio_id: radioId,
            track_id: selectedTrack.id,
            requested_by: "Web DJ",
            position: -1 // Akan ditarik pertama
          });
          await handleSkip();
      }
      setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* DEBUG BAR */}
        <div className="bg-red-900 text-xs text-white p-2 rounded">
          <strong>DEBUG:</strong> rawId=[{rawId}] radioId=[{radioId}] state=[{state ? 'Loaded' : 'Null'}] {debugInfo}
        </div>

        {/* Winamp Top Header: Now Playing */}
        <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6 shadow-2xl">
          <h1 className="text-3xl font-bold text-center text-green-400 mb-2">DJ PANEL V2</h1>
          
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
            <button className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-full font-bold transition">
              ⏮ Prev
            </button>
            <button onClick={handleSkip} className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-full font-bold transition">
              ⏭ Skip
            </button>
          </div>
        </div>

        {/* Queues List */}
        {queues.length > 0 && (
          <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Antrian (Requests)</h2>
            <ul className="space-y-2">
              {queues.map((q, idx) => (
                <li key={q.id} className="bg-gray-700 p-3 rounded flex justify-between">
                  <span>{idx + 1}. {q.radio_tracks_v2?.title}</span>
                  <span className="text-sm text-gray-400">Req: {q.requested_by}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bottom List: Media Playlist */}
        <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Media Playlist</h2>
          
          {playlists.length === 0 ? (
            <div className="text-center text-gray-400 py-8">Belum ada lagu di playlist.</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {playlists.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-gray-700 p-3 rounded hover:bg-gray-600 transition">
                  <span className="truncate flex-1 font-medium">{item.radio_tracks_v2?.title}</span>
                  <button 
                    onClick={() => {
                        setSelectedTrack(item.radio_tracks_v2);
                        setShowModal(true);
                    }}
                    className="ml-4 bg-green-600 hover:bg-green-500 px-4 py-1.5 rounded text-sm font-bold shadow"
                  >
                    ▶ PLAY
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Popup Modal Action */}
      {showModal && selectedTrack && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full text-center">
            <h3 className="text-xl font-bold mb-4 text-white">Tindakan Pemutaran</h3>
            <p className="text-green-400 font-medium mb-6 line-clamp-2">{selectedTrack.title}</p>
            
            <div className="flex flex-col space-y-3">
              <button onClick={() => handlePlayAction('now')} className="bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold w-full transition">
                ⚡ Putar Sekarang (Interrupt)
              </button>
              <button onClick={() => handlePlayAction('queue')} className="bg-gray-600 hover:bg-gray-500 py-3 rounded font-bold w-full transition">
                ⏳ Masukkan ke Antrian (Putar Setelah Ini)
              </button>
              <button onClick={() => setShowModal(false)} className="bg-red-600 hover:bg-red-500 py-2 rounded w-full transition mt-2">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
