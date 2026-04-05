/**
 * Network Topology Component
 * Displays top talkers and network connections
 * Identifies suspicious communication patterns
 */

import { useMemo } from "react";
import { TrendingUp, AlertTriangle, Network } from "lucide-react";
import { usePcapAnalyzer } from "../store";

export function NetworkTopology() {
  const { packets, flows } = usePcapAnalyzer();

  // Calculate top talkers (source IPs)
  const topTalkers = useMemo(() => {
    const talkers: Record<string, { packets: number; bytes: number }> = {};

    packets.forEach((p) => {
      if (!talkers[p.srcIp]) {
        talkers[p.srcIp] = { packets: 0, bytes: 0 };
      }
      talkers[p.srcIp].packets += 1;
      talkers[p.srcIp].bytes += p.length;
    });

    return Object.entries(talkers)
      .map(([ip, data]) => ({ ip, ...data }))
      .sort((a, b) => b.packets - a.packets)
      .slice(0, 10);
  }, [packets]);

  // Calculate top destinations (destination IPs)
  const topDestinations = useMemo(() => {
    const dests: Record<string, { packets: number; bytes: number }> = {};

    packets.forEach((p) => {
      if (!dests[p.dstIp]) {
        dests[p.dstIp] = { packets: 0, bytes: 0 };
      }
      dests[p.dstIp].packets += 1;
      dests[p.dstIp].bytes += p.length;
    });

    return Object.entries(dests)
      .map(([ip, data]) => ({ ip, ...data }))
      .sort((a, b) => b.packets - a.packets)
      .slice(0, 10);
  }, [packets]);

  // Detect suspicious patterns
  const suspiciousPatterns = useMemo(() => {
    const patterns = [];

    // Check for port scanning (many different ports from one source)
    const portsBySource: Record<string, Set<number>> = {};
    flows.forEach((f) => {
      if (!portsBySource[f.srcIp]) {
        portsBySource[f.srcIp] = new Set();
      }
      portsBySource[f.srcIp].add(f.dstPort);
    });

    Object.entries(portsBySource).forEach(([ip, ports]) => {
      if (ports.size > 10) {
        patterns.push({
          type: "Port Scan",
          description: `${ip} connected to ${ports.size} different ports`,
          severity: "high",
          ip,
        });
      }
    });

    // Check for connection resets
    flows.forEach((f) => {
      if (f.flags?.includes("RST")) {
        patterns.push({
          type: "Connection Reset",
          description: `Reset connection between ${f.srcIp} and ${f.dstIp}:${f.dstPort}`,
          severity: "medium",
          ip: f.srcIp,
        });
      }
    });

    return patterns.slice(0, 5);
  }, [flows]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Top Talkers */}
      <div className="flex flex-col bg-slate-900/30 rounded-lg border border-slate-800/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800/50 bg-slate-950/50 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-slate-200">Top Talkers</h3>
        </div>

        <div className="flex-1 overflow-auto">
          {topTalkers.length > 0 ? (
            <div className="divide-y divide-slate-800/30">
              {topTalkers.map((talker, idx) => (
                <div
                  key={talker.ip}
                  className="p-3 hover:bg-slate-800/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-blue-400">
                      #{idx + 1} {talker.ip}
                    </span>
                    <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">
                      {talker.packets}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                      style={{
                        width: `${(talker.packets / topTalkers[0].packets) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="text-xs text-slate-500 mt-1">
                    {formatBytes(talker.bytes)} data
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              <p className="text-sm">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Destinations */}
      <div className="flex flex-col bg-slate-900/30 rounded-lg border border-slate-800/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800/50 bg-slate-950/50 flex items-center gap-2">
          <Network className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-semibold text-slate-200">Top Destinations</h3>
        </div>

        <div className="flex-1 overflow-auto">
          {topDestinations.length > 0 ? (
            <div className="divide-y divide-slate-800/30">
              {topDestinations.map((dest, idx) => (
                <div
                  key={dest.ip}
                  className="p-3 hover:bg-slate-800/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-green-400">
                      #{idx + 1} {dest.ip}
                    </span>
                    <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">
                      {dest.packets}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-cyan-500"
                      style={{
                        width: `${
                          (dest.packets / topDestinations[0].packets) * 100
                        }%`,
                      }}
                    />
                  </div>

                  <div className="text-xs text-slate-500 mt-1">
                    {formatBytes(dest.bytes)} data
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              <p className="text-sm">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Suspicious Patterns - takes full width if visible */}
      {suspiciousPatterns.length > 0 && (
        <div className="col-span-2 flex flex-col bg-slate-900/30 rounded-lg border border-slate-800/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800/50 bg-slate-950/50 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Suspicious Patterns
            </h3>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="divide-y divide-slate-800/30">
              {suspiciousPatterns.map((pattern, idx) => (
                <div
                  key={idx}
                  className={`p-3 border-l-4 ${
                    pattern.severity === "high"
                      ? "bg-red-500/10 border-red-500/50"
                      : pattern.severity === "medium"
                      ? "bg-yellow-500/10 border-yellow-500/50"
                      : "bg-blue-500/10 border-blue-500/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-sm text-slate-200">
                        {pattern.type}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {pattern.description}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 font-mono">
                        {pattern.ip}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold flex-shrink-0 ${
                        pattern.severity === "high"
                          ? "bg-red-500/20 text-red-300"
                          : pattern.severity === "medium"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-blue-500/20 text-blue-300"
                      }`}
                    >
                      {pattern.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
