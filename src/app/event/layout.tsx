import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Panel - XYZ Media",
  description: "Manage your Event Radio Stream",
};

export default function EventLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300">
      <main className="flex-1 overflow-x-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
