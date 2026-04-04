import { useStore } from "../../store/useStore";
import { Card, SectionTitle } from "../../components/ui";
import { Moon, Sun, Key, Bell, Palette, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { AccentColor } from "../../store/useStore";

const accentColors: { id: AccentColor; label: string; hex: string }[] = [
  { id: "purple",  label: "Purple (Default)", hex: "#a855f7" },
  { id: "cyan",    label: "Cyber Cyan",        hex: "#22d3ee" },
  { id: "emerald", label: "Matrix Green",       hex: "#34d399" },
  { id: "rose",    label: "Danger Rose",        hex: "#fb7185" },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${enabled ? "bg-purple-600" : "bg-slate-700"}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${enabled ? "left-5" : "left-0.5"}`}
      />
    </button>
  );
}

export function Settings() {
  const {
    theme, setTheme,
    accentColor, setAccentColor,
    virusTotalApiKey, setVirusTotalApiKey,
    notificationsEnabled, setNotificationsEnabled,
    totalScans, threatsDetected,
  } = useStore();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Platform Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Configure CyberGuard to match your workflow</p>
      </div>

      {/* Appearance */}
      <Card>
        <SectionTitle sub="Customize the look and feel"><Palette size={12} className="inline mr-1" />Appearance</SectionTitle>
        <div className="space-y-5">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">Color Theme</p>
              <p className="text-xs text-slate-500">Toggle between dark and light mode</p>
            </div>
            <div className="flex items-center gap-2 p-1 rounded-lg bg-slate-900/60 border border-purple-900/20">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${theme === t ? "bg-purple-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                >
                  {t === "dark" ? <Moon size={12} /> : <Sun size={12} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Accent color */}
          <div>
            <p className="text-sm font-medium text-slate-200 mb-1">Accent Color</p>
            <p className="text-xs text-slate-500 mb-3">Choose your preferred highlight color</p>
            <div className="flex gap-3 flex-wrap">
              {accentColors.map(({ id, label, hex }) => (
                <button
                  key={id}
                  onClick={() => setAccentColor(id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all
                    ${accentColor === id ? "border-purple-500/60 bg-purple-900/20 text-slate-200" : "border-slate-800 text-slate-400 hover:border-slate-600"}`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ background: hex, boxShadow: `0 0 6px ${hex}80` }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* API Keys */}
      <Card>
        <SectionTitle sub="External service credentials"><Key size={12} className="inline mr-1" />API Configuration</SectionTitle>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-2 block">
              VirusTotal API Key
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={virusTotalApiKey}
                onChange={(e) => setVirusTotalApiKey(e.target.value)}
                placeholder="Enter your VirusTotal API key..."
                className="flex-1 px-3 py-2 text-sm font-mono bg-slate-900/60 border border-purple-900/30 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/60 transition-all"
              />
              <button
                onClick={() => toast.success("API key saved!")}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium text-white transition-all"
              >
                <Save size={13} />
                Save
              </button>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5">Get your key at <span className="text-purple-400">virustotal.com</span></p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-2 block">
              Backend API URL
            </label>
            <input
              defaultValue="http://localhost:8000"
              className="w-full px-3 py-2 text-sm font-mono bg-slate-900/60 border border-purple-900/30 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500/60 transition-all"
            />
            <p className="text-[11px] text-slate-600 mt-1.5">Your FastAPI backend URL</p>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <SectionTitle sub="Alert and notification preferences"><Bell size={12} className="inline mr-1" />Notifications</SectionTitle>
        <div className="space-y-4">
          {[
            { label: "Threat Alerts", sub: "Show toast when threats are detected", enabled: notificationsEnabled, onChange: setNotificationsEnabled },
            { label: "Scan Completion", sub: "Notify when a scan finishes", enabled: true, onChange: () => {} },
            { label: "System Warnings", sub: "Engine health and downtime alerts", enabled: true, onChange: () => {} },
          ].map(({ label, sub, enabled, onChange }) => (
            <div key={label} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-slate-200">{label}</p>
                <p className="text-xs text-slate-500">{sub}</p>
              </div>
              <Toggle enabled={enabled} onChange={onChange} />
            </div>
          ))}
        </div>
      </Card>

      {/* Stats summary */}
      <Card>
        <SectionTitle>Session Statistics</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-900/50 border border-purple-900/20 text-center">
            <p className="text-2xl font-bold font-mono text-purple-400">{totalScans.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">Total Scans</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-900/50 border border-red-900/20 text-center">
            <p className="text-2xl font-bold font-mono text-red-400">{threatsDetected}</p>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">Threats Found</p>
          </div>
        </div>
        <button
          onClick={() => toast("Stats cleared (mock — Zustand persists)", { icon: "🗑️" })}
          className="mt-4 w-full py-2 text-xs text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-900/40 rounded-lg transition-all"
        >
          Reset Statistics
        </button>
      </Card>
    </div>
  );
}