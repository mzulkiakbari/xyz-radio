"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radio, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function EventLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const backendUrl = typeof window !== "undefined" ? "/api-backend" : (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001");
      const res = await fetch(`${backendUrl}/api/event/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem("event_token", data.token);
        localStorage.setItem("event_name", data.eventName);
        toast.success("Login successful!");
        router.push("/event");
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (err) {
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-lg dark:shadow-2xl relative overflow-hidden transition-colors duration-300">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
            <Radio className="w-10 h-10 text-indigo-400" />
          </div>

          <h1 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Event Host Login</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">Sign in to manage your event radio stream.</p>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center space-x-3 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Login</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
