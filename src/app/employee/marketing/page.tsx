import { RoleGuard } from "@/components/RoleGuard";

export default function MarketingPage() {
  return (
    <RoleGuard allowedDivisions={["Marketing"]}>
      <div className="max-w-5xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white">Marketing Division</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Manage advertising campaigns and public relations.
          </p>
        </header>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
          <p className="text-zinc-600 dark:text-zinc-400">Content for Marketing staff goes here.</p>
        </div>
      </div>
    </RoleGuard>
  );
}
