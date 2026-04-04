import {
  LayoutDashboard,
  Wifi,
  FileSearch,
  Globe,
  Mail,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import type { Page } from "../../store/useStore";

const navItems: { id: Page; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "pcap", label: "PCAP Analyzer", icon: Wifi, badge: 4 },
  { id: "fileScanner", label: "File Scanner", icon: FileSearch },
  { id: "urlAnalyzer", label: "URL Analyzer", icon: Globe },
  { id: "emailAnalyzer", label: "Email Analyzer", icon: Mail },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { currentPage, sidebarCollapsed, setPage, toggleSidebar } = useStore();

  return (
    <aside
      className="fixed left-0 top-0 h-full z-20 flex flex-col border-r border-purple-900/30 bg-[#0a0a1f]/90 backdrop-blur-md transition-all duration-300"
      style={{ width: sidebarCollapsed ? "64px" : "240px" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-purple-900/30">
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.6)]">
            <Shield size={16} className="text-white" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <div className="text-sm font-bold tracking-widest text-purple-300 uppercase">
              CyberGuard
            </div>
            <div className="text-[10px] text-slate-500 tracking-wider">SOC Platform v2.4</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ id, label, icon: Icon, badge }) => {
          const active = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 relative
                ${active
                  ? "bg-purple-900/40 text-purple-300 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.4)]"
                  : "text-slate-400 hover:bg-purple-900/20 hover:text-slate-200"
                }`}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-purple-400 rounded-r shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
              )}
              <Icon
                size={17}
                className={`flex-shrink-0 transition-colors ${active ? "text-purple-400" : "text-slate-500 group-hover:text-slate-300"}`}
              />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-sm font-medium tracking-wide">{label}</span>
                  {badge && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded border border-red-500/30 font-bold">
                      {badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Status indicator */}
      {!sidebarCollapsed && (
        <div className="mx-3 mb-3 p-3 rounded-lg bg-emerald-900/20 border border-emerald-800/30">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={12} className="text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">System Online</span>
          </div>
          <div className="text-[10px] text-slate-500">All engines operational</div>
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-10 border-t border-purple-900/30 text-slate-500 hover:text-purple-400 transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}