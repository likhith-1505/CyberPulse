import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail, AlertTriangle, CheckCircle, XCircle, Search } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import type { EmailAnalysisResult } from "../../services/api";
import { Card, SectionTitle, RiskBadge, Spinner } from "../../components/ui";
import { useStore } from "../../store/useStore";

const SAMPLE_HEADERS = `Received: from mail.suspicious-domain.xyz (198.51.100.42)
  by mx1.victim.com with SMTP id a1234; Mon, 1 Apr 2025 09:12:03 +0000
From: "PayPal Security" <noreply@suspicious-domain.xyz>
Reply-To: harvester@evil.cc
To: victim@company.com
Subject: Urgent: Verify your account immediately
Authentication-Results: mx1.victim.com;
  spf=fail smtp.mailfrom=suspicious-domain.xyz;
  dkim=fail header.d=suspicious-domain.xyz;
  dmarc=fail action=quarantine header.from=suspicious-domain.xyz
X-Originating-IP: 198.51.100.42`;

function AuthBadge({ label, status }: { label: string; status: "pass" | "fail" | "neutral" | "none" }) {
  const styles = {
    pass: { bg: "bg-emerald-900/30 border-emerald-700/40", text: "text-emerald-400", icon: CheckCircle },
    fail: { bg: "bg-red-900/30 border-red-700/40",         text: "text-red-400",     icon: XCircle },
    neutral: { bg: "bg-slate-800/40 border-slate-700/40",  text: "text-slate-400",   icon: AlertTriangle },
    none: { bg: "bg-slate-800/40 border-slate-700/40",     text: "text-slate-500",   icon: AlertTriangle },
  };
  const s = styles[status];
  const Icon = s.icon;
  return (
    <div className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${s.bg}`}>
      <Icon size={20} className={s.text} />
      <div className="text-center">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</p>
        <p className={`text-sm font-bold uppercase tracking-wide ${s.text}`}>{status}</p>
      </div>
    </div>
  );
}

export function EmailAnalyzer() {
  const { incrementScans, incrementThreats } = useStore();
  const [headers, setHeaders] = useState("");
  const [result, setResult] = useState<EmailAnalysisResult | null>(null);

  const mutation = useMutation({
    mutationFn: (h: string) => api.analyzeEmail(h),
    onSuccess: (data) => {
      setResult(data);
      incrementScans();
      if (data.spoofingRisk !== "low") incrementThreats();
      toast.success(`Email analyzed · Spoofing risk: ${data.spoofingRisk.toUpperCase()}`);
    },
    onError: () => toast.error("Analysis failed."),
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Email Header Analyzer</h1>
        <p className="text-xs text-slate-500 mt-0.5">Extract IPs, validate SPF/DKIM/DMARC, detect spoofing and phishing</p>
      </div>

      <Card glow>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle sub="Paste raw email headers below">Email Headers</SectionTitle>
          <button
            onClick={() => setHeaders(SAMPLE_HEADERS)}
            className="text-[11px] text-purple-400 hover:text-purple-300 border border-purple-700/40 hover:border-purple-500/60 px-2.5 py-1 rounded transition-colors"
          >
            Load Sample
          </button>
        </div>
        <textarea
          value={headers}
          onChange={(e) => setHeaders(e.target.value)}
          placeholder={`Received: from mail.example.com ...\nFrom: sender@example.com\nAuthentication-Results: ...`}
          rows={9}
          className="w-full px-4 py-3 text-xs font-mono bg-slate-900/60 border border-purple-900/30 rounded-lg text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/60 resize-none transition-all leading-relaxed"
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => { if (!headers.trim()) return toast.error("Paste email headers first"); mutation.mutate(headers); }}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-sm font-semibold text-white transition-all shadow-[0_0_12px_rgba(139,92,246,0.3)] hover:shadow-[0_0_16px_rgba(139,92,246,0.5)]"
          >
            {mutation.isPending ? <Spinner size={14} /> : <Search size={14} />}
            {mutation.isPending ? "Analyzing..." : "Analyze Headers"}
          </button>
        </div>
      </Card>

      {result && (
        <>
          {/* Auth row */}
          <div className="grid grid-cols-3 gap-4">
            <AuthBadge label="SPF"   status={result.spf} />
            <AuthBadge label="DKIM"  status={result.dkim} />
            <AuthBadge label="DMARC" status={result.dmarc} />
          </div>

          {/* Sender info */}
          <Card>
            <SectionTitle>Sender Intelligence</SectionTitle>
            <div className="space-y-3">
              {[
                { label: "Sender IP",    value: result.senderIp },
                { label: "From",         value: result.fromAddress },
                { label: "Reply-To",     value: result.replyTo },
                { label: "Subject",      value: result.subject },
                { label: "Spoof Risk",   value: <RiskBadge level={result.spoofingRisk} /> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-3 pb-3 border-b border-purple-900/20 last:border-0">
                  <span className="text-[11px] text-slate-500 w-20 flex-shrink-0 uppercase tracking-wider pt-0.5">{label}</span>
                  <span className="text-xs text-slate-200 font-mono">{typeof value === "string" ? value : value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Hops */}
          <Card>
            <SectionTitle sub="Email routing path">Routing Hops</SectionTitle>
            <div className="relative ml-3">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-purple-900/40" />
              {result.hops.map((hop, i) => (
                <div key={i} className="relative pl-6 pb-5 last:pb-0">
                  <div className="absolute left-[-4px] top-1 w-2 h-2 rounded-full bg-purple-600 shadow-[0_0_6px_rgba(139,92,246,0.6)]" />
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Hop {i + 1}</p>
                  <p className="text-xs text-slate-300 font-mono">From: {hop.from}</p>
                  <p className="text-xs text-slate-400 font-mono">By: {hop.by}</p>
                  <p className="text-[10px] text-slate-600 mt-1">{hop.time}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <Card>
              <SectionTitle sub={`${result.warnings.length} security warning(s)`}>
                <AlertTriangle size={13} className="text-amber-400" />
                Security Warnings
              </SectionTitle>
              <div className="space-y-2">
                {result.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-900/10 border border-amber-800/30">
                    <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200">{w}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}