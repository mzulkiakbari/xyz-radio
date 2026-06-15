"use client";

import { Copy, Check, Radio, Headphones } from "lucide-react";
import { useState, useEffect } from "react";
import { useStation } from "@/components/StationContext";

export default function OverviewPage() {
  const [copied, setCopied] = useState(false);
  const [appUrl, setAppUrl] = useState("");
  const { selectedStation } = useStation();

  const [listeners, setListeners] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [bitrate, setBitrate] = useState("0 kbps");

  useEffect(() => {
    setAppUrl(process.env.NEXT_PUBLIC_APP_URL || window.location.origin);
  }, []);

  useEffect(() => {
    if (!selectedStation) return;

    const fetchStats = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        const res = await fetch(`${backendUrl}/api/azuracast/stations/${selectedStation.id}/nowplaying`);
        const json = await res.json();
        
        if (json.success && json.data) {
          const np = json.data;
          setListeners(np.listeners?.current || 0);
          setIsLive(np.is_online || false);
          
          if (np.station?.mounts && np.station.mounts.length > 0) {
            setBitrate(`${np.station.mounts[0].bitrate} kbps ${np.station.mounts[0].format.toUpperCase()}`);
          }
        }
      } catch (err) {
        console.error("Gagal memuat stats:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Update setiap 10 detik

    return () => clearInterval(interval);
  }, [selectedStation]);

  const streamUrl = selectedStation ? `${appUrl}/radio?id=${selectedStation.id}` : `${appUrl}/radio?id=...`;

  const handleCopy = () => {
    navigator.clipboard.writeText(streamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white transition-colors duration-300">Overview</h1>
        <p className="text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
          Manage your radio stream and monitor your broadcast status.
        </p>
      </header>

      {/* Stats Row */}
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
          <p className="text-sm text-zinc-500 mt-2">Server Connection</p>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-500 dark:text-zinc-400 font-medium transition-colors duration-300">Bitrate Siaran</h3>
            <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            </div>
          </div>
          <p className="text-4xl font-bold text-zinc-900 dark:text-white transition-colors duration-300">{bitrate}</p>
          <p className="text-sm text-zinc-500 mt-2">Audio Quality</p>
        </div>
      </div>

      {/* Stream Link Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl relative overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <h2 className="text-xl font-bold mb-4 relative text-zinc-900 dark:text-white transition-colors duration-300">Stream URL (Encrypted)</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6 relative transition-colors duration-300">
          Use this URL in your web player or Discord bot. It safely proxies to the actual AzuraCast endpoint.
        </p>

        <div className="flex items-center bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden relative transition-colors duration-300">
          <div className="px-4 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-sm border-r border-zinc-300 dark:border-zinc-700 transition-colors duration-300">
            GET
          </div>
          <input
            type="text"
            readOnly
            value={streamUrl}
            className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-zinc-900 dark:text-zinc-200 font-mono text-sm w-full transition-colors duration-300"
          />
          <button
            onClick={handleCopy}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors flex items-center space-x-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
