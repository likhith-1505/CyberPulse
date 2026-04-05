/**
 * PCAP Analyzer - State Management
 * Using Zustand for lightweight, scalable state
 */

import { create } from "zustand";
import { PcapAnalysisState, Packet, PacketFlow, Alert } from "./types";

interface PcapAnalyzerStore extends PcapAnalysisState {
  // Actions
  setPackets: (packets: Packet[]) => void;
  setFlows: (flows: PacketFlow[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  selectPacket: (packetId: string | null) => void;
  selectFlow: (flowId: string | null) => void;
  updateFilters: (filters: Partial<PcapAnalysisState["filters"]>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Derived
  getFilteredPackets: () => Packet[];
  getFilteredAlerts: () => Alert[];
  getTopTalkers: (limit: number) => { ip: string; bytes: number }[];
  getTopDestinations: (limit: number) => { ip: string; bytes: number }[];
}

const initialState: PcapAnalysisState = {
  packets: [],
  flows: [],
  alerts: [],
  selectedPacketId: null,
  selectedFlowId: null,
  filters: {
    search: "",
  },
  dnsRecords: [],
  httpRecords: [],
  tlsRecords: [],
  protocolStats: [],
  loading: false,
  error: null,
};

export const usePcapAnalyzer = create<PcapAnalyzerStore>((set, get) => ({
  ...initialState,

  setPackets: (packets) => set({ packets }),
  setFlows: (flows) => set({ flows }),
  setAlerts: (alerts) => set({ alerts }),
  selectPacket: (packetId) => set({ selectedPacketId: packetId }),
  selectFlow: (flowId) => set({ selectedFlowId: flowId }),
  updateFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),

  // Derived selectors
  getFilteredPackets: () => {
    const state = get();
    let filtered = state.packets;

    if (state.filters.search) {
      const query = state.filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.srcIp.includes(query) ||
          p.dstIp.includes(query) ||
          p.info.toLowerCase().includes(query)
      );
    }

    if (state.filters.protocol) {
      filtered = filtered.filter((p) => p.protocol === state.filters.protocol);
    }

    if (state.filters.ip) {
      filtered = filtered.filter(
        (p) => p.srcIp === state.filters.ip || p.dstIp === state.filters.ip
      );
    }

    if (state.filters.port) {
      filtered = filtered.filter(
        (p) => p.srcPort === state.filters.port || p.dstPort === state.filters.port
      );
    }

    return filtered;
  },

  getFilteredAlerts: () => {
    const state = get();
    if (state.filters.severity) {
      return state.alerts.filter((a) => a.severity === state.filters.severity);
    }
    return state.alerts;
  },

  getTopTalkers: (limit = 10) => {
    const state = get();
    const talkers: Record<string, number> = {};

    state.packets.forEach((p) => {
      talkers[p.srcIp] = (talkers[p.srcIp] || 0) + p.length;
    });

    return Object.entries(talkers)
      .map(([ip, bytes]) => ({ ip, bytes }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, limit);
  },

  getTopDestinations: (limit = 10) => {
    const state = get();
    const dests: Record<string, number> = {};

    state.packets.forEach((p) => {
      dests[p.dstIp] = (dests[p.dstIp] || 0) + p.length;
    });

    return Object.entries(dests)
      .map(([ip, bytes]) => ({ ip, bytes }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, limit);
  },
}));
