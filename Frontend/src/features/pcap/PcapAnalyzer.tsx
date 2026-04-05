import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Wifi, AlertTriangle, Upload, RefreshCw, Download, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import type { PcapResult } from "../../services/api";
import {
  Card, SectionTitle, DropZone, RiskBadge, Spinner, AlertItem, ProgressBar,
} from "../../components/ui";
import { useStore } from "../../store/useStore";

export function PcapAnalyzer() {
  const { incrementScans, incrementThreats } = useStore();
  const [result, setResult] = useState<PcapResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "flows" | "alerts" | "ai">("overview");
  const [selectedAlertIdx, setSelectedAlertIdx] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      setProgress(0);
      const t = setInterval(() => setProgress((p) => Math.min(p + 8, 90)), 200);
      const res = await api.analyzePcap(file);
      clearInterval(t);
      setProgress(100);
      return res;
    },
    onSuccess: (data) => {
      setResult(data);
      setActiveTab("overview");
      setSelectedAlertIdx(null);
      incrementScans();
      const highAlerts = data.alerts.filter((a) => a.severity === "high").length;
      if (highAlerts > 0) incrementThreats();
      toast.success(`Analysis complete · ${data.alerts.length} alerts found`);
    },
    onError: () => toast.error("Analysis failed. Please try again."),
  });

  const highAlerts = useMemo(
    () => result?.alerts.filter((a) => a.severity === "high").length ?? 0,
    [result]
  );

  const criticalAlerts = useMemo(
    () => result?.alerts.filter((a) => a.severity === "critical").length ?? 0,
    [result]
  );

  // Empty state
  if (!result) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-slate-100">PCAP Network Analyzer</h1>
          <p className="text-xs text-slate-500 mt-0.5">Upload a packet capture file to detect intrusions and analyze traffic patterns</p>
        </div>

        <Card glow>
          <SectionTitle sub="Supported: .pcap, .pcapng, .cap">Upload Capture File</SectionTitle>
          <DropZone
            onFile={(f) => mutation.mutate(f)}
            accept=".pcap,.pcapng,.cap"
            icon={Wifi}
            label="Drop your PCAP file here or click to browse"
            sublabel="Max file size: 500 MB"
          />
          {mutation.isPending && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-3">
                <Spinner size={16} />
                <span className="text-xs text-purple-400">Analyzing packets...</span>
                <span className="ml-auto text-xs text-slate-500 font-mono">{progress}%</span>
              </div>
              <ProgressBar value={progress} color="purple" />
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            PCAP Network Analyzer
          </h1>
          <p className="text-xs text-slate-400 mt-1">Professional Network Traffic Analysis</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setResult(null); setActiveTab("overview"); }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all flex items-center gap-2 text-sm"
          >
            <Upload className="w-4 h-4" />
            New Analysis
          </button>
          <button
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Packets</p>
          <p className="text-2xl font-bold font-mono text-purple-400">{result.totalPackets.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Duration</p>
          <p className="text-2xl font-bold font-mono text-blue-400">{result.duration}</p>
        </Card>
        <Card>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Alerts</p>
          <p className="text-2xl font-bold font-mono text-orange-400">{result.alerts.length}</p>
        </Card>
        <Card>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Critical</p>
          <p className="text-2xl font-bold font-mono text-red-400">{criticalAlerts}</p>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-800/50 bg-slate-900/30 p-1 rounded-lg">
        {(["overview", "flows", "alerts", "ai"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium rounded transition-all ${
              activeTab === tab
                ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {tab === "overview" && "📊 Overview"}
            {tab === "flows" && "🌐 Network Flows"}
            {tab === "alerts" && `🚨 Alerts (${result.alerts.length})`}
            {tab === "ai" && "🤖 AI Analysis"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Protocol Breakdown */}
            <Card>
              <SectionTitle sub="Protocol distribution">Traffic Breakdown</SectionTitle>
              <ProtocolChart protocols={result.protocols} />
            </Card>

            {/* Traffic Timeline */}
            <Card>
              <SectionTitle sub="Bytes per time interval">Traffic Timeline</SectionTitle>
              <TrafficTimeline data={result.trafficTimeline} />
            </Card>
          </div>

          {/* Top Talkers */}
          <Card>
            <SectionTitle>Network Statistics</SectionTitle>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Average Packet Size</span>
                <span className="font-mono">{Math.round(result.totalPackets > 0 ? 1000 / result.totalPackets : 0)} bytes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Detection Rate</span>
                <span className="font-mono text-red-400">{result.alerts.length > 0 ? "⚠️ Threats detected" : "✓ Clean"}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "flows" && (
        <Card>
          <SectionTitle sub={`${result.protocols ? Object.keys(result.protocols).length : 0} protocols`}>
            Network Flows
          </SectionTitle>
          <div className="space-y-2">
            {Object.entries(result.protocols || {}).map(([proto, count]) => (
              <div key={proto} className="flex items-center justify-between p-3 bg-slate-800/30 rounded border border-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs font-semibold">
                    {proto}
                  </span>
                  <span className="text-sm text-slate-400">{count} packets</span>
                </div>
                <div className="w-32 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                    style={{ width: `${(count / Math.max(...Object.values(result.protocols || {}))) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "alerts" && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2 mb-4">
            <button
              className="p-2 rounded border border-red-500/50 bg-red-500/10 text-center text-xs"
            >
              <div className="font-semibold text-sm text-red-300">{criticalAlerts}</div>
              <div className="text-xs text-red-400">Critical</div>
            </button>
            <button
              className="p-2 rounded border border-orange-500/50 bg-orange-500/10 text-center text-xs"
            >
              <div className="font-semibold text-sm text-orange-300">{highAlerts}</div>
              <div className="text-xs text-orange-400">High</div>
            </button>
            <button
              className="p-2 rounded border border-yellow-500/50 bg-yellow-500/10 text-center text-xs"
            >
              <div className="font-semibold text-sm text-yellow-300">
                {result.alerts.filter((a) => a.severity === "medium").length}
              </div>
              <div className="text-xs text-yellow-400">Medium</div>
            </button>
            <button
              className="p-2 rounded border border-blue-500/50 bg-blue-500/10 text-center text-xs"
            >
              <div className="font-semibold text-sm text-blue-300">
                {result.alerts.filter((a) => a.severity === "low").length}
              </div>
              <div className="text-xs text-blue-400">Low</div>
            </button>
          </div>

          <Card>
            <div className="space-y-2">
              {result.alerts.map((alert, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedAlertIdx(selectedAlertIdx === i ? null : i)}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    alert.severity === "critical"
                      ? "bg-red-500/10 border-red-500/50 hover:bg-red-500/20"
                      : alert.severity === "high"
                      ? "bg-orange-500/10 border-orange-500/50 hover:bg-orange-500/20"
                      : alert.severity === "medium"
                      ? "bg-yellow-500/10 border-yellow-500/50 hover:bg-yellow-500/20"
                      : "bg-blue-500/10 border-blue-500/50 hover:bg-blue-500/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">
                      {alert.severity === "critical" ? "🚨" : alert.severity === "high" ? "⚠️" : alert.severity === "medium" ? "⚡" : "ℹ️"}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{alert.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {alert.src} → {alert.dst}
                      </p>
                    </div>
                  </div>

                  {selectedAlertIdx === i && (
                    <div className="mt-2 pt-2 border-t border-current/20 text-xs opacity-75">
                      <div className="space-y-1">
                        <div><strong>Source:</strong> {alert.src}</div>
                        <div><strong>Destination:</strong> {alert.dst}</div>
                        <div><strong>Severity:</strong> {alert.severity}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "ai" && (
        <Card>
          <SectionTitle>AI-Powered Analysis</SectionTitle>
          <div className="space-y-4">
            <div className="p-4 bg-purple-500/10 border border-purple-500/50 rounded">
              <p className="text-sm text-slate-300">
                <strong>Traffic Summary:</strong> Analyzed {result.totalPackets.toLocaleString()} packets across {Object.keys(result.protocols || {}).length} protocols in {result.duration}.
              </p>
            </div>

            {criticalAlerts > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded">
                <p className="text-sm text-red-300 font-semibold mb-2">🚨 Threat Detected</p>
                <p className="text-sm text-slate-300">
                  Found {criticalAlerts} critical alert{criticalAlerts !== 1 ? "s" : ""} indicating suspicious network behavior. Review affected flows for potential intrusion attempts.
                </p>
              </div>
            )}

            <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded">
              <p className="text-sm text-slate-300">
                <strong>Protocol Analysis:</strong> Most traffic from {Object.entries(result.protocols || {}).sort(([, a], [, b]) => b - a)[0]?.[0] || "unknown"} protocol. Review payload inspection for anomalies.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Helper components
function ProtocolChart({ protocols }: { protocols: Record<string, number> }) {
  const total = Object.values(protocols).reduce((a, b) => a + b, 0);
  const colors = ["#a855f7", "#60a5fa", "#34d399", "#f97316", "#f43f5e"];
  const entries = Object.entries(protocols);

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="rotate-[-90deg]">
          {(() => {
            let cum = 0;
            return entries.map(([name, val], i) => {
              const pct = (val / total) * 100;
              const dash = `${pct} ${100 - pct}`;
              const offset = -cum;
              cum += pct;
              return (
                <circle
                  key={name}
                  r="15.9155" cx="18" cy="18"
                  fill="none"
                  stroke={colors[i % colors.length]}
                  strokeWidth="4"
                  strokeDasharray={dash}
                  strokeDashoffset={offset}
                  className="transition-all duration-700"
                />
              );
            });
          })()}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-100 font-mono">{total.toLocaleString()}</span>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider">packets</span>
        </div>
      </div>
      <div className="space-y-2 flex-1">
        {entries.map(([name, val], i) => (
          <div key={name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }} />
            <span className="text-[11px] text-slate-400 w-12">{name}</span>
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(val / total) * 100}%`, background: colors[i % colors.length] }}
              />
            </div>
            <span className="text-[11px] text-slate-400 font-mono w-10 text-right">{val.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrafficTimeline({ data }: { data: Array<{ time: string; bytes: number }> }) {
  const max = Math.max(...data.map((d) => d.bytes));

  return (
    <div className="relative">
      <svg width="100%" height="100" viewBox="0 0 300 80" preserveAspectRatio="none">
        {(() => {
          const pts = data.map((d, i) => {
            const x = (i / (data.length - 1)) * 300;
            const y = 80 - (d.bytes / max) * 75;
            return `${x},${y}`;
          }).join(" ");
          return (
            <>
              <defs>
                <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon fill="url(#tGrad)" points={`0,80 ${pts} 300,80`} />
              <polyline fill="none" stroke="#a855f7" strokeWidth="1.5" points={pts} strokeLinejoin="round" />
            </>
          );
        })()}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-600 mt-1">
        {data.filter((_, i) => i % 3 === 0).map((d) => (
          <span key={d.time}>{d.time}</span>
        ))}
      </div>
    </div>
  );
}