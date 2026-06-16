export default function AdminDashboard() {
  return (
    <div className="max-w-5xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white">System Administration</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Control panel for technical administrators and bot managers.
        </p>
      </header>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">Bot Controller</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Use this interface to send manual messages through the Discord Bot.
        </p>
        
        <div className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Channel ID</label>
            <input type="text" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" placeholder="Enter Discord Channel ID" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Message Content</label>
            <textarea className="w-full h-32 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white resize-none" placeholder="Type your message here..."></textarea>
          </div>
          <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors w-full">
            Send Message as Bot
          </button>
        </div>
      </div>
    </div>
  );
}
