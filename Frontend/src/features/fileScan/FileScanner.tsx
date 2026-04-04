import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileSearch, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import type { FileScanResult } from "../../services/api";
import { Card, SectionTitle, DropZone, RiskBadge, Spinner, ProgressBar } from "../../components/ui";
import { useStore } from "../../store/useStore";

function DetectionMeter({ detected, total }: { detected: number; total: number }) {
  const pct = Math.round((detected / total) * 100);
  const color = pct > 30 ? "red" : pct > 0 ? "amber" : "emerald";
  return (
    <div className="flex flex-col items-center p-6 rounded-xl bg-slate-900/50 border border-purple-900/20">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 36 36" className="-rotate-90">
          <circle r="15.9155" cx="18" cy="18" fill="none" stroke="#1e1e3a" strokeWidth="4" />
          <circle
            r="15.9155" cx="18" cy="18" fill="none"
            stroke={pct > 30 ? "#f87171" : pct > 0 ? "#fbbf24" : "#34d399"}
            strokeWidth="4"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono text-slate-100">{detected}</span>
          <span className="text-[10px] text-slate-500">/ {total}</span>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-3">Engines detected</p>
      <RiskBadge level={pct > 30 ? "dangerous" : pct > 0 ? "suspicious" : "clean"} />
    </div>
  );
}

export function FileScanner() {
  const { incrementScans, incrementThreats } = useStore();
  const [result, setResult] = useState<FileScanResult | null>(null);
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      setProgress(0);
      const t = setInterval(() => setProgress((p) => Math.min(p + 5, 88)), 150);
      const res = await api.scanFile(file);
      clearInterval(t);
      setProgress(100);
      return res;
    },
    onSuccess: (data) => {
      setResult(data);
      incrementScans();
      if (data.riskLevel !== "clean") incrementThreats();
      toast.success(`Scan complete · ${data.detectionRatio.detected}/${data.detectionRatio.total} detections`);
    },
    onError: () => toast.error("Scan failed. Check your API key."),
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-100">File Scanner</h1>
        <p className="text-xs text-slate-500 mt-0.5">Multi-engine malware analysis powered by VirusTotal</p>
      </div>

      <Card glow>
        <SectionTitle sub="Any file type up to 32MB">Upload File for Analysis</SectionTitle>
        <DropZone
          onFile={(f) => mutation.mutate(f)}
          icon={FileSearch}
          label="Drop any file here to scan"
          sublabel="Analyzed against 70+ antivirus engines"
        />
        {mutation.isPending && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-3">
              <Spinner size={16} />
              <span className="text-xs text-purple-400">Submitting to 70 engines...</span>
              <span className="ml-auto text-xs text-slate-500 font-mono">{progress}%</span>
            </div>
            <ProgressBar value={progress} color="purple" />
          </div>
        )}
      </Card>

      {result && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetectionMeter
              detected={result.detectionRatio.detected}
              total={result.detectionRatio.total}
            />
            <Card className="md:col-span-2">
              <SectionTitle>File Metadata</SectionTitle>
              <div className="space-y-3">
                {[
                  { label: "File Name", value: result.fileName },
                  { label: "File Size", value: result.fileSize },
                  { label: "SHA-256",   value: result.sha256, mono: true, truncate: true },
                  { label: "First Seen",value: result.firstSeen },
                  { label: "Risk Level",value: <RiskBadge level={result.riskLevel} /> },
                ].map(({ label, value, mono, truncate }) => (
                  <div key={label} className="flex items-start gap-3 pb-3 border-b border-purple-900/20 last:border-0">
                    <span className="text-[11px] text-slate-500 w-24 flex-shrink-0 uppercase tracking-wider pt-0.5">{label}</span>
                    <span className={`text-xs text-slate-200 ${mono ? "font-mono" : ""} ${truncate ? "truncate" : ""}`}>
                      {typeof value === "string" ? value : value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Engine results */}
          <Card>
            <SectionTitle sub={`${result.detectionRatio.detected} of ${result.detectionRatio.total} engines flagged this file`}>Engine Results</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {result.engines.map((engine) => (
                <div
                  key={engine.name}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border
                    ${engine.detected
                      ? "bg-red-900/10 border-red-800/30"
                      : "bg-slate-900/40 border-slate-800/30"}`}
                >
                  {engine.detected
                    ? <XCircle size={13} className="text-red-400 flex-shrink-0" />
                    : <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />}
                  <span className={`font-medium ${engine.detected ? "text-red-300" : "text-slate-400"}`}>{engine.name}</span>
                  {engine.result && (
                    <span className="ml-auto text-[10px] text-red-400 truncate max-w-[100px]" title={engine.result}>
                      {engine.result}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}