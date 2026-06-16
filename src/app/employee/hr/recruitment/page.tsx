"use client";

import { RoleGuard } from "@/components/RoleGuard";

export default function RecruitmentPage() {
  const handleOpenRecruitment = () => {
    // Integration logic with discord bot to send embed
    alert("Sending recruitment embed to Discord...");
  };

  return (
    <RoleGuard allowedDivisions={["HR"]} allowedPositions={["Head of HR"]}>
      <div className="max-w-5xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white">Recruitment Settings</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Open recruitment and manage discord bot form integrations.
          </p>
        </header>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Discord Bot Integration</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Click the button below to send the recruitment form to the Discord channel.
          </p>
          <button 
            onClick={handleOpenRecruitment}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            Open Recruitment (Send Embed)
          </button>
        </div>
      </div>
    </RoleGuard>
  );
}
