import { TopBar } from "@/components/TopBar";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import { RoleGuard } from "@/components/RoleGuard";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard>
      <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        <EmployeeSidebar />
        <main className="flex-1 flex flex-col h-full overflow-y-auto">
          <TopBar />
          <div className="flex-1 p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
