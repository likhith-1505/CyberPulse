import {
  Shield, AlertTriangle, Activity, TrendingUp,
  Clock, Eye, Wifi, FileText, Globe, Mail, ChevronRight,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card, StatCard, SectionTitle, RiskBadge, ProgressBar, AlertItem } from "../../components/ui";
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
const trafficData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  packets: Math.floor(Math.random() * 4000 + 500),
  threats: Math.floor(Math.random() * 40),
}));

function TrafficChart() {
  const maxP = Math.max(...trafficData.map((d) => d.packets));
  const maxT = Math.max(...trafficData.map((d) => d.threats));
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

// ─── Recent activity ──────────────────────────────────────────────────────────
const recentActivity = [
  { icon: Wifi, label: "PCAP analyzed", sub: "14,823 packets · 4 alerts", time: "2m ago", risk: "dangerous" },
  { icon: FileText, label: "File scan complete", sub: "invoice_q4.exe · 3/70 engines", time: "8m ago", risk: "suspicious" },
  { icon: Globe, label: "URL analyzed", sub: "phish-bank-login.xyz", time: "15m ago", risk: "dangerous" },
  { icon: Mail, label: "Email headers parsed", sub: "SPF fail · DKIM fail", time: "22m ago", risk: "dangerous" },
  { icon: FileText, label: "File scan complete", sub: "report.pdf · 0/70 engines", time: "41m ago", risk: "safe" },
  { icon: Globe, label: "URL analyzed", sub: "github.com/anthropics/claude", time: "1h ago", risk: "safe" },
];

// ─── Threat distribution ──────────────────────────────────────────────────────
const threatDist = [
  { label: "Malware", value: 34, color: "#f87171" },
  { label: "Phishing", value: 28, color: "#fb923c" },
  { label: "Port Scan", value: 11, color: "#facc15" },
  { label: "DDoS", value: 6,  color: "#a855f7" },
  { label: "Exploit", value: 4,  color: "#60a5fa" },
];

export function Dashboard() {
  const { totalScans, threatsDetected, setPage } = useStore();
  const riskScore = Math.round((threatsDetected / totalScans) * 100);
  const sparkData = Array.from({ length: 10 }, () => Math.random() * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-wide">Security Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time threat intelligence · Last updated just now</p>
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
          <SectionTitle sub="24-hour packet + threat activity">Traffic Timeline</SectionTitle>
          <TrafficChart />
        </Card>

        {/* Threat distribution */}
        <Card>
          <SectionTitle sub="By category this month">Threat Distribution</SectionTitle>
          <BarChart data={threatDist} />
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <SectionTitle sub="Last 6 events across all analyzers">Recent Activity</SectionTitle>
          <div className="space-y-2">
            {recentActivity.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/40 hover:bg-slate-800/40 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-900/30 border border-purple-800/40 flex items-center justify-center flex-shrink-0">
                    <Icon size={13} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{item.label}</p>
                    <p className="text-[10px] text-slate-500 truncate">{item.sub}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <RiskBadge level={item.risk} />
                    <div className="flex items-center gap-1 text-[10px] text-slate-600">
                      <Clock size={9} />
                      {item.time}
                    </div>
                  </div>
                  <ChevronRight size={13} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                </div>
              );
            })}
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
        <SectionTitle sub="Latest automated alerts">Alert Feed</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <AlertItem severity="high" title="SYN Flood detected from 203.0.113.42" sub="TCP · Port 443 · 2 min ago" />
          <AlertItem severity="high" title="Credential harvesting page identified" sub="URL: phish-bank-login.xyz · 15 min ago" />
          <AlertItem severity="medium" title="Suspicious DNS query volume" sub="192.168.1.20 → 8.8.8.8 · 8 min ago" />
          <AlertItem severity="medium" title="Email SPF + DKIM validation failed" sub="From: noreply@suspicious-domain.xyz" />
          <AlertItem severity="low" title="Unencrypted HTTP credentials transmitted" sub="192.168.1.55 → 104.21.0.1" />
          <AlertItem severity="low" title="Port scan pattern detected" sub="192.168.1.105 sweeping /24 range" />
        </div>
      </Card>
    </div>
  );
}