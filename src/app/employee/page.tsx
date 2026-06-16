export default function EmployeeDashboard() {
  return (
    <div className="max-w-5xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white">Employee Dashboard</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Welcome to the XYZ Co Employee Portal.
        </p>
      </header>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">Announcements</h2>
        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
          <p className="text-blue-800 dark:text-blue-300 font-medium">Welcome to the new portal!</p>
          <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">Please make sure to link your Discord account to access the full features.</p>
        </div>
      </div>
    </div>
  );
}
