"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Users,
  Megaphone,
  Settings,
  Menu,
  X,
  FileText
} from "lucide-react";

const employeeMenuItems = [
  { icon: Briefcase, label: "Employee Dashboard", href: "/employee" },
  { icon: Megaphone, label: "Marketing", href: "/employee/marketing" },
  { icon: Users, label: "HR System", href: "/employee/hr" },
  { icon: FileText, label: "Recruitment", href: "/employee/recruitment" },
];

function EmployeeSidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="h-20 flex flex-shrink-0 items-center px-6 border-b border-zinc-200 dark:border-zinc-800 relative">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg leading-tight block text-zinc-900 dark:text-white">
              XYZ Co
            </span>
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider block">
              Employee Portal
            </span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="absolute right-4 md:hidden p-2 text-zinc-500">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {employeeMenuItems.map((item) => {
          // Normalize paths for matching. In middleware rewrite, the pathname seen by client might still be '/' or it might be '/employee'
          // Actually, if it's rewritten, Next.js usePathname returns the rewritten path in app router.
          const isActive = pathname === item.href || (pathname === '/' && item.href === '/employee');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive
                  ? "bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? "scale-110" : "group-hover:scale-110"} transition-transform`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function EmployeeSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <div className="md:hidden flex items-center justify-between bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-zinc-900 dark:text-white">Employee Portal</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-zinc-500">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <aside className="relative w-64 bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full animate-in slide-in-from-left duration-300">
            <EmployeeSidebarContent onClose={() => setIsMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      <aside className="hidden md:flex w-64 bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800 flex-col h-screen flex-shrink-0">
        <EmployeeSidebarContent />
      </aside>
    </>
  );
}
