"use client";

import { useState, useEffect } from "react";
import { Play, Square, Settings2, Mic2, AlertCircle, RefreshCw } from "lucide-react";
import { useStation } from "@/components/StationContext";
import { supabase } from "@/lib/supabase";

type VoiceChannel = {
  id: string;
  name: string;
  type: number;
};

type Guild = {
  id: string;
  name: string;
  icon: string | null;
  voiceChannels: VoiceChannel[];
};

export default function BroadcastPage() {
  const { selectedStation } = useStation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string>("");
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setIsLoadingChannels(true);
    setError(null);
    try {
      // Ambil Discord ID dari session (provider_id dari OAuth Discord)
      const { data: { session } } = await supabase.auth.getSession();
      const discordIdentity = session?.user?.identities?.find(i => i.provider === 'discord');
      const discordId = discordIdentity?.id || "";

      const channelUrl = discordId
        ? `${backendUrl}/api/bot/channels?discordId=${discordId}`
        : `${backendUrl}/api/bot/channels`;

      const [resChannels, resStatus] = await Promise.all([
        fetch(channelUrl),
        fetch(`${backendUrl}/api/bot/status`).catch(() => null)
      ]);
      
      const json = await resChannels.json();
      const statusJson = resStatus ? await resStatus.json() : null;
      
      let playing = false;
      let activeChanId = "";
      if (statusJson && statusJson.success && statusJson.activeChannels && statusJson.activeChannels.length > 0) {
          playing = true;
          activeChanId = statusJson.activeChannels[0];
      }
      
      if (json.success) {
        setGuilds(json.data);
        if (json.data.length > 0) {
          if (playing && activeChanId) {
            let foundGuild = json.data.find((g: Guild) => g.voiceChannels.some(c => c.id === activeChanId));
            if (foundGuild) {
              setSelectedGuildId(foundGuild.id);
              setSelectedChannelId(activeChanId);
            } else {
              setSelectedGuildId(json.data[0].id);
              if (json.data[0].voiceChannels.length > 0) setSelectedChannelId(json.data[0].voiceChannels[0].id);
            }
          } else {
            setSelectedGuildId(json.data[0].id);
            if (json.data[0].voiceChannels.length > 0) {
              setSelectedChannelId(json.data[0].voiceChannels[0].id);
            }
          }
        }
        setIsPlaying(playing);
      } else {
        setError(json.error || "Gagal memuat daftar server.");
      }
    } catch (err) {
      setError("Backend tidak dapat dihubungi. Pastikan server.js berjalan.");
    } finally {
      setIsLoadingChannels(false);
    }
  };

  const handleGuildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gId = e.target.value;
    setSelectedGuildId(gId);
    
    const guild = guilds.find(g => g.id === gId);
    if (guild && guild.voiceChannels.length > 0) {
      setSelectedChannelId(guild.voiceChannels[0].id);
    } else {
      setSelectedChannelId("");
    }
  };

  const handleToggleBroadcast = async () => {
    if (!selectedChannelId && !isPlaying) {
      alert("Pilih Voice Channel terlebih dahulu!");
      return;
    }

    setIsConnecting(true);
    
    try {
      if (!isPlaying) {
        // Start Broadcast
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const streamUrl = selectedStation ? `${appUrl}/radio?id=${selectedStation.id}` : `${appUrl}/radio?id=...`;

        const res = await fetch(`${backendUrl}/api/bot/play`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            channelIds: [selectedChannelId],
            streamUrl: streamUrl,
            stationId: selectedStation ? selectedStation.id : null
          })
        });
        const json = await res.json();
        
        if (json.success) setIsPlaying(true);
        else alert(`Error: ${json.error}`);
      } else {
        // Stop Broadcast
        const res = await fetch(`${backendUrl}/api/bot/stop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guildIds: [selectedGuildId] })
        });
        const json = await res.json();
        
        if (json.success) setIsPlaying(false);
      }
    } catch (err) {
      alert("Koneksi ke backend gagal.");
    } finally {
      setIsConnecting(false);
    }
  };

  const activeGuild = guilds.find(g => g.id === selectedGuildId);

  return (
    <div className="p-8 max-w-5xl mx-auto w-full flex flex-col h-full">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white transition-colors duration-300">Broadcast Controls</h1>
          <p className="text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
            Start or stop the radio stream in your selected Discord channel.
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start space-x-3 text-red-500">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold">Connection Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row gap-8">
        {/* Main Control Panel */}
        <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
          <div className={`absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent transition-opacity duration-700 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-48 h-48 rounded-full flex items-center justify-center mb-8 transition-all duration-500 ${
              isPlaying 
                ? "bg-blue-500/10 shadow-[0_0_100px_rgba(59,130,246,0.3)]" 
                : "bg-zinc-100 dark:bg-zinc-800/50"
            }`}>
              <div className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 ${
                isPlaying
                  ? "bg-blue-500/20 animate-pulse"
                  : "bg-zinc-200 dark:bg-zinc-800"
              }`}>
                <Mic2 className={`w-16 h-16 transition-colors duration-300 ${isPlaying ? "text-blue-500 dark:text-blue-400" : "text-zinc-400 dark:text-zinc-600"}`} />
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white transition-colors duration-300">
              {isConnecting ? "Connecting..." : isPlaying ? "On Air" : "Offline"}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-10 text-center max-w-xs transition-colors duration-300">
              {isPlaying 
                ? "Bot is currently streaming audio to the Discord voice channel." 
                : "Select a channel and click the button to start broadcasting."}
            </p>

            <button
              onClick={handleToggleBroadcast}
              disabled={isConnecting || (!selectedChannelId && !isPlaying)}
              className={`flex items-center space-x-3 px-10 py-5 rounded-full font-bold text-lg transition-all ${
                isPlaying
                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/50"
                  : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/50"
              } ${isConnecting || (!selectedChannelId && !isPlaying) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-6 h-6 fill-current" />
                  <span>Stop Broadcast</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-current" />
                  <span>Start Broadcast</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Settings / Info Sidebar */}
        <div className="w-full md:w-80 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Settings2 className="w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-colors duration-300" />
                <h3 className="font-bold text-zinc-900 dark:text-white transition-colors duration-300">Target Server</h3>
              </div>
              <button onClick={fetchChannels} className="text-zinc-500 hover:text-white transition-colors" title="Refresh Channels">
                <RefreshCw className={`w-4 h-4 ${isLoadingChannels ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Select Server
                </label>
                <select 
                  value={selectedGuildId} 
                  onChange={handleGuildChange}
                  disabled={isPlaying || isLoadingChannels}
                  className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors duration-300"
                >
                  {isLoadingChannels ? (
                    <option>Loading servers...</option>
                  ) : guilds.length === 0 ? (
                    <option>No servers found</option>
                  ) : (
                    guilds.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))
                  )}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Voice Channel
                </label>
                <select 
                  value={selectedChannelId} 
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  disabled={isPlaying || isLoadingChannels || !activeGuild || activeGuild.voiceChannels.length === 0}
                  className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors duration-300"
                >
                  {!activeGuild ? (
                    <option>Select a server first</option>
                  ) : activeGuild.voiceChannels.length === 0 ? (
                    <option>No voice channels</option>
                  ) : (
                    activeGuild.voiceChannels.map(c => (
                      <option key={c.id} value={c.id}>🔊 {c.name}</option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
