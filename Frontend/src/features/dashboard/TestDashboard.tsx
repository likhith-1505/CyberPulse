export function TestDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold text-white mb-4">CyberPulse Dashboard</h1>
      <p className="text-slate-300">If you can see this, the app is working!</p>
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-800/30">
          <p className="text-slate-300 text-sm">Total Scans</p>
          <p className="text-3xl font-bold text-purple-400">1247</p>
        </div>
        <div className="p-4 bg-red-900/30 rounded-lg border border-red-800/30">
          <p className="text-slate-300 text-sm">Threats</p>
          <p className="text-3xl font-bold text-red-400">83</p>
        </div>
      </div>
    </div>
  );
}
