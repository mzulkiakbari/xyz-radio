"use client";

import { Copy, Check, Radio, Headphones } from "lucide-react";
import { useState, useEffect } from "react";
import { useStation } from "@/components/StationContext";

export default function OverviewPage() {
  const [copied, setCopied] = useState(false);
  const [appUrl, setAppUrl] = useState("");
  const { selectedStation } = useStation();

  useEffect(() => {
    // Gunakan NEXT_PUBLIC_APP_URL dari .env.local, fallback ke window.location.origin
    setAppUrl(process.env.NEXT_PUBLIC_APP_URL || window.location.origin);
  }, []);

  const streamUrl = selectedStation ? `${appUrl}/radio?id=${selectedStation.id}` : `${appUrl}/radio?id=...`;

  const handleCopy = () => {
    navigator.clipboard.writeText(streamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Overview</h1>
        <p className="text-zinc-400">
          Manage your radio stream and monitor your broadcast status.
        </p>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-medium">Listeners</h3>
            <Headphones className="text-blue-500 w-5 h-5" />
          </div>
          <p className="text-4xl font-bold">128</p>
          <p className="text-sm text-green-500 mt-2">+12% from last hour</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-medium">Stream Status</h3>
            <Radio className="text-green-500 w-5 h-5 animate-pulse" />
          </div>
          <p className="text-4xl font-bold text-green-500">Live</p>
          <p className="text-sm text-zinc-500 mt-2">Uptime: 24h 12m</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-medium">Bandwidth</h3>
            <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            </div>
          </div>
          <p className="text-4xl font-bold">1.2 TB</p>
          <p className="text-sm text-zinc-500 mt-2">This month</p>
        </div>
      </div>

      {/* Stream Link Section */}
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <h2 className="text-xl font-bold mb-4 relative">Stream URL (Encrypted)</h2>
        <p className="text-zinc-400 mb-6 relative">
          Use this URL in your web player or Discord bot. It safely proxies to the actual AzuraCast endpoint.
        </p>

        <div className="flex items-center bg-black border border-zinc-800 rounded-xl overflow-hidden relative">
          <div className="px-4 py-3 bg-zinc-800 text-zinc-400 font-mono text-sm border-r border-zinc-700">
            GET
          </div>
          <input
            type="text"
            readOnly
            value={streamUrl}
            className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-zinc-200 font-mono text-sm w-full"
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
