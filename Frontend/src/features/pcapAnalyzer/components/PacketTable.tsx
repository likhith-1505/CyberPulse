/**
 * Packet Table Component
 * Wireshark-style high-performance packet inspection table
 * Supports search, filtering, and drill-down
 */

import { useMemo, useState } from "react";
import { Search, Filter, AlertTriangle } from "lucide-react";
import { usePcapAnalyzer } from "../store";
import type { Packet } from "../types";

interface PacketTableProps {
  onSelectPacket: (packetId: string) => void;
}

export function PacketTable({ onSelectPacket }: PacketTableProps) {
  const { packets, selectedPacketId, updateFilters, filters } = usePcapAnalyzer();
  const [searchTerm, setSearchTerm] = useState("");
  const [protocolFilter, setProtocolFilter] = useState<string | null>(null);

  // Filter packets
  const filteredPackets = useMemo(() => {
    let result = packets;

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.srcIp.includes(query) ||
          p.dstIp.includes(query) ||
          p.info.toLowerCase().includes(query)
      );
    }

    if (protocolFilter) {
      result = result.filter((p) => p.protocol === protocolFilter);
    }

    return result;
  }, [packets, searchTerm, protocolFilter]);

  // Get unique protocols
  const protocols = useMemo(
    () => [...new Set(packets.map((p) => p.protocol))],
    [packets]
  );

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    updateFilters({ search: value });
  };

  const isSuspiciousPacket = (packet: Packet) => {
    return (
      packet.flags?.includes("RST") ||
      packet.flags?.includes("FIN") ||
      packet.info.toLowerCase().includes("suspicious")
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/30 rounded-lg border border-slate-800/50 overflow-hidden">
      {/* Header with Search & Filters */}
      <div className="p-4 border-b border-slate-800/50 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search (IP, domain, port)..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
            />
          </div>

          {/* Quick Filters */}
          <select
            value={protocolFilter || ""}
            onChange={(e) => setProtocolFilter(e.target.value || null)}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-sm focus:outline-none focus:border-purple-500/50"
          >
            <option value="">All Protocols</option>
            {protocols.map((proto) => (
              <option key={proto} value={proto}>
                {proto}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{filteredPackets.length} packets</span>
          <span>Showing {Math.min(filteredPackets.length, 100)} of {filteredPackets.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-950/80 border-b border-slate-800/50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-300 w-12">#</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-300">Time</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-300">Source IP</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-300">Dest IP</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-300">Protocol</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-300">Length</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-300 flex-1">Info</th>
            </tr>
          </thead>
          <tbody>
            {filteredPackets.slice(0, 100).map((packet, idx) => {
              const isSuspicious = isSuspiciousPacket(packet);
              const isSelected = packet.id === selectedPacketId;

              return (
                <tr
                  key={packet.id}
                  onClick={() => onSelectPacket(packet.id)}
                  className={`border-b border-slate-800/30 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-purple-500/20 hover:bg-purple-500/30"
                      : isSuspicious
                      ? "bg-red-500/10 hover:bg-red-500/20"
                      : "hover:bg-slate-800/30"
                  }`}
                >
                  <td className="px-4 py-2 text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-2 text-slate-400 font-mono">
                    {new Date(packet.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2 text-blue-400 font-mono">{packet.srcIp}</td>
                  <td className="px-4 py-2 text-green-400 font-mono">{packet.dstIp}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 bg-slate-800/50 rounded text-slate-300">
                      {packet.protocol}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-400">{packet.length}</td>
                  <td className="px-4 py-2 text-slate-300 truncate flex items-center gap-2">
                    {isSuspicious && <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                    {packet.info}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-950/50 border-t border-slate-800/50 text-xs text-slate-500">
        Showing {filteredPackets.length} of {packets.length} packets • Right-click for options • Click row for details
      </div>
    </div>
  );
}
