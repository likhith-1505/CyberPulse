import React from "react";

// ─── Card ────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}
export function Card({ children, className = "", glow }: CardProps) {
  return (
    <div
      className={`
        rounded-xl border border-purple-900/30 bg-[#0d0d22]/80 backdrop-blur-sm p-5
        ${glow ? "shadow-[0_0_20px_rgba(139,92,246,0.12)]" : "shadow-lg"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color?: "purple" | "cyan" | "emerald" | "red" | "amber";
  trend?: string;
}
const colorMap = {
  purple: { bg: "bg-purple-900/30", text: "text-purple-400", glow: "shadow-[0_0_8px_rgba(139,92,246,0.4)]", border: "border-purple-800/40" },
  cyan:   { bg: "bg-cyan-900/30",   text: "text-cyan-400",   glow: "shadow-[0_0_8px_rgba(6,182,212,0.4)]",   border: "border-cyan-800/40" },
  emerald:{ bg: "bg-emerald-900/30",text: "text-emerald-400",glow: "shadow-[0_0_8px_rgba(52,211,153,0.4)]", border: "border-emerald-800/40" },
  red:    { bg: "bg-red-900/30",    text: "text-red-400",    glow: "shadow-[0_0_8px_rgba(239,68,68,0.4)]",    border: "border-red-800/40" },
  amber:  { bg: "bg-amber-900/30",  text: "text-amber-400",  glow: "shadow-[0_0_8px_rgba(245,158,11,0.4)]",  border: "border-amber-800/40" },
};

export function StatCard({ title, value, sub, icon: Icon, color = "purple", trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-2">{title}</p>
          <p className={`text-3xl font-bold font-mono ${c.text}`}>{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
          {trend && <p className="text-[10px] text-emerald-400 mt-1 font-medium">{trend}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${c.bg} border ${c.border} ${c.glow}`}>
          <Icon size={18} className={c.text} />
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${c.bg}`} />
    </Card>
  );
}

// ─── RiskBadge ───────────────────────────────────────────────────────────────
type Risk = "safe" | "clean" | "low" | "suspicious" | "medium" | "dangerous" | "high" | "critical";
const riskStyles: Record<string, string> = {
  safe:       "bg-emerald-900/40 text-emerald-400 border-emerald-700/40",
  clean:      "bg-emerald-900/40 text-emerald-400 border-emerald-700/40",
  low:        "bg-emerald-900/40 text-emerald-400 border-emerald-700/40",
  suspicious: "bg-amber-900/40 text-amber-400 border-amber-700/40",
  medium:     "bg-amber-900/40 text-amber-400 border-amber-700/40",
  dangerous:  "bg-red-900/40 text-red-400 border-red-700/40",
  high:       "bg-red-900/40 text-red-400 border-red-700/40",
  critical:   "bg-red-900/40 text-red-400 border-red-700/40",
};
export function RiskBadge({ level }: { level: Risk | string }) {
  const style = riskStyles[level] ?? "bg-slate-800 text-slate-400 border-slate-700";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {level}
    </span>
  );
}

// ─── SectionTitle ────────────────────────────────────────────────────────────
export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
        <span className="w-1 h-4 bg-purple-500 rounded-full inline-block shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
        {children}
      </h2>
      {sub && <p className="text-xs text-slate-500 mt-1 ml-3">{sub}</p>}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-800/60 rounded-lg ${className}`} />
  );
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number; // 0–100
  color?: "purple" | "emerald" | "red" | "amber" | "cyan";
  showLabel?: boolean;
  label?: string;
}
const pbColors = {
  purple: "bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]",
  emerald: "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]",
  red: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]",
  amber: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
  cyan: "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]",
};
export function ProgressBar({ value, color = "purple", showLabel, label }: ProgressBarProps) {
  return (
    <div>
      {(showLabel || label) && (
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
      )}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${pbColors[color]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── DropZone ────────────────────────────────────────────────────────────────
interface DropZoneProps {
  onFile: (file: File) => void;
  accept?: string;
  label?: string;
  sublabel?: string;
  icon?: React.ElementType;
}
export function DropZone({ onFile, accept, label = "Drop file here", sublabel, icon: Icon }: DropZoneProps) {
  const [dragging, setDragging] = React.useState(false);
  return (
    <label
      className={`flex flex-col items-center justify-center gap-3 h-40 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
        ${dragging ? "border-purple-500 bg-purple-900/20 shadow-[0_0_20px_rgba(139,92,246,0.15)]" : "border-purple-900/40 bg-slate-900/30 hover:border-purple-700/60 hover:bg-purple-900/10"}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
    >
      <input type="file" className="sr-only" accept={accept} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      {Icon && <Icon size={28} className="text-purple-500 opacity-70" />}
      <div className="text-center">
        <p className="text-sm text-slate-300 font-medium">{label}</p>
        {sublabel && <p className="text-xs text-slate-500 mt-1">{sublabel}</p>}
      </div>
    </label>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      className="rounded-full border-2 border-purple-900/40 border-t-purple-500 animate-spin"
      style={{ width: size, height: size }}
    />
  );
}

// ─── AlertItem ───────────────────────────────────────────────────────────────
type Severity = "high" | "medium" | "low" | "info";
const sevStyles: Record<Severity, string> = {
  high:   "border-l-red-500 bg-red-900/10",
  medium: "border-l-amber-500 bg-amber-900/10",
  low:    "border-l-blue-500 bg-blue-900/10",
  info:   "border-l-slate-600 bg-slate-800/30",
};
const sevDot: Record<Severity, string> = {
  high: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]",
  medium: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]",
  low: "bg-blue-500",
  info: "bg-slate-500",
};

export function AlertItem({ severity, title, sub }: { severity: Severity; title: string; sub?: string }) {
  return (
    <div className={`border-l-2 pl-3 py-2 pr-3 rounded-r-lg ${sevStyles[severity]}`}>
      <div className="flex items-start gap-2">
        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${sevDot[severity]}`} />
        <div>
          <p className="text-xs font-medium text-slate-200">{title}</p>
          {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}