"use client";

import { useTheme } from "./ThemeContext";
import { Sun, Moon } from "lucide-react";

export function TopBar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="hidden md:flex items-center justify-end px-8 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black transition-colors duration-300">
      <div className="flex items-center space-x-4">
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
