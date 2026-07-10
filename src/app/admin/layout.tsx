import { RoleGuard } from "@/components/RoleGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard requireAdmin={true}>
      <div className="flex flex-col h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-6 bg-white dark:bg-black">
          <span className="font-bold text-xl text-zinc-900 dark:text-white">Admin Control Panel</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
