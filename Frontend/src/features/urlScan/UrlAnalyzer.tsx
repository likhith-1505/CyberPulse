import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Globe, Search, AlertTriangle, Info, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import type { UrlScanResult } from "../../services/api";
import { Card, SectionTitle, RiskBadge, Spinner } from "../../components/ui";
import { useStore } from "../../store/useStore";

function RiskGauge({ score }: { score: number }) {
  const angle = (score / 100) * 180 - 90;
  const color = score > 60 ? "#f87171" : score > 30 ? "#fbbf24" : "#34d399";
  return (
    <div className="flex flex-col items-center py-4">
      <svg width="140" height="80" viewBox="0 0 140 80">
        {/* Track */}
        <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none" stroke="#1e1e3a" strokeWidth="10" strokeLinecap="round" />
        {/* Value */}
        <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none" stroke={color}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 188} 188`}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
        {/* Needle */}
        <line
          x1="70" y1="75"
          x2={70 + 50 * Math.cos(((angle - 90) * Math.PI) / 180)}
          y2={75 + 50 * Math.sin(((angle - 90) * Math.PI) / 180)}
          stroke={color} strokeWidth="2" strokeLinecap="round"
        />
        <circle cx="70" cy="75" r="4" fill={color} />
      </svg>
      <div className="text-3xl font-bold font-mono mt-1" style={{ color }}>{score}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-widest">Risk Score</div>
    </div>
  );
}

const severityIcons = { info: Info, warning: AlertTriangle, critical: Shield };
const severityStyles = {
  info: "border-l-blue-500 bg-blue-900/10 text-blue-300",
  warning: "border-l-amber-500 bg-amber-900/10 text-amber-300",
  critical: "border-l-red-500 bg-red-900/10 text-red-300",
};

export function UrlAnalyzer() {
  const { incrementScans, incrementThreats } = useStore();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<UrlScanResult | null>(null);

  const mutation = useMutation({
    mutationFn: (u: string) => api.analyzeUrl(u),
    onSuccess: (data) => {
      setResult(data);
      incrementScans();
      if (data.riskLevel !== "safe") incrementThreats();
      toast.success(`URL analyzed · Risk: ${data.riskScore}/100`);
    },
    onError: () => toast.error("Invalid URL or scan failed."),
  });

  const handleSubmit = () => {
    if (!url.trim()) return toast.error("Please enter a URL");
    mutation.mutate(url.trim());
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-100">URL Threat Analyzer</h1>
        <p className="text-xs text-slate-500 mt-0.5">Detect phishing, malware, and suspicious domains in real time</p>
      </div>

      <Card glow>
        <SectionTitle>Enter URL to Analyze</SectionTitle>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="https://example.com or example.com"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-900/60 border border-purple-900/30 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/60 focus:shadow-[0_0_0_1px_rgba(139,92,246,0.3)] transition-all font-mono"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-sm font-semibold text-white transition-all shadow-[0_0_12px_rgba(139,92,246,0.3)] hover:shadow-[0_0_16px_rgba(139,92,246,0.5)]"
          >
            {mutation.isPending ? <Spinner size={14} /> : <Search size={14} />}
            {mutation.isPending ? "Scanning..." : "Analyze"}
          </button>
        </div>
      </Card>

      {result && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gauge */}
            <Card className="flex flex-col items-center">
              <RiskGauge score={result.riskScore} />
              <RiskBadge level={result.riskLevel} />
              <div className="mt-3 flex gap-1 flex-wrap justify-center">
                {result.categories.map((c) => (
                  <span key={c} className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded border border-slate-700">
                    {c}
                  </span>
                ))}
              </div>
            </Card>

            {/* Domain info */}
            <Card className="md:col-span-2">
              <SectionTitle>Domain Intelligence</SectionTitle>
              <div className="space-y-3">
                {[
                  { label: "URL",        value: result.url },
                  { label: "Domain",     value: result.domain },
                  { label: "IP Address", value: result.ip },
                  { label: "Country",    value: result.country },
                  { label: "Registrar",  value: result.registrar },
                  { label: "Created",    value: result.createdAt },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-3 pb-2.5 border-b border-purple-900/20 last:border-0">
                    <span className="text-[11px] text-slate-500 w-20 flex-shrink-0 uppercase tracking-wider pt-0.5">{label}</span>
                    <span className="text-xs text-slate-200 font-mono break-all">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Indicators */}
          <Card>
            <SectionTitle sub={`${result.indicators.length} indicators analyzed`}>Suspicious Indicators</SectionTitle>
            {result.indicators.length === 0 ? (
              <p className="text-xs text-slate-500">No suspicious indicators found.</p>
            ) : (
              <div className="space-y-2">
                {result.indicators.map((ind, i) => {
                  const Icon = severityIcons[ind.severity];
                  return (
                    <div key={i} className={`flex items-start gap-3 border-l-2 pl-3 py-2 pr-3 rounded-r-lg ${severityStyles[ind.severity]}`}>
                      <Icon size={13} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium">{ind.type}</p>
                        <p className="text-[11px] opacity-75 mt-0.5">{ind.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}