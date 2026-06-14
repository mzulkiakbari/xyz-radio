"use client";

import { useState, useEffect } from "react";
import { Play, Square, Settings2, Mic2, AlertCircle, RefreshCw } from "lucide-react";
import { useStation } from "@/components/StationContext";

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
      const res = await fetch(`${backendUrl}/api/bot/channels`);
      const json = await res.json();
      
      if (json.success) {
        setGuilds(json.data);
        if (json.data.length > 0) {
          setSelectedGuildId(json.data[0].id);
          if (json.data[0].voiceChannels.length > 0) {
            setSelectedChannelId(json.data[0].voiceChannels[0].id);
          }
        }
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
            streamUrl: streamUrl
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
          <h1 className="text-3xl font-bold mb-2">Broadcast Controls</h1>
          <p className="text-zinc-400">
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
        <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent transition-opacity duration-700 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-48 h-48 rounded-full flex items-center justify-center mb-8 transition-all duration-500 ${
              isPlaying 
                ? "bg-blue-500/10 shadow-[0_0_100px_rgba(59,130,246,0.3)]" 
                : "bg-zinc-800/50"
            }`}>
              <div className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 ${
                isPlaying
                  ? "bg-blue-500/20 animate-pulse"
                  : "bg-zinc-800"
              }`}>
                <Mic2 className={`w-16 h-16 ${isPlaying ? "text-blue-400" : "text-zinc-600"}`} />
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2">
              {isConnecting ? "Connecting..." : isPlaying ? "On Air" : "Offline"}
            </h2>
            <p className="text-zinc-400 mb-10 text-center max-w-xs">
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Settings2 className="w-5 h-5 text-zinc-400" />
                <h3 className="font-bold text-lg">Target Configuration</h3>
              </div>
              <button onClick={fetchChannels} className="text-zinc-500 hover:text-white transition-colors" title="Refresh Channels">
                <RefreshCw className={`w-4 h-4 ${isLoadingChannels ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Discord Server</label>
                <select 
                  value={selectedGuildId} 
                  onChange={handleGuildChange}
                  disabled={isPlaying || isLoadingChannels}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 disabled:opacity-50"
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
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Voice Channel</label>
                <select 
                  value={selectedChannelId} 
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  disabled={isPlaying || isLoadingChannels || !activeGuild || activeGuild.voiceChannels.length === 0}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 disabled:opacity-50"
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
