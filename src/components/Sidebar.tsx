"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ListMusic, 
  Radio, 
  Settings,
  Headphones,
  Podcast,
  Menu,
  X
} from "lucide-react";
import { useStation } from "./StationContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/panel" },
  { icon: ListMusic, label: "Media", href: "/panel/media" },
  { icon: Radio, label: "Discord Bot", href: "/panel/discord-bot" },
  { icon: Settings, label: "Settings", href: "/panel/settings" },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { selectedStation } = useStation();
  const [hasStreamer, setHasStreamer] = useState(false);

  useEffect(() => {
    if (!selectedStation) return;
    fetch(`/api/azuracast/stations/${selectedStation.id}/streamers?s=${selectedStation.serverUrl}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data && json.data.length > 0) {
          setHasStreamer(true);
        } else {
          setHasStreamer(false);
        }
      })
      .catch(() => setHasStreamer(false));
  }, [selectedStation]);

  const dynamicMenuItems = [...menuItems];
  if (hasStreamer) {
    dynamicMenuItems.splice(2, 0, { icon: Podcast, label: "Web DJ", href: "/panel/podcast" });
  }

  return (
    <>
      <div className="h-20 flex flex-shrink-0 items-center px-6 border-b border-zinc-200 dark:border-zinc-800 relative transition-colors duration-300">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg leading-tight block text-zinc-900 dark:text-white truncate w-32 md:w-40 transition-colors duration-300">
              {selectedStation?.name || "XYZ Radio"}
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-500 font-medium uppercase tracking-wider block">
              AzuraCast Panel
            </span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="absolute right-4 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white md:hidden p-2 transition-colors duration-300">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {dynamicMenuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? "bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 font-semibold" 
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200"
                }
              `}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0 transition-colors duration-300">
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800/50 transition-colors duration-300">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors duration-300">System Online</span>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Connected to {selectedStation?.shortcode || "server"}
          </p>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { selectedStation } = useStation();

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex-shrink-0 transition-colors duration-300">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
             <Headphones className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-zinc-900 dark:text-white truncate max-w-[200px] transition-colors duration-300">{selectedStation?.name || "XYZ Radio"}</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors duration-300">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Off-canvas Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <aside className="relative w-64 bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full animate-in slide-in-from-left duration-300 transition-colors">
            <SidebarContent onClose={() => setIsMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800 flex-col h-screen flex-shrink-0 transition-colors duration-300">
        <SidebarContent />
      </aside>
    </>
  );
}
