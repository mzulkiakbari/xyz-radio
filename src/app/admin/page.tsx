"use client";

import { useState, useEffect } from "react";
import { Loader2, Send, Plus, Trash2, Image as ImageIcon } from "lucide-react";

interface TextChannel {
  id: string;
  name: string;
  type: number;
}

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  textChannels: TextChannel[];
}

interface EmbedData {
  title: string;
  description: string;
  color: string;
  footer: string;
  imageUrl: string;
}

export default function AdminDashboard() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<string>("");
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  
  const [content, setContent] = useState("");
  const [useEmbed, setUseEmbed] = useState(false);
  const [embed, setEmbed] = useState<EmbedData>({
    title: "",
    description: "",
    color: "#3b82f6", // Default blue
    footer: "",
    imageUrl: ""
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/bot/text-channels`);
      const json = await res.json();
      if (json.success) {
        setGuilds(json.data);
        if (json.data.length > 0) {
          setSelectedGuild(json.data[0].id);
          if (json.data[0].textChannels.length > 0) {
            setSelectedChannel(json.data[0].textChannels[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Gagal mengambil daftar channel:", err);
    }
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!selectedChannel) return alert("Pilih channel terlebih dahulu!");
    if (!content && !useEmbed) return alert("Isi pesan atau aktifkan embed!");

    setIsSending(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      
      const payload: any = { channelId: selectedChannel };
      if (content) payload.content = content;
      
      if (useEmbed) {
        const embedPayload: any = {};
        if (embed.title) embedPayload.title = embed.title;
        if (embed.description) embedPayload.description = embed.description;
        if (embed.color) embedPayload.color = parseInt(embed.color.replace("#", ""), 16);
        if (embed.footer) embedPayload.footer = { text: embed.footer };
        if (embed.imageUrl) embedPayload.image = { url: embed.imageUrl };
        
        payload.embeds = [embedPayload];
      }

      const res = await fetch(`${backendUrl}/api/bot/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      
      if (json.success) {
        alert("Pesan berhasil dikirim!");
        setContent("");
      } else {
        alert("Gagal: " + json.error);
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem.");
    }
    setIsSending(false);
  };

  const activeGuild = guilds.find(g => g.id === selectedGuild);

  return (
    <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white">Discord Message Generator</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Kirim pengumuman atau pesan dengan tampilan profesional ke server Discord Anda.
        </p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        
        {/* LEFT PANEL: EDITOR */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm overflow-y-auto">
          <h2 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-4">Editor</h2>
          
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : (
            <div className="space-y-6">
              {/* Channel Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Server (Guild)</label>
                  <select 
                    value={selectedGuild}
                    onChange={(e) => {
                      setSelectedGuild(e.target.value);
                      const g = guilds.find(x => x.id === e.target.value);
                      if (g && g.textChannels.length > 0) setSelectedChannel(g.textChannels[0].id);
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white"
                  >
                    {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Channel</label>
                  <select 
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white"
                  >
                    {activeGuild?.textChannels.map(c => <option key={c.id} value={c.id}># {c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Normal Content */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Pesan Teks Normal</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-32 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-zinc-900 dark:text-white resize-none" 
                  placeholder="Ketik pesan Anda disini (mendukung markdown Discord)..."
                ></textarea>
              </div>

              {/* Embed Toggle */}
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white">Gunakan Embed</h3>
                  <p className="text-xs text-zinc-500">Kirim pesan dengan format Rich Embed</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={useEmbed} onChange={() => setUseEmbed(!useEmbed)} />
                  <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Embed Editor */}
              {useEmbed && (
                <div className="space-y-4 p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Warna Garis Kiri</label>
                    <div className="flex items-center space-x-3">
                      <input type="color" value={embed.color} onChange={(e) => setEmbed({...embed, color: e.target.value})} className="w-10 h-10 rounded border-0 bg-transparent cursor-pointer" />
                      <input type="text" value={embed.color} onChange={(e) => setEmbed({...embed, color: e.target.value})} className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white uppercase font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Title</label>
                    <input type="text" value={embed.title} onChange={(e) => setEmbed({...embed, title: e.target.value})} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white" placeholder="Embed Title" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Description</label>
                    <textarea value={embed.description} onChange={(e) => setEmbed({...embed, description: e.target.value})} className="w-full h-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white resize-none" placeholder="Embed Description (Markdown supported)"></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Image URL (Optional)</label>
                    <input type="text" value={embed.imageUrl} onChange={(e) => setEmbed({...embed, imageUrl: e.target.value})} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Footer Text</label>
                    <input type="text" value={embed.footer} onChange={(e) => setEmbed({...embed, footer: e.target.value})} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white" placeholder="Footer content" />
                  </div>
                </div>
              )}

              <button 
                onClick={handleSend}
                disabled={isSending || (!content && !useEmbed)}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                <span>Kirim Pesan ke Discord</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: LIVE PREVIEW */}
        <div className="bg-[#313338] border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
          <div className="bg-[#2b2d31] px-4 py-3 border-b border-[#1e1f22] flex items-center shadow-sm relative z-10">
            <span className="text-[#80848e] text-xl font-medium mr-2">#</span>
            <span className="font-bold text-white tracking-wide">{activeGuild?.textChannels.find(c => c.id === selectedChannel)?.name || "channel-preview"}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            <div className="flex mt-4 hover:bg-[#2e3035] p-1 -mx-1 rounded transition-colors group">
              <div className="flex-shrink-0 mr-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">XYZ</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline space-x-2 mb-1">
                  <span className="font-medium text-white hover:underline cursor-pointer">XYZ Bot</span>
                  <span className="text-xs text-[#949ba4] bg-[#5865f2] text-white px-1.5 rounded uppercase font-bold tracking-wider" style={{fontSize: '10px', paddingTop: '1px', paddingBottom: '1px'}}>Bot</span>
                  <span className="text-xs text-[#949ba4]">Hari ini pukul 12:00</span>
                </div>
                
                {/* Normal Content Preview */}
                {content && (
                  <div className="text-[#dbdee1] leading-relaxed whitespace-pre-wrap break-words mb-1">
                    {content}
                  </div>
                )}

                {/* Embed Preview */}
                {useEmbed && (embed.title || embed.description || embed.imageUrl || embed.footer) && (
                  <div className="mt-2 flex">
                    <div 
                      className="w-1 rounded-l flex-shrink-0" 
                      style={{ backgroundColor: embed.color || '#202225' }}
                    ></div>
                    <div className="bg-[#2b2d31] rounded-r p-4 flex flex-col w-full max-w-lg border border-[#1e1f22]/50 shadow-sm">
                      
                      {embed.title && (
                        <div className="font-bold text-white mb-2 leading-tight">
                          {embed.title}
                        </div>
                      )}
                      
                      {embed.description && (
                        <div className="text-[#dbdee1] text-sm leading-relaxed whitespace-pre-wrap break-words mb-4">
                          {embed.description}
                        </div>
                      )}
                      
                      {embed.imageUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden max-w-sm border border-[#1e1f22]">
                          <img src={embed.imageUrl} alt="Embed" className="object-contain w-full h-full max-h-80" onError={(e) => e.currentTarget.style.display = 'none'} />
                        </div>
                      )}

                      {embed.footer && (
                        <div className="mt-4 flex items-center space-x-2">
                          <span className="text-[#949ba4] text-xs font-medium">{embed.footer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
          
          <div className="p-4 bg-[#313338] relative z-10">
            <div className="bg-[#383a40] rounded-lg px-4 py-3 flex items-center cursor-not-allowed">
              <Plus className="w-6 h-6 text-[#b5bac1] mr-3" />
              <span className="text-[#80848e] text-sm">Pesan preview mode (Anda tidak dapat mengetik disini)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
