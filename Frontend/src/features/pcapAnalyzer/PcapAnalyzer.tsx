/**
 * Main PCAP Analyzer Component
 * SOC-grade network traffic investigation platform
 */

import { useState, useRef } from "react";
import { Upload, RefreshCw, Download, Save, AlertTriangle, Wifi, X } from "lucide-react";
import { usePcapAnalyzer } from "./store";
import { PacketTable } from "./components/PacketTable";
import { PacketDetailsPanel } from "./components/PacketDetailsPanel";
import { FlowAnalysis } from "./components/FlowAnalysis";
import { AlertPanel } from "./components/AlertPanel";
import { ProtocolAnalysisTabs } from "./components/ProtocolAnalysisTabs";
import { NetworkTopology } from "./components/NetworkTopology";
import { TimelineView } from "./components/TimelineView";
import { AIAnalystPanel } from "./components/AIAnalystPanel";

export function PcapAnalyzer() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "flows" | "protocols" | "ai">("overview");
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  const { packets, alerts, flows, loading, selectedPacketId, selectPacket } = usePcapAnalyzer();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: Upload to backend and parse PCAP
    // For now, show loading state
    console.log("Uploading PCAP:", file.name);
  };

  const handleExport = () => {
    // TODO: Export report (PDF/JSON)
    console.log("Exporting report");
  };

  const handleSaveSession = () => {
    // TODO: Save current analysis session
    console.log("Saving session");
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/40 backdrop-blur">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  PCAP Analyzer
                </h1>
                <p className="text-xs text-slate-400">Professional Network Traffic Analysis</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg transition-all hover:shadow-lg hover:shadow-purple-500/50"
              >
                <Upload className="w-4 h-4" />
                Upload PCAP
              </button>
              <button
                onClick={handleSaveSession}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          {packets.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-xs text-slate-400">Total Packets</p>
                <p className="text-lg font-bold text-purple-400">{packets.length.toLocaleString()}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-xs text-slate-400">Alerts Detected</p>
                <p className="text-lg font-bold text-orange-400">{alerts.length}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-xs text-slate-400">Unique Flows</p>
                <p className="text-lg font-bold text-blue-400">{flows.length}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-xs text-slate-400">Capture Status</p>
                <p className="text-lg font-bold text-green-400">Active</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 border-t border-slate-800/50 bg-slate-950/50">
          {(["overview", "flows", "protocols", "ai"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab === "overview" && "📊 Overview"}
              {tab === "flows" && "🌐 Flows"}
              {tab === "protocols" && "🔍 Protocols"}
              {tab === "ai" && "🤖 AI Analyst"}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-400" />
              <p className="text-sm text-slate-300">Analyzing PCAP...</p>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === "overview" && (
            <div className="p-6 space-y-4 h-full flex flex-col">
              {/* Top Section - Table and Details */}
              <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
                {/* Left - Packet Table + Alerts (2/3) */}
                <div className="col-span-2 flex flex-col gap-4 min-h-0">
                  <div className="flex-1 min-h-0">
                    <PacketTable onSelectPacket={(id) => {
                      selectPacket(id);
                      setShowDetailPanel(true);
                    }} />
                  </div>
                  <div className="h-48">
                    <AlertPanel />
                  </div>
                </div>

                {/* Right - Packet Details Panel (1/3) */}
                {showDetailPanel && selectedPacketId && (
                  <div className="col-span-1 bg-slate-900/30 rounded-lg border border-slate-800/50 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50 bg-slate-950/50">
                      <h3 className="text-sm font-semibold text-slate-200">Packet Details</h3>
                      <button
                        onClick={() => setShowDetailPanel(false)}
                        className="p-1 hover:bg-slate-700/50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <PacketDetailsPanel />
                  </div>
                )}
              </div>

              {/* Bottom Section - Network Topology and Timeline */}
              <div className="grid grid-cols-3 gap-4 h-56">
                <NetworkTopology />
                <div className="col-span-1">
                  <TimelineView />
                </div>
              </div>
            </div>
          )}

          {activeTab === "flows" && (
            <div className="p-6 h-full">
              <FlowAnalysis />
            </div>
          )}

          {activeTab === "protocols" && (
            <div className="p-6 h-full">
              <ProtocolAnalysisTabs />
            </div>
          )}

          {activeTab === "ai" && (
            <div className="p-6 h-full">
              <AIAnalystPanel />
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pcap,.pcapng,.cap"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
