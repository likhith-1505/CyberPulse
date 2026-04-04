import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Wifi, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import type { PcapResult } from "../../services/api";
import {
  Card, SectionTitle, DropZone, RiskBadge, Spinner, AlertItem, ProgressBar,
} from "../../components/ui";
import { useStore } from "../../store/useStore";

function ProtoChart({ protocols }: { protocols: Record<string, number> }) {
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

export function PcapAnalyzer() {
  const { incrementScans, incrementThreats } = useStore();
  const [result, setResult] = useState<PcapResult | null>(null);
  const [progress, setProgress] = useState(0);

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
      incrementScans();
      const highAlerts = data.alerts.filter((a) => a.severity === "high").length;
      if (highAlerts > 0) incrementThreats();
      toast.success(`Analysis complete · ${data.alerts.length} alerts found`);
    },
    onError: () => toast.error("Analysis failed. Please try again."),
  });

  const highAlerts = result?.alerts.filter((a) => a.severity === "high").length ?? 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-100">PCAP Network Analyzer</h1>
        <p className="text-xs text-slate-500 mt-0.5">Upload a packet capture file to detect intrusions and analyze traffic patterns</p>
      </div>

      {/* Upload */}
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

      {result && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Packets", value: result.totalPackets.toLocaleString() },
              { label: "Duration",       value: result.duration },
              { label: "Alerts",         value: result.alerts.length },
              { label: "Critical",       value: highAlerts },
            ].map(({ label, value }) => (
              <Card key={label}>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-2xl font-bold font-mono text-purple-300">{value}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Protocol breakdown */}
            <Card>
              <SectionTitle sub="Protocol distribution">Traffic Breakdown</SectionTitle>
              <ProtoChart protocols={result.protocols} />
            </Card>

            {/* Traffic timeline */}
            <Card>
              <SectionTitle sub="Bytes per time interval">Traffic Timeline</SectionTitle>
              <div className="relative">
                <svg width="100%" height="100" viewBox="0 0 300 80" preserveAspectRatio="none">
                  {(() => {
                    const data = result.trafficTimeline;
                    const max = Math.max(...data.map((d) => d.bytes));
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
                  {result.trafficTimeline.filter((_, i) => i % 3 === 0).map((d) => (
                    <span key={d.time}>{d.time}</span>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Alerts */}
          <Card>
            <SectionTitle sub={`${result.alerts.length} security alerts detected`}>
              <AlertTriangle size={13} className="text-red-400" />
              Alert Panel
            </SectionTitle>
            <div className="space-y-2">
              {result.alerts.map((alert, i) => (
                <AlertItem
                  key={i}
                  severity={alert.severity}
                  title={alert.message}
                  sub={`SRC: ${alert.src} → DST: ${alert.dst}`}
                />
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}