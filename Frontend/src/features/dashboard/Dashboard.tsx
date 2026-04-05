import { useEffect, useState } from "react";
import {
  Shield, AlertTriangle, Activity, TrendingUp,
  Clock, Eye, Wifi, FileText, Globe, Mail, ChevronRight,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card, StatCard, SectionTitle, RiskBadge, ProgressBar, AlertItem } from "../../components/ui";
import { api, type RecentScan } from "../../services/api";
import type { Page } from "../../store/useStore";

// ─── Simple SVG mini-chart ────────────────────────────────────────────────────
function SparkLine({ data, color = "#a855f7" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 40;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts} strokeLinejoin="round" />
    </svg>
  );
}

// ─── Bar chart (horizontal) ───────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 w-16 text-right font-mono">{d.label}</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color, boxShadow: `0 0 6px ${d.color}80` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 w-12 font-mono">{d.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Traffic timeline ─────────────────────────────────────────────────────────
function TrafficChart({ scans }: { scans: RecentScan[] }) {
  // Group scans by type and calculate distribution
  const scansByType: Record<string, number> = {};
  const threatsByType: Record<string, number> = {};
  
  scans.forEach(scan => {
    const type = scan.type.toLowerCase();
    scansByType[type] = (scansByType[type] || 0) + 1;
    threatsByType[type] = (threatsByType[type] || 0) + scan.threat_count;
  });

  // Create synthetic timeline data from scan data
  const types = Object.keys(scansByType).length > 0 ? Object.keys(scansByType) : ["pcap", "url", "file", "email"];
  const trafficData = Array.from({ length: 12 }, (_, i) => ({
    time: `${i * 2}h`,
    packets: Math.floor((scansByType[types[i % types.length]] || 0) * (Math.random() * 2 + 1) * 1000),
    threats: Math.floor((threatsByType[types[i % types.length]] || 0) * (Math.random() * 2 + 1) * 5),
  }));

  const maxP = Math.max(...trafficData.map((d) => d.packets), 1);
  const maxT = Math.max(...trafficData.map((d) => d.threats), 1);
  const w = 100;
  const h = 80;

  const packetPts = trafficData
    .map((d, i) => {
      const x = (i / (trafficData.length - 1)) * w;
      const y = h - (d.packets / maxP) * h;
      return `${x},${y}`;
    })
    .join(" ");

  const threatPts = trafficData
    .map((d, i) => {
      const x = (i / (trafficData.length - 1)) * w;
      const y = h - (d.threats / maxT) * h;
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
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-purple-500 inline-block" /> Packets</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-400 inline-block border-dashed border" /> Threats</span>
      </div>
    </div>
  );
}


// ─── Threat distribution ──────────────────────────────────────────────────────
function calculateThreatDistribution(scans: RecentScan[]): { label: string; value: number; color: string }[] {
  const distribution: Record<string, number> = {
    "Malware": 0,
    "Phishing": 0,
    "Suspicious": 0,
    "Security": 0,
    "Other": 0,
  };

  scans.forEach(scan => {
    const type = scan.type.toLowerCase();
    if (type === "url" && scan.result.toLowerCase().includes("phish")) {
      distribution["Phishing"] += scan.threat_count;
    } else if (type === "file" && scan.threat_count > 0) {
      distribution["Malware"] += scan.threat_count;
    } else if (type === "email" && scan.threat_count > 0) {
      distribution["Phishing"] += scan.threat_count;
    } else if (type === "pcap" && scan.threat_count > 0) {
      distribution["Security"] += scan.threat_count;
    } else if (scan.threat_count > 0) {
      distribution["Suspicious"] += scan.threat_count;
    }
  });

  const colors = ["#f87171", "#fb923c", "#facc15", "#a855f7", "#60a5fa"];
  return Object.entries(distribution)
    .map(([label, value], i) => ({
      label,
      value: Math.max(value, 1), // Ensure at least 1 for display
      color: colors[i % colors.length],
    }))
    .filter((_, i) => i < 5);
}

// ─── Alert generation ───────────────────────────────────────────────────────────
function generateAlerts(scans: RecentScan[]): Array<{ severity: "high" | "medium" | "low"; title: string; sub: string }> {
  const alerts: Array<{ severity: "high" | "medium" | "low"; title: string; sub: string }> = [];

  scans.slice(0, 6).forEach(scan => {
    const time = formatRelativeTime(scan.timestamp);
    const type = scan.type.charAt(0).toUpperCase() + scan.type.slice(1);

    if (scan.result.toLowerCase() === "dangerous" || scan.threat_count > 2) {
      alerts.push({
        severity: "high",
        title: `${type} analysis - HIGH RISK detected`,
        sub: `${scan.result} · ${time}`,
      });
    } else if (scan.result.toLowerCase() === "suspicious" || scan.threat_count === 1) {
      alerts.push({
        severity: "medium",
        title: `${type} scan - Suspicious activity`,
        sub: `${scan.result} · ${time}`,
      });
    } else {
      alerts.push({
        severity: "low",
        title: `${type} analysis completed`,
        sub: `${scan.result} · ${time}`,
      });
    }
  });

  // If no scans, return placeholder alerts
  if (alerts.length === 0) {
    return [
      {
        severity: "low",
        title: "System ready for analysis",
        sub: "No recent security events · Run a scan to get started",
      },
    ];
  }

  return alerts.slice(0, 6);
}
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const scanTime = new Date(timestamp);
  const diffMs = now.getTime() - scanTime.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  
  if (diffSecs < 60) return "just now";
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
  return `${Math.floor(diffSecs / 86400)}d ago`;
}

