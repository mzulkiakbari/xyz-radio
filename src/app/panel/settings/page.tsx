"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Settings, Save, Loader2, RadioTower, Tags, AlignLeft } from "lucide-react";
import { useStation } from "@/components/StationContext";

export default function SettingsPage() {
  const { selectedStation, setSelectedStation } = useStation();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedStation) {
      setName(selectedStation.name || "");
      setDescription(selectedStation.description || "");
      // Azuracast genre is sometimes nested or top-level depending on the API version, 
      // but typically we can assume it might be available on the station object if fetched.
      // If genre isn't directly on selectedStation, we might leave it blank initially
      // Wait, let's just initialize it to empty if undefined
      setGenre((selectedStation as any).genre || "");
    }
  }, [selectedStation]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStation) return;

    setIsSaving(true);
    try {
      const backendUrl = typeof window !== "undefined" ? "/api-backend" : (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001");
      const res = await fetch(`${backendUrl}/api/azuracast/stations/${selectedStation.id}?s=${selectedStation.serverUrl}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, genre })
      });
      
      const json = await res.json();
      if (json.success) {
        toast.success("Pengaturan radio berhasil disimpan!");
        
        // Update local context to reflect changes
        setSelectedStation({
          ...selectedStation,
          name,
          description,
          ...(genre ? { genre } : {})
        });
      } else {
        toast.error("Gagal menyimpan: " + (json.error || "Unknown error"));
      }
    } catch (err) {
      toast.error("Error: " + err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedStation) {
    return <div className="p-8 text-zinc-400">Silakan pilih stasiun radio terlebih dahulu.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white transition-colors duration-300">Pengaturan Radio</h1>
        <p className="text-zinc-500 dark:text-zinc-400 transition-colors duration-300">Konfigurasi profil stasiun radio {selectedStation.name}</p>
      </header>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Profil Stasiun</h2>
            <p className="text-sm text-zinc-500">Ubah detail identitas radio Anda yang akan terlihat oleh pendengar.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              <RadioTower className="w-4 h-4 text-zinc-400" />
              <span>Nama Radio</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: XYZ FM"
              required
              className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              <AlignLeft className="w-4 h-4 text-zinc-400" />
              <span>Deskripsi</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritakan tentang stasiun radio Anda..."
              rows={4}
              className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              <Tags className="w-4 h-4 text-zinc-400" />
              <span>Genre</span>
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Contoh: Pop, Rock, J-Pop"
              className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/50 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
