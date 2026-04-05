import { useEffect, useState } from "react";
import {
  Shield, AlertTriangle, Activity, TrendingUp,
  Clock, Wifi, FileText, Globe, Mail, ChevronRight, Zap, AlertCircle, CheckCircle, Loader,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card, StatCard, SectionTitle, RiskBadge, ProgressBar, AlertItem } from "../../components/ui";
import { useDashboardStore } from "../../store/dashboardStore";
import { useDashboardData } from "../../hooks/useDashboardData";
import {
  formatRelativeTime,
  formatNumber,
  getRiskLevel,
  getRiskColor,
  formatLatency,
  parseLatency,
  formatUptime,
  getGradientColor,
} from "../../hooks/formatters";
import type { Page } from "../../store/useStore";

// ─── LOADING SKELETONS ─────────────────────────────────────────────────────────

function SkeletonStat() {
  return (
    <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/30 animate-pulse">
      <div className="h-3 bg-slate-700/50 rounded w-24 mb-2" />
      <div className="h-8 bg-slate-700/50 rounded w-12 mb-2" />
      <div className="h-2 bg-slate-700/50 rounded w-20" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="h-2 bg-slate-700/50 rounded flex-1 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ─── REAL-TIME CHART COMPONENTS ────────────────────────────────────────────────

function TimelineChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <SkeletonChart />;

  const maxPackets = Math.max(...data.map((d) => d.packets), 1);
  const maxThreats = Math.max(...data.map((d) => d.threats), 1);
  const w = 100;
  const h = 80;

  const packetPts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (d.packets / maxPackets) * h;
      return `${x},${y}`;
    })
    .join(" ");

  const threatPts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (d.threats / maxThreats) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="relative">
      <svg width="100%" height="100" viewBox={`0 0 100 ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill="url(#pGrad)" points={`0,${h} ${packetPts} ${w},${h}`} />
        <polyline fill="none" stroke="#a855f7" strokeWidth="0.5" points={packetPts} />
        <polyline fill="none" stroke="#f87171" strokeWidth="0.5" strokeDasharray="2,1" points={threatPts} />
      </svg>
      <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-purple-500 inline-block" /> Network
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-red-400 inline-block border-dashed border" /> Threats
        </span>
      </div>
    </div>
  );
}

function ThreatChart({ data }: { data: any }) {
  if (!data) return <SkeletonChart />;

  const categories = [
    { label: "Malware", value: data.malware, color: "#f87171" },
    { label: "Phishing", value: data.phishing, color: "#fb923c" },
    { label: "Suspicious", value: data.suspicious, color: "#facc15" },
    { label: "Safe", value: data.safe, color: "#22c55e" },
  ];

  const max = Math.max(...categories.map((c) => c.value));

  return (
    <div className="space-y-3">
      {categories.map((c) => (
        <div key={c.label} className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 w-16 text-right font-mono">{c.label}</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(c.value / (max || 1)) * 100}%`, background: c.color, boxShadow: `0 0 6px ${c.color}80` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 w-12 font-mono">{c.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN DASHBOARD COMPONENT ──────────────────────────────────────────────────

export function Dashboard() {
  const { setPage } = useStore();
  const store = useDashboardStore();
  const { refetch } = useDashboardData({ poll: 5000 });
  const [clock, setClock] = useState(new Date());

  // Real-time clock that syncs with server
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Manually refetch all data (user can trigger)
  const handleRefresh = async () => {
    await refetch.all();
  };

  const { summary, timeline, threats, activities, alerts, health, loading, errors } = store;
  const activeThreats = store.getActiveThreatCount();
  const criticalAlerts = store.getCriticalAlertCount();
  const isLoading = store.isAnythingLoading();
  const lastUpdate = store.getLastUpdateTime();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Live Indicator & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-wide">Security Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time threat intelligence · Last updated {lastUpdate ? formatRelativeTime(lastUpdate.toISOString()) : "never"}
            {isLoading && <span className="ml-2 inline-flex items-center gap-1"><Loader size={10} className="animate-spin" /> Updating...</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-900/20 border border-blue-800/30 hover:border-blue-700/40 transition-colors disabled:opacity-50"
          >
            <Zap size={13} className="text-blue-400" />
            <span className="text-[11px] text-blue-400 font-medium">Refresh</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-900/20 border border-emerald-800/30">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
            <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>

      {/* Stat cards with real-time data */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {loading.summary ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : summary ? (
          <>
            <StatCard
              title="Total Scans"
              value={formatNumber(summary.total_scans)}
              icon={Shield}
              color="purple"
              trend={`↑ ${summary.total_scans} all-time`}
              sub="Real-time count"
            />
            <StatCard
              title="Threats Detected"
              value={formatNumber(summary.threats_detected)}
              icon={AlertTriangle}
              color="red"
              trend={`${activeThreats} active`}
              sub="Requires attention"
            />
            <StatCard
              title="Risk Score"
              value={`${summary.risk_score}%`}
              icon={Activity}
              color={summary.risk_score >= 60 ? "red" : summary.risk_score >= 40 ? "amber" : "emerald"}
              sub="Platform-wide"
            />
            <StatCard
              title="Avg Response"
              value={summary.avg_response_time}
              icon={TrendingUp}
              color="cyan"
              trend="↓ Latest scan"
              sub="Analysis time"
            />
          </>
        ) : (
          <div className="col-span-4 text-center text-slate-500 py-6">
            {errors.summary && <p className="text-red-400 text-sm">{errors.summary}</p>}
          </div>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Traffic timeline */}
        <Card className="lg:col-span-2" glow>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle sub="Activity distribution over time">Traffic Timeline</SectionTitle>
            {loading.timeline && <Loader size={13} className="text-purple-400 animate-spin" />}
          </div>
          {errors.timeline ? (
            <p className="text-red-400 text-xs p-4">{errors.timeline}</p>
          ) : (
            <TimelineChart data={timeline} />
          )}
        </Card>

        {/* Threat distribution */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle sub={`From ${threats ? Object.values(threats).reduce((a, b) => a + b, 0) : 0} detections`}>
              Threat Distribution
            </SectionTitle>
            {loading.threats && <Loader size={13} className="text-purple-400 animate-spin" />}
          </div>
          {errors.threats ? (
            <p className="text-red-400 text-xs p-4">{errors.threats}</p>
          ) : (
            <ThreatChart data={threats} />
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle sub={`Last ${activities.length} events across all analyzers`}>Recent Activity</SectionTitle>
            {loading.activities && <Loader size={13} className="text-purple-400 animate-spin" />}
          </div>

          <div className="space-y-2">
            {errors.activities ? (
              <p className="text-red-400 text-xs p-4">{errors.activities}</p>
            ) : activities.length > 0 ? (
              activities.slice(0, 6).map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/40 hover:bg-slate-800/40 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-900/30 border border-purple-800/40 flex items-center justify-center flex-shrink-0">
                    {activity.type === "pcap" && <Wifi size={13} className="text-purple-400" />}
                    {activity.type === "file" && <FileText size={13} className="text-purple-400" />}
                    {activity.type === "url" && <Globe size={13} className="text-purple-400" />}
                    {activity.type === "email" && <Mail size={13} className="text-purple-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate capitalize">{activity.type} {activity.status}</p>
                    <p className="text-[10px] text-slate-500 truncate">{activity.message}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: activity.status === "clean" ? "#22c55e" : activity.status === "suspicious" ? "#eab308" : "#ef4444" }}
                    />
                    <div className="flex items-center gap-1 text-[10px] text-slate-600">
                      <Clock size={9} />
                      {formatRelativeTime(activity.timestamp)}
                    </div>
                  </div>
                  <ChevronRight size={13} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500 text-sm">No recent activity. Run a scan to get started.</div>
            )}
          </div>
        </Card>

        {/* Quick actions + system health */}
        <div className="space-y-4">
          <Card>
            <SectionTitle>Quick Scan</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["PCAP", Wifi, "pcap" as Page],
                  ["File", FileText, "fileScanner" as Page],
                  ["URL", Globe, "urlAnalyzer" as Page],
                  ["Email", Mail, "emailAnalyzer" as Page],
                ] as [string, React.ElementType, Page][]
              ).map(([label, Icon, page]) => (
                <button
                  key={label}
                  onClick={() => setPage(page)}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-900/50 hover:bg-purple-900/20 border border-purple-900/20 hover:border-purple-700/40 transition-all group"
                >
                  <Icon size={18} className="text-purple-400 group-hover:text-purple-300" />
                  <span className="text-[11px] text-slate-400 group-hover:text-slate-200 font-medium">{label}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <SectionTitle>System Health</SectionTitle>
              {loading.health && <Loader size={13} className="text-emerald-400 animate-spin" />}
            </div>
            {errors.health ? (
              <p className="text-red-400 text-xs">{errors.health}</p>
            ) : health ? (
              <div className="space-y-3">
                {Object.entries(health).map(([key, _]) => {
                  const status = health[key as keyof typeof health];
                  const isHealthy = typeof status === "object" ? status.status === "healthy" : status > 90;
                  return (
                    <ProgressBar
                      key={key}
                      label={key.replace(/_/g, " ").toUpperCase()}
                      value={typeof status === "object" ? status.uptime : status}
                      color={isHealthy ? "emerald" : "amber"}
                      showLabel
                    />
                  );
                })}
              </div>
            ) : (
              <SkeletonChart />
            )}
          </Card>
        </div>
      </div>

      {/* Alert Feed */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle sub={alerts.length > 0 ? "Active security findings" : "System status"}>Alert Feed</SectionTitle>
          {loading.alerts && <Loader size={13} className="text-red-400 animate-spin" />}
          {criticalAlerts > 0 && <span className="text-xs text-red-400 font-bold">{criticalAlerts} CRITICAL</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {errors.alerts ? (
            <p className="text-red-400 text-xs">{errors.alerts}</p>
          ) : alerts.length > 0 ? (
            alerts.slice(0, 6).map((alert, i) => (
              <AlertItem
                key={i}
                severity={alert.severity || "medium"}
                title={alert.title}
                sub={formatRelativeTime(alert.timestamp)}
              />
            ))
          ) : (
            <div className="col-span-2 flex items-center gap-2 p-4 rounded-lg bg-emerald-900/20 border border-emerald-800/30">
              <CheckCircle size={13} className="text-emerald-400" />
              <span className="text-xs text-emerald-300">No active alerts</span>
            </div>
          )}
        </div>
      </Card>

      {/* Current Time (for reference) */}
      <div className="text-center text-xs text-slate-600">
        Server time: {clock.toLocaleTimeString()} UTC
      </div>
    </div>
  );
}