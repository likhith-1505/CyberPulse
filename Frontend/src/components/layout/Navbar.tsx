import { Search, Bell, Sun, Moon, User, Activity } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useState } from "react";

const pageTitles: Record<string, string> = {
  dashboard: "Security Dashboard",
  pcap: "PCAP Network Analyzer",
  fileScanner: "File Scanner",
  urlAnalyzer: "URL Threat Analyzer",
  emailAnalyzer: "Email Header Analyzer",
  settings: "Platform Settings",
};

export function Navbar() {
  const { currentPage, theme, setTheme } = useStore();
  const [searchVal, setSearchVal] = useState("");
  const now = new Date().toLocaleTimeString("en-US", { hour12: false });

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-purple-900/30 bg-[#0a0a1f]/70 backdrop-blur-md flex-shrink-0">
      {/* Left: title */}
      <div>
        <h1 className="text-sm font-bold text-slate-100 tracking-widest uppercase">
          {pageTitles[currentPage]}
        </h1>
        <div className="flex items-center gap-2 mt-0.5">
          <Activity size={9} className="text-emerald-400 animate-pulse" />
          <span className="text-[10px] text-slate-500 font-mono">{now} UTC+0 · Live Feed Active</span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search IOCs, IPs, hashes..."
            className="w-56 pl-8 pr-3 py-1.5 text-xs bg-slate-800/50 border border-purple-900/30 rounded-lg text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/60 focus:shadow-[0_0_0_1px_rgba(139,92,246,0.3)] transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-900/20 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-900/20 transition-colors"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-purple-900/30">
          <div className="w-7 h-7 rounded-lg bg-purple-700 flex items-center justify-center shadow-[0_0_8px_rgba(139,92,246,0.4)]">
            <User size={13} className="text-white" />
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-semibold text-slate-200">Analyst</div>
            <div className="text-[10px] text-slate-500">SOC Level 3</div>
          </div>
        </div>
      </div>
    </header>
  );
}