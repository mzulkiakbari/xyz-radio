"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Radio } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/portal");
      }
    });
  }, [router]);

  const handleDiscordLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      console.error("Login Error:", error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-lg dark:shadow-2xl relative overflow-hidden transition-colors duration-300">
        {/* Glow */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
            <Radio className="w-10 h-10 text-indigo-400" />
          </div>

          <h1 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white transition-colors duration-300">Welcome to XYZ Media by XYZ Corporation</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 transition-colors duration-300">Sign in to manage your radio streams and broadcast settings.</p>

          <button
            onClick={handleDiscordLogin}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center space-x-3 transition-colors shadow-lg shadow-[#5865F2]/20"
          >
            {/* Simple Discord Icon SVG */}
            <svg className="w-6 h-6 fill-current" viewBox="0 0 127.14 96.36">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.58,67.58,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-19.32-72.1M42.61,65.3c-5.36,0-9.82-5-9.82-11s4.38-11,9.82-11,9.86,5,9.82,11-4.46,11-9.82,11m41.92,0c-5.36,0-9.82-5-9.82-11s4.38-11,9.82-11,9.86,5,9.82,11-4.46,11-9.82,11" />
            </svg>
            <span>Login with Discord</span>
          </button>
        </div>
      </div>
    </div>
  );
}
