"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Loader2, Plus, Settings, X, Send } from "lucide-react";

export default function RecruitmentPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isOpenRecruitmentModal, setIsOpenRecruitmentModal] = useState(false);
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);

  // Open Recruitment State
  const [batch, setBatch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [isSendingOpen, setIsSendingOpen] = useState(false);

  // Format Modal State
  const [applyMessage, setApplyMessage] = useState("");
  const [isSavingFormat, setIsSavingFormat] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: appsData } = await supabase
        .from("recruitment_applications")
        .select("*")
        .order("created_at", { ascending: false });
      
      const { data: divsData } = await supabase
        .from("divisions")
        .select("*")
        .order("name", { ascending: true });

      const { data: settingsData } = await supabase
        .from("recruitment_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (appsData) setApplications(appsData);
      if (divsData) {
        setDivisions(divsData);
        setSelectedDivisions(divsData.filter(d => d.is_open).map(d => d.name));
      }
      if (settingsData) {
        setApplyMessage(settingsData.apply_message?.content || "");
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data");
    }
    setIsLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("recruitment_applications")
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Status berhasil diubah");
      setApplications(apps => apps.map(app => app.id === id ? { ...app, status: newStatus } : app));
    } catch (err) {
      toast.error("Gagal mengubah status");
    }
  };

  const handleOpenRecruitment = async () => {
    if (!batch || !startDate || !endDate) return toast.error("Lengkapi Batch, Start Date, dan End Date!");
    
    setIsSendingOpen(true);
    try {
      // 1. Update divisions in DB
      for (const div of divisions) {
        const isOpen = selectedDivisions.includes(div.name);
        await supabase.from("divisions").update({ is_open: isOpen }).eq("name", div.name);
      }

      // 2. Trigger Bot API
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/bot/send-open-recruitment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch,
          startDate,
          endDate,
          divisions: selectedDivisions
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Recruitment berhasil dibuka dan pesan terkirim!");
        setIsOpenRecruitmentModal(false);
      } else {
        toast.error("Gagal: " + json.error);
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem.");
    }
    setIsSendingOpen(false);
  };

  const handleCloseRecruitment = async () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    try {
      // Reset is_open for all
      await supabase.from("divisions").update({ is_open: false }).neq("id", "00000000-0000-0000-0000-000000000000"); // dummy condition to update all rows
      setSelectedDivisions([]);
      
      const res = await fetch(`${backendUrl}/api/bot/send-close-recruitment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Recruitment ditutup!");
      } else {
        toast.error("Gagal: " + json.error);
      }
    } catch (err) {
      toast.error("Kesalahan jaringan.");
    }
  };

  const handleSaveFormat = async () => {
    setIsSavingFormat(true);
    try {
      // 1. Update Supabase
      const { error } = await supabase.from("recruitment_settings").upsert({
        id: 1,
        apply_message: { content: applyMessage },
      });

      if (error) throw error;

      // 2. Trigger Bot API to send Apply button message
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/bot/send-apply-format`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      
      const json = await res.json();
      if (json.success) {
        toast.success("Format berhasil disimpan dan pesan terkirim!");
        setIsFormatModalOpen(false);
      } else {
        toast.error("Gagal mengirim pesan Discord: " + json.error);
      }

    } catch (err) {
      toast.error("Gagal menyimpan format.");
    }
    setIsSavingFormat(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isRecruitmentOpen = selectedDivisions.length > 0;

  return (
    <div className="max-w-6xl mx-auto w-full p-4 md:p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-2">Recruitment</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Manajemen pelamar dan pendaftaran.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFormatModalOpen(true)}
            className="px-5 py-2.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold uppercase tracking-widest text-[11px] rounded-xl transition-all flex items-center gap-2"
          >
            <Settings className="w-4 h-4" /> Apply Format (Ticket)
          </button>
          
          {isRecruitmentOpen ? (
            <button
              onClick={handleCloseRecruitment}
              className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-[11px] rounded-xl transition-all shadow-sm"
            >
              Close Recruitment
            </button>
          ) : (
            <button
              onClick={() => setIsOpenRecruitmentModal(true)}
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-[11px] rounded-xl transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Open Recruitment
            </button>
          )}
        </div>
      </header>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50">
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Nama</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Divisi</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Tanggal</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                    Belum ada pelamar.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="border-b border-zinc-100 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-bold text-zinc-900 dark:text-white">
                      {app.name} <span className="text-[10px] text-zinc-500 block font-normal">@{app.discord_username}</span>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-zinc-700 dark:text-zinc-300">{app.division}</td>
                    <td className="py-4 px-6 text-sm text-zinc-500">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="py-4 px-6">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg outline-none border cursor-pointer ${
                          app.status === 'pass' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                          app.status === 'pending' ? 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700' :
                          'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="received">Received</option>
                        <option value="interview">Interview</option>
                        <option value="assesment_stage">Assesment Stage</option>
                        <option value="pass">Pass (Lolos)</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Open Recruitment */}
      {isOpenRecruitmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-widest text-zinc-900 dark:text-white">Buka Recruitment</h3>
              <button onClick={() => setIsOpenRecruitmentModal(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Batch</label>
                <input type="text" value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="Contoh: 15" className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 text-sm outline-none focus:border-primary transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Start Date</label>
                  <input type="text" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="10 Sept 2026" className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 text-sm outline-none focus:border-primary transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">End Date</label>
                  <input type="text" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="20 Sept 2026" className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 text-sm outline-none focus:border-primary transition-colors" />
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Divisi yang Dibuka</label>
                <div className="grid grid-cols-2 gap-3">
                  {divisions.map(div => (
                    <label key={div.id} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedDivisions.includes(div.name)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedDivisions([...selectedDivisions, div.name]);
                          else setSelectedDivisions(selectedDivisions.filter(d => d !== div.name));
                        }}
                        className="w-4 h-4 rounded text-primary focus:ring-primary border-zinc-300 dark:border-zinc-700" 
                      />
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{div.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-zinc-200 dark:border-white/10 flex justify-end">
              <button 
                onClick={handleOpenRecruitment} 
                disabled={isSendingOpen}
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-[11px] rounded-xl transition-all flex items-center gap-2"
              >
                {isSendingOpen ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Kirim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Format Form (Simplified) */}
      {isFormatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between shrink-0">
              <h3 className="font-black text-sm uppercase tracking-widest text-zinc-900 dark:text-white">Pengaturan Apply Format</h3>
              <button onClick={() => setIsFormatModalOpen(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pesan Pengantar di Discord</label>
                <textarea 
                  value={applyMessage} 
                  onChange={(e) => setApplyMessage(e.target.value)} 
                  placeholder="Klik tombol Apply di bawah untuk mendaftar..." 
                  className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 text-sm outline-none focus:border-primary transition-colors min-h-[100px] resize-none" 
                />
              </div>
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/20 text-xs text-blue-800 dark:text-blue-300 font-medium">
                Pesan form statis otomatis dikirimkan oleh bot melalui sistem tiket setelah pelamar menekan tombol Apply.
              </div>
            </div>
            <div className="p-6 border-t border-zinc-200 dark:border-white/10 flex justify-end shrink-0">
              <button 
                onClick={handleSaveFormat} 
                disabled={isSavingFormat}
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-[11px] rounded-xl transition-all flex items-center gap-2"
              >
                {isSavingFormat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Simpan & Kirim Pesan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
