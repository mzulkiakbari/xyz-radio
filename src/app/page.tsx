"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Building2, MapPin, Mail, ChevronDown, Radio, Megaphone, ArrowRight, Menu, X, CheckCircle2 } from "lucide-react";

export default function CompanyProfile() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkUser();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
    setIsServiceOpen(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl tracking-tight">XYZ Co</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <div className="relative group">
                <button 
                  onClick={() => setIsServiceOpen(!isServiceOpen)}
                  className="flex items-center space-x-1 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  <span>Service</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isServiceOpen ? "rotate-180" : ""}`} />
                </button>
                {/* Dropdown */}
                <div className={`absolute top-full left-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-2 transition-all duration-200 ${isServiceOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"}`}>
                  <button onClick={() => scrollToSection("service-media")} className="w-full text-left p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group/item transition-colors">
                    <div className="flex items-center space-x-3 mb-1">
                      <Radio className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold text-zinc-900 dark:text-white">XYZ Media</span>
                    </div>
                    <p className="text-xs text-zinc-500 pl-8">Radio streaming & broadcast setup</p>
                  </button>
                  <button onClick={() => scrollToSection("service-ads")} className="w-full text-left p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group/item transition-colors">
                    <div className="flex items-center space-x-3 mb-1">
                      <Megaphone className="w-5 h-5 text-purple-500" />
                      <span className="font-semibold text-zinc-900 dark:text-white">XYZ Advertising</span>
                    </div>
                    <p className="text-xs text-zinc-500 pl-8">Creative ad campaigns & writing</p>
                  </button>
                </div>
              </div>
              <button onClick={() => scrollToSection("about")} className="text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">About Us</button>
              <button onClick={() => scrollToSection("location")} className="text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Location</button>
              <button onClick={() => scrollToSection("contact")} className="text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Contact Us</button>
            </div>

            {/* CTA / Login Button */}
            <div className="hidden md:flex items-center space-x-4">
              {isLoggedIn ? (
                <Link href="/panel" className="px-6 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all hover:scale-105 active:scale-95 flex items-center space-x-2">
                  <span>Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link href="/login" className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30">
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-zinc-600 dark:text-zinc-300">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top-2">
            <div className="py-2">
              <div className="font-semibold px-4 text-sm text-zinc-500 mb-2">Services</div>
              <button onClick={() => scrollToSection("service-media")} className="w-full text-left px-4 py-2 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg">XYZ Media</button>
              <button onClick={() => scrollToSection("service-ads")} className="w-full text-left px-4 py-2 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg">XYZ Advertising</button>
            </div>
            <button onClick={() => scrollToSection("about")} className="w-full text-left px-4 py-2 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg">About Us</button>
            <button onClick={() => scrollToSection("location")} className="w-full text-left px-4 py-2 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg">Location</button>
            <button onClick={() => scrollToSection("contact")} className="w-full text-left px-4 py-2 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg">Contact Us</button>
            <div className="pt-4 px-4">
              {isLoggedIn ? (
                <Link href="/panel" className="flex justify-center w-full px-6 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" className="flex justify-center w-full px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold">
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 dark:bg-blue-600/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen"></div>
          <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 dark:bg-purple-600/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-sm mb-8 border border-blue-100 dark:border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span>Based in Los Santos, San Andreas</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-8 leading-tight">
            Connecting Ecosystems.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Empowering Future.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed">
            XYZ Corporation mengintegrasikan berbagai sektor kebutuhan publik dan korporat, membangun infrastruktur media dan strategi periklanan yang andal.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button onClick={() => scrollToSection("about")} className="w-full sm:w-auto px-8 py-4 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all hover:scale-105">
              Discover Our Story
            </button>
            <button onClick={() => scrollToSection("service-media")} className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all hover:scale-105">
              Explore Services
            </button>
          </div>
        </div>
      </section>

      {/* Motto / Ribbon */}
      <div className="bg-blue-600 text-white py-6 border-y border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <h2 className="text-2xl font-bold italic opacity-90">&quot;Good Service, Good Deal&quot;</h2>
            <div className="flex items-center space-x-8 mt-4 md:mt-0 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
              <div className="flex items-center space-x-2 text-blue-100 whitespace-nowrap">
                <CheckCircle2 className="w-5 h-5" /> <span>Professionalism</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-100 whitespace-nowrap">
                <CheckCircle2 className="w-5 h-5" /> <span>System Stability</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-100 whitespace-nowrap">
                <CheckCircle2 className="w-5 h-5" /> <span>24/7 Availability</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Us */}
      <section id="about" className="py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-[3rem] transform -rotate-3 scale-105 -z-10 transition-transform duration-500 hover:rotate-0"></div>
              <div className="bg-zinc-50 dark:bg-zinc-900 p-8 md:p-12 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-xl">
                <h3 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-white">Awal Mula Perjalanan Kami</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                  XYZ Corporation, atau yang lebih dikenal dengan XYZ Co, didirikan di Los Santos, San Andreas oleh Julian Barry bersama rekan-rekannya Julius Karel dan Django Daughtrey.
                </p>
                <p className="text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                  Merintis dari bawah dengan kantor sementara di 101st Vice Street, Los Santos, kami percaya bahwa perusahaan besar tidak dibangun dalam semalam, melainkan melalui eksekusi strategi yang matang.
                </p>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                  Pada tahap awal ini, XYZ Co memulai pada sektor Media dan Periklanan untuk meletakkan batu pertama dalam mendanai ekspansi bisnis yang lebih besar.
                </p>
              </div>
            </div>
            
            <div className="space-y-12">
              <div>
                <h3 className="text-blue-600 dark:text-blue-400 font-bold tracking-wider uppercase text-sm mb-2">Visi</h3>
                <h4 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4 leading-snug">Menjadi Pusat Ekosistem Penyedia Jasa Publik</h4>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Menjadi pusat ekosistem penyedia jasa publik maupun korporat dengan solusi yang paling andal, inovatif, dan terintegrasi di seluruh wilayah San Andreas.
                </p>
              </div>

              <div>
                <h3 className="text-purple-600 dark:text-purple-400 font-bold tracking-wider uppercase text-sm mb-4">Misi</h3>
                <ul className="space-y-4">
                  {[
                    "Membangun infrastruktur media penyiaran AutoDJ dan Podcast yang ramah pengguna dan terjangkau.",
                    "Mengoptimalkan potensi setiap lini bisnis baru secara bertahap dengan memanfaatkan kekuatan kas internal.",
                    "Menyediakan wadah sektor jasa yang berkualitas, tertib, dan inklusif."
                  ].map((item, i) => (
                    <li key={i} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
                        {i + 1}
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-400 mt-1">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-6">Layanan Kami</h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Kami berkomitmen memberikan pelayanan terbaik dalam transmisi penyiaran dan periklanan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Media Service */}
            <div id="service-media" className="group bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Radio className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">XYZ Media</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                Menyediakan jasa pembuatan radio streaming 24/7 dengan kualitas yang baik dan mendukung bantuan bagi klien yang ingin membangun radio di rumah, bisnis, maupun perusahaan.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3 text-zinc-600 dark:text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  <span>Transmisi AutoDJ & Podcast 24/7</span>
                </li>
                <li className="flex items-center space-x-3 text-zinc-600 dark:text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  <span>Kestabilan Sistem Prioritas Utama</span>
                </li>
              </ul>
            </div>

            {/* Advertising Service */}
            <div id="service-ads" className="group bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Megaphone className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">XYZ Advertising</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                Menyediakan jasa periklanan yang berkualitas dan berprofesional, kami juga membantu klien dalam menulis iklan yang baik dan kreatif dengan harga terjangkau.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3 text-zinc-600 dark:text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-purple-500" />
                  <span>Strategi Periklanan Terarah</span>
                </li>
                <li className="flex items-center space-x-3 text-zinc-600 dark:text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-purple-500" />
                  <span>Copywriting Kreatif & Menarik</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Structure & Goals */}
      <section className="py-24 bg-white dark:bg-zinc-950 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Company Structure */}
            <div>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">Struktur Perusahaan</h2>
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 space-y-4">
                
                {/* Executive Level */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <span className="font-bold text-zinc-900 dark:text-white">CEO</span>
                    <span className="text-zinc-600 dark:text-zinc-300">Julian Barry</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col justify-center">
                      <span className="font-bold text-zinc-900 dark:text-white mb-1">CHRO</span>
                      <span className="text-zinc-600 dark:text-zinc-400 text-sm">Julius Karel</span>
                    </div>
                    <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col justify-center">
                      <span className="font-bold text-zinc-900 dark:text-white mb-1">CFO</span>
                      <span className="text-zinc-400 dark:text-zinc-500 text-sm italic">Vacant</span>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800 my-4"></div>

                {/* Directors Level */}
                <div className="space-y-4">
                  <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-zinc-900 dark:text-white">CMO</span>
                      <span className="text-zinc-400 dark:text-zinc-500 text-sm italic">Vacant</span>
                    </div>
                    <div className="pl-4 border-l-2 border-zinc-200 dark:border-zinc-800">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">Head of Marketing</span>
                        <span className="text-zinc-400 dark:text-zinc-500 italic">Vacant</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">Marketing Staff</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-zinc-900 dark:text-white">COO</span>
                      <span className="text-zinc-600 dark:text-zinc-300">Django Daughtrey</span>
                    </div>
                    <div className="pl-4 border-l-2 border-zinc-200 dark:border-zinc-800">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">Head of Media</span>
                        <span className="text-zinc-400 dark:text-zinc-500 italic">Vacant</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">Media Staff</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <div className="pl-4 border-l-2 border-zinc-200 dark:border-zinc-800">
                       <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Human Resources Staff</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Future Goals */}
            <div className="flex flex-col justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-8 shadow-lg shadow-orange-500/20">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6">Future Goals & Ekspansi</h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8">
                Demi dapat menjangkau semua kebutuhan pasar, di masa mendatang kami akan melebarkan sayap bisnis ke berbagai sektor strategis:
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {["Automotive", "Jasa Sewa", "Home Decor", "Firma Hukum"].map((sector, idx) => (
                  <div key={idx} className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="font-semibold text-zinc-900 dark:text-white">{sector}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer / Location / Contact */}
      <footer id="location" className="bg-zinc-950 text-white pt-20 pb-10 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
            
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight">XYZ Co</span>
              </div>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Mengintegrasikan kebutuhan publik dan korporat melalui pelayanan profesional.
              </p>
              <p className="text-blue-400 font-medium italic">&quot;Good Service, Good Deal&quot;</p>
            </div>

            {/* Location */}
            <div>
              <h4 className="text-lg font-bold mb-6">Lokasi Kami</h4>
              <div className="flex items-start space-x-4 group">
                <div className="p-3 bg-zinc-900 rounded-xl group-hover:bg-blue-600/20 transition-colors">
                  <MapPin className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-zinc-300 font-medium mb-1">Kantor Utama</p>
                  <p className="text-zinc-500 leading-relaxed">
                    101st Vice Street,<br/>
                    Los Santos, San Andreas
                  </p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div id="contact">
              <h4 className="text-lg font-bold mb-6">Hubungi Kami</h4>
              <div className="flex items-start space-x-4 group mb-4">
                <div className="p-3 bg-zinc-900 rounded-xl group-hover:bg-purple-600/20 transition-colors">
                  <Mail className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-zinc-300 font-medium mb-1">Email inquiries</p>
                  <p className="text-zinc-500">contact@xyzco.sa</p>
                </div>
              </div>
              <div className="mt-8">
                {isLoggedIn ? (
                  <Link href="/panel" className="inline-block px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors">
                    Akses Dashboard
                  </Link>
                ) : (
                  <Link href="/login" className="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
                    Login Portal
                  </Link>
                )}
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-zinc-900 text-center text-zinc-600 text-sm">
            &copy; {new Date().getFullYear()} XYZ Corporation. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
