/**
 * Flow Analysis Component
 * Displays network flows with traffic statistics and drill-down
 */

import { useState, useMemo } from "react";
import { ChevronDown, TrendingUp, AlertTriangle, Shield } from "lucide-react";
import { usePcapAnalyzer } from "../store";
import type { PacketFlow } from "../types";

export function FlowAnalysis() {
  const { flows, selectFlow, selectedFlowId } = usePcapAnalyzer();
  const [expandedFlowId, setExpandedFlowId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"packets" | "bytes" | "duration">("packets");

  // Sort flows
  const sortedFlows = useMemo(() => {
    const sorted = [...flows];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "packets":
          return b.packetCount - a.packetCount;
        case "bytes":
          return b.bytesTransferred - a.bytesTransferred;
        case "duration":
          return b.duration - a.duration;
        default:
          return 0;
      }
    });
    return sorted;
  }, [flows, sortBy]);

  const getFlowStatus = (flow: PacketFlow) => {
    if (flow.protocol === "TCP") {
      if (flow.status === "malicious") return { icon: "⚠️", label: "Malicious", color: "text-red-400" };
      if (flow.status === "suspicious") return { icon: "⚡", label: "Suspicious", color: "text-yellow-400" };
      return { icon: "🔗", label: "Established", color: "text-blue-400" };
    }
    return { icon: "📦", label: "UDP Flow", color: "text-cyan-400" };
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center gap-4 px-1">
        <div className="text-sm text-slate-400">
          <span className="font-semibold">{flows.length}</span> flows
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded text-xs focus:outline-none focus:border-purple-500/50"
        >
          <option value="packets">Sort by Packets</option>
          <option value="bytes">Sort by Bytes</option>
          <option value="duration">Sort by Duration</option>
        </select>
      </div>

      {/* Flows List */}
      <div className="flex-1 overflow-auto space-y-2">
        {sortedFlows.map((flow) => {
          const isSelected = flow.id === selectedFlowId;
          const isExpanded = expandedFlowId === flow.id;
          const status = getFlowStatus(flow);

          return (
            <div
              key={flow.id}
              className={`rounded-lg border transition-colors ${
                isSelected
                  ? "bg-purple-500/20 border-purple-500/50"
                  : "bg-slate-800/20 border-slate-800/50 hover:bg-slate-800/40"
              }`}
            >
              {/* Flow Header */}
              <div
                onClick={() => {
                  selectFlow(flow.id);
                  setExpandedFlowId(isExpanded ? null : flow.id);
                }}
                className="p-3 cursor-pointer flex items-center gap-3"
              >
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${
                    isExpanded ? "rotate-0" : "-rotate-90"
                  }`}
                />

                {/* Status Icon */}
                <div className={`text-xl flex-shrink-0 ${status.color}`}>
                  {status.icon}
                </div>

                {/* Flow Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-blue-400 truncate">
                      {flow.srcIp}
                    </span>
                    <span className="text-slate-500 flex-shrink-0">→</span>
                    <span className="font-mono text-xs text-green-400 truncate">
                      {flow.dstIp}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="px-1.5 py-0.5 bg-slate-700/50 rounded">
                      {flow.protocol}
                    </span>
                    <span>Port {flow.dstPort || "?"}</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-300">
                      {flow.packetCount}
                    </div>
                    <div className="text-xs text-slate-500">packets</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-300">
                      {formatBytes(flow.bytesTransferred)}
                    </div>
                    <div className="text-xs text-slate-500">data</div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-3 py-2 border-t border-slate-800/50 bg-slate-900/20 space-y-2">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-800/30 rounded p-2">
                      <div className="text-xs text-slate-500">Duration</div>
                      <div className="text-sm font-semibold text-slate-300">
                        {formatDuration(flow.duration)}
                      </div>
                    </div>
                    <div className="bg-slate-800/30 rounded p-2">
                      <div className="text-xs text-slate-500">Avg Speed</div>
                      <div className="text-sm font-semibold text-slate-300">
                        {formatBytes(Math.round(flow.bytesTransferred / (flow.duration / 1000)))}/s
                      </div>
                    </div>
                    <div className="bg-slate-800/30 rounded p-2">
                      <div className="text-xs text-slate-500">First Seen</div>
                      <div className="text-xs font-mono text-slate-400">
                        {flow.firstSeen}
                      </div>
                    </div>
                    <div className="bg-slate-800/30 rounded p-2">
                      <div className="text-xs text-slate-500">Last Seen</div>
                      <div className="text-xs font-mono text-slate-400">
                        {flow.lastSeen}
                      </div>
                    </div>
                  </div>

                  {/* Threat Assessment */}
                  <div className="border-t border-slate-800/50 pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-300">
                        Risk Assessment
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                        <span>Normal protocol behavior</span>
                      </div>
                      {flow.status !== "normal" && (
                        <div className={`flex items-center gap-2 ${flow.status === "malicious" ? "text-red-400" : "text-yellow-400"}`}>
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          <span>{flow.status === "malicious" ? "Malicious" : "Suspicious"} activity detected</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Info */}
                  {flow.dns?.length ? (
                    <div className="border-t border-slate-800/50 pt-2">
                      <div className="text-xs font-semibold text-slate-300 mb-1">
                        DNS Queries: {flow.dns.length}
                      </div>
                    </div>
                  ) : null}

                  {flow.http?.length ? (
                    <div className="border-t border-slate-800/50 pt-2">
                      <div className="text-xs font-semibold text-slate-300 mb-1">
                        HTTP Requests: {flow.http.length}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {flows.length === 0 && (
        <div className="flex items-center justify-center flex-1 text-slate-500">
          <p>No flows detected. Upload a PCAP file to analyze.</p>
        </div>
      )}
    </div>
  );
}
