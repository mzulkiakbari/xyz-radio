"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ListMusic, 
  Radio, 
  Settings,
  Headphones,
  Podcast
} from "lucide-react";
import { useStation } from "./StationContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/" },
  { icon: ListMusic, label: "Media", href: "/media" },
  { icon: Podcast, label: "Podcast", href: "/podcast" },
  { icon: Radio, label: "Discord Bot", href: "/discord-bot" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { selectedStation } = useStation();

  return (
    <aside className="w-64 bg-black border-r border-zinc-800 flex flex-col h-screen">
      <div className="h-20 flex items-center px-6 border-b border-zinc-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg leading-tight block text-white truncate w-40">
              {selectedStation?.name || "XYZ Radio"}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider block">
              AzuraCast Panel
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? "bg-blue-600/10 text-blue-500 font-semibold" 
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }
              `}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-medium text-zinc-300">System Online</span>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Connected to {selectedStation?.shortcode || "server"}
          </p>
        </div>
      </div>
    </aside>
  );
}
