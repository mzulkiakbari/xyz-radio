"use client";

import { useTheme } from "./ThemeContext";
import { Sun, Moon, Radio, ChevronDown, Search } from "lucide-react";
import { useStation, Station } from "./StationContext";
import { useState, useRef, useEffect } from "react";

export function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { stations, selectedStation, setSelectedStation } = useStation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Effect untuk mengontrol volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Effect untuk mereset player saat stasiun berubah
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.load(); // Paksa muat ulang URL stream yang baru
        audioRef.current.play().catch(e => {
            console.error("Gagal auto-play:", e);
            setIsPlaying(false);
        });
      } else {
          audioRef.current.load();
      }
    }
  }, [selectedStation?.id]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.error("Gagal memainkan stream:", e);
        setIsPlaying(false);
      });
    }
  };

  const handleSelectStation = (station: Station) => {
    setSelectedStation(station);
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const streamUrl = selectedStation ? `${typeof window !== "undefined" ? "/api-backend" : (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000")}/v2/stream/${selectedStation.id}` : "";

  return (
    <div className="hidden md:flex items-center justify-between px-8 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black transition-colors duration-300">
      {/* Audio Element */}
      {selectedStation && (
        <audio ref={audioRef} src={streamUrl} preload="none" />
      )}

      <div className="flex-1 flex items-center">
        {selectedStation && stations.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-xs text-zinc-500 font-medium">Stasiun Terpilih</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[150px]">
                  {selectedStation.name}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-zinc-400 ml-2" />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg shadow-black/5 overflow-hidden z-50">
                <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari stasiun..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  {filteredStations.length > 0 ? (
                    filteredStations.map((station) => (
                      <button
                        key={station.id}
                        onClick={() => handleSelectStation(station)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                          selectedStation.id === station.id 
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <Radio className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-medium truncate">{station.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-zinc-500">Stasiun tidak ditemukan</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-6">
        {/* Stream Player Controls */}
        {selectedStation && (
          <div className="flex items-center space-x-3 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={togglePlay}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              aria-label={isPlaying ? "Pause Stream" : "Play Stream"}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <div className="w-24 group relative flex items-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  aria-label="Volume Control"
                />
            </div>
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="relative w-16 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Toggle Theme"
        >
          <div
            className={`absolute left-1 top-1 w-6 h-6 rounded-full bg-white dark:bg-zinc-950 shadow-sm flex items-center justify-center transform transition-transform duration-300 ${
              theme === "dark" ? "translate-x-8" : "translate-x-0"
            }`}
          >
            {theme === "dark" ? (
              <Moon className="w-4 h-4 text-zinc-400" />
            ) : (
              <Sun className="w-4 h-4 text-orange-500" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
