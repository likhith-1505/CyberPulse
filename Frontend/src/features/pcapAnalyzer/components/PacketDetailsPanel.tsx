/**
 * Packet Details Panel Component
 * Shows expanded packet layer breakdown (Wireshark-style)
 * Displays Ethernet → IP → Transport → Payload
 */

import { useState } from "react";
import { ChevronDown, Copy, Check } from "lucide-react";
import { usePcapAnalyzer } from "../store";
import type { Packet } from "../types";

interface PacketLayerField {
  name: string;
  value: string;
  type?: "hex" | "text" | "number";
  children?: PacketLayerField[];
}

export function PacketDetailsPanel() {
  const { packets, selectedPacketId } = usePcapAnalyzer();
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(
    new Set(["frame", "eth", "ip", "transport"])
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const selectedPacket = packets.find((p) => p.id === selectedPacketId);

  if (!selectedPacket) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <p>Select a packet to view details</p>
      </div>
    );
  }

  const toggleLayer = (layer: string) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(layer)) {
      newExpanded.delete(layer);
    } else {
      newExpanded.add(layer);
    }
    setExpandedLayers(newExpanded);
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Build packet layers structure
  const layers: Record<string, PacketLayerField[]> = {
    frame: [
      { name: "Frame Number", value: selectedPacket.id },
      {
        name: "Timestamp",
        value: new Date(selectedPacket.timestamp).toISOString(),
      },
      { name: "Packet Length", value: `${selectedPacket.length} bytes` },
      { name: "Captured Length", value: `${selectedPacket.length} bytes` },
    ],
    ethernet: [
      { name: "Destination MAC", value: "00:00:00:00:00:00", type: "hex" as const },
      { name: "Source MAC", value: "00:00:00:00:00:01", type: "hex" as const },
      { name: "Type", value: "IPv4 (0x0800)", type: "hex" as const },
    ],
    ipv4: [
      { name: "Version", value: "4" },
      { name: "Header Length", value: "20 bytes" },
      { name: "Differentiated Services Field", value: "0x00" },
      { name: "Total Length", value: `${selectedPacket.length}` },
      { name: "Identification", value: "0x1234", type: "hex" as const },
      { name: "Flags", value: selectedPacket.flags?.join(", ") || "None" },
      { name: "Fragment Offset", value: "0" },
      { name: "Time to Live", value: "64" },
      { name: "Protocol", value: selectedPacket.protocol },
      { name: "Header Checksum", value: "0x5678", type: "hex" as const },
      { name: "Source IP", value: selectedPacket.srcIp },
      { name: "Destination IP", value: selectedPacket.dstIp },
    ],
    transport: [
      ...(selectedPacket.protocol === "TCP"
        ? [
            { name: "Source Port", value: "12345" },
            { name: "Destination Port", value: "443" },
            { name: "Sequence Number", value: "1000", type: "hex" as const },
            { name: "Acknowledgment Number", value: "2000", type: "hex" as const },
            { name: "Header Length", value: "20 bytes" },
            { name: "Flags", value: selectedPacket.flags?.join(", ") || "None" },
            { name: "Window Size", value: "65535" },
            { name: "Checksum", value: "0xabcd", type: "hex" as const },
          ]
        : [
            { name: "Source Port", value: "53636" },
            { name: "Destination Port", value: "53" },
            { name: "Length", value: selectedPacket.length.toString() },
            { name: "Checksum", value: "0x9999", type: "hex" as const },
          ]),
    ],
  };

  const renderField = (field: PacketLayerField, depth: number, fieldId: string) => {
    const hasChildren = field.children && field.children.length > 0;
    const typeColor = {
      hex: "text-yellow-400",
      number: "text-cyan-400",
      text: "text-green-400",
    }[field.type || "text"];

    return (
      <div key={fieldId} className="select-none">
        <div
          className="flex items-center gap-2 px-3 py-1 hover:bg-slate-800/50 cursor-pointer group"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => hasChildren && toggleLayer(fieldId)}
        >
          {hasChildren && (
            <ChevronDown
              className={`w-4 h-4 text-slate-500 transition-transform ${
                expandedLayers.has(fieldId) ? "rotate-0" : "-rotate-90"
              }`}
            />
          )}
          {!hasChildren && <div className="w-4" />}

          <span className="text-slate-300 flex-1 font-mono text-xs">{field.name}</span>
          <span className={`text-xs font-mono ${typeColor}`}>{field.value}</span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(field.value, fieldId);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-700/50 rounded"
            title="Copy"
          >
            {copiedField === fieldId ? (
              <Check className="w-3 h-3 text-green-400" />
            ) : (
              <Copy className="w-3 h-3 text-slate-400" />
            )}
          </button>
        </div>

        {hasChildren &&
          expandedLayers.has(fieldId) &&
          field.children!.map((child, idx) =>
            renderField(child, depth + 1, `${fieldId}-${idx}`)
          )}
      </div>
    );
  };

  const layerOrder = [
    { key: "frame", label: "Frame", icon: "📦" },
    { key: "ethernet", label: "Ethernet II", icon: "🔗" },
    { key: "ipv4", label: "Internet Protocol Version 4", icon: "🌐" },
    {
      key: "transport",
      label: selectedPacket.protocol === "TCP" ? "Transmission Control Protocol" : "User Datagram Protocol",
      icon: "📨",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900/30 rounded-lg border border-slate-800/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/50 bg-slate-950/50">
        <h3 className="text-sm font-semibold text-slate-200">
          Packet #{selectedPacket.id}
        </h3>
        <p className="text-xs text-slate-400 mt-1">{selectedPacket.info}</p>
      </div>

      {/* Layers */}
      <div className="flex-1 overflow-auto font-mono text-xs">
        {layerOrder.map(({ key, label, icon }) => (
          <div key={key} className="border-b border-slate-800/30">
            <div
              onClick={() => toggleLayer(key)}
              className="px-3 py-2 bg-slate-900/30 hover:bg-slate-800/50 cursor-pointer flex items-center gap-2 transition-colors"
            >
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  expandedLayers.has(key) ? "rotate-0" : "-rotate-90"
                }`}
              />
              <span className="text-lg w-5">{icon}</span>
              <span className="text-slate-300 font-semibold">{label}</span>
              <span className="text-slate-500 text-xs ml-auto">
                ({layers[key]?.length || 0} fields)
              </span>
            </div>

            {expandedLayers.has(key) &&
              layers[key]?.map((field, idx) =>
                renderField(field, 0, `${key}-${idx}`)
              )}
          </div>
        ))}
      </div>

      {/* Hex Dump */}
      <div className="border-t border-slate-800/50 bg-slate-950/50 max-h-32 overflow-auto">
        <div className="px-3 py-2 border-b border-slate-800/30">
          <h4 className="text-xs font-semibold text-slate-300">Hex Dump</h4>
        </div>
        <div className="px-3 py-2 space-y-1">
          <div className="text-xs text-slate-500 font-mono">
            {"0000  00 01 02 03 04 05 06 07  08 09 0a 0b 0c 0d 0e 0f  "}
            <span className="text-slate-400">................</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            {"0010  10 11 12 13 14 15 16 17  18 19 1a 1b 1c 1d 1e 1f  "}
            <span className="text-slate-400">................</span>
          </div>
        </div>
      </div>
    </div>
  );
}