function getScanIcon(type: string) {
  switch (type.toLowerCase()) {
    case "pcap": return Wifi;
    case "file": return FileText;
    case "url": return Globe;
    case "email": return Mail;
    default: return FileText;
  }
}

function getRiskLevel(result: string): "safe" | "suspicious" | "dangerous" {
  const lower = result.toLowerCase();
  if (lower === "clean" || lower === "safe") return "safe";
  if (lower === "suspicious") return "suspicious";
  return "dangerous";
}

export function Dashboard() {
  const { totalScans, threatsDetected, setPage, setStats } = useStore();
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const riskScore = totalScans > 0 ? Math.round((threatsDetected / totalScans) * 100) : 0;

  // Fetch dashboard stats and recent activity from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, activity] = await Promise.all([
          api.getDashboardStats(),
          api.getRecentActivity(),
        ]);
        setStats(stats.total_scans, stats.threats_detected);
        setRecentScans(activity);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };

    // Fetch immediately and then every 5 seconds
    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, [setStats]);

  // Calculate dynamic data from scans
  const threatDist = calculateThreatDistribution(recentScans);
  const alerts = generateAlerts(recentScans);
  const lastUpdateTime = recentScans.length > 0 ? formatRelativeTime(recentScans[0].timestamp) : "never";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-wide">Security Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time threat intelligence · Last updated {lastUpdateTime}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-900/20 border border-emerald-800/30">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
          <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Scans"
          value={totalScans.toLocaleString()}
          icon={Shield}
          color="purple"
          trend="↑ 12% this week"
          sub="All time"
        />
        <StatCard
          title="Threats Detected"
          value={threatsDetected}
          icon={AlertTriangle}
          color="red"
          trend="↑ 3 today"
          sub="Requires attention"
        />
        <StatCard
          title="Risk Score"
          value={`${riskScore}%`}
          icon={Activity}
          color={riskScore > 50 ? "red" : riskScore > 20 ? "amber" : "emerald"}
          sub="Platform-wide"
        />
        <StatCard
          title="Avg Response"
          value="1.8s"
          icon={TrendingUp}
          color="cyan"
          trend="↓ 0.3s improvement"
          sub="Last 100 scans"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Traffic timeline */}
        <Card className="lg:col-span-2" glow>
          <SectionTitle sub="Activity distribution by scan type">Traffic Timeline</SectionTitle>
          <TrafficChart scans={recentScans} />
        </Card>

        {/* Threat distribution */}
        <Card>
          <SectionTitle sub={`From ${recentScans.length} recent scans`}>Threat Distribution</SectionTitle>
          <BarChart data={threatDist} />
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <SectionTitle sub={`Last ${recentScans.length} events across all analyzers`}>Recent Activity</SectionTitle>
          <div className="space-y-2">
            {recentScans.length > 0 ? (
              recentScans.slice(0, 6).map((item, i) => {
                const Icon = getScanIcon(item.type);
                const riskLevel = getRiskLevel(item.result);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/40 hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-900/30 border border-purple-800/40 flex items-center justify-center flex-shrink-0">
                      <Icon size={13} className="text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)} {item.result === "clean" ? "scanned" : "analyzed"}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{item.result}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <RiskBadge level={riskLevel} />
                      <div className="flex items-center gap-1 text-[10px] text-slate-600">
                        <Clock size={9} />
                        {formatRelativeTime(item.timestamp)}
                      </div>
                    </div>
                    <ChevronRight size={13} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-slate-500 text-sm">
                No recent activity. Run a scan to get started.
              </div>
            )}
          </div>
        </Card>

        {/* Quick actions + risk gauge */}
        <div className="space-y-4">
          <Card>
            <SectionTitle>Quick Scan</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["PCAP", Wifi, "pcap"],
                ["File", FileText, "fileScanner"],
                ["URL", Globe, "urlAnalyzer"],
                ["Email", Mail, "emailAnalyzer"],
              ] as [string, React.ElementType, Page][]).map(([label, Icon, page]) => (
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
            <SectionTitle>Platform Health</SectionTitle>
            <div className="space-y-3">
              {[
                { label: "PCAP Engine", v: 98, c: "emerald" as const },
                { label: "VirusTotal API", v: 91, c: "purple" as const },
                { label: "URL Scanner", v: 85, c: "cyan" as const },
                { label: "Email Parser", v: 100, c: "emerald" as const },
              ].map(({ label, v, c }) => (
                <ProgressBar key={label} label={label} value={v} color={c} showLabel />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Alert feed */}
      <Card>
        <SectionTitle sub={alerts.length > 0 ? "Latest security findings" : "System status"}>Alert Feed</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {alerts.map((alert, i) => (
            <AlertItem
              key={i}
              severity={alert.severity}
              title={alert.title}
              sub={alert.sub}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}