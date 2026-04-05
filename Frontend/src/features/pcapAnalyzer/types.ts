/**
 * PCAP Analyzer - Type Definitions
 * Professional SOC-grade packet analysis types
 */

export interface Packet {
  id: string;
  timestamp: number;
  srcIp: string;
  dstIp: string;
  srcPort?: number;
  dstPort?: number;
  protocol: string;
  length: number;
  info: string;
  flags?: string[];
  payload?: string;
  payloadHex?: string;
  dns?: DNSRecord[];
  http?: HTTPRecord[];
  tls?: TLSRecord[];
}

export interface PacketFlow {
  id: string;
  srcIp: string;
  srcPort?: number;
  dstIp: string;
  dstPort?: number;
  protocol: string;
  packetCount: number;
  bytesTransferred: number;
  totalBytes: number;
  duration: number;
  startTime: number;
  endTime: number;
  status: "normal" | "suspicious" | "malicious";
  firstSeen: string;
  lastSeen: string;
  flags?: string[];
  dns?: DNSRecord[];
  http?: HTTPRecord[];
}

export interface Alert {
  id: string;
  type: "port_scan" | "syn_flood" | "dns_anomaly" | "suspicious_ip" | "data_exfil" | "other";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  sourceIp: string;
  destIp?: string;
  timestamp: number;
  packetIds: string[];
  details?: {
    srcIp?: string;
    dstIp?: string;
    port?: number;
  };
}

export interface ProtocolStats {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DNSRecord {
  timestamp: number;
  query: string;
  queryType?: string;
  type?: string;
  answer: string;
  response?: string;
  responseCode?: string;
  suspicious?: boolean;
}

export interface HTTPRecord {
  timestamp: number;
  srcIp?: string;
  method: string;
  url: string;
  host?: string;
  statusCode?: string | number;
  userAgent?: string;
  suspicious?: boolean;
}

export interface TLSRecord {
  timestamp: number;
  srcIp?: string;
  sni?: string;
  serverName?: string;
  certificate?: string;
  issuer?: string;
  subject?: string;
  validFrom?: number;
  validUntil?: number;
  fingerprint?: string;
  suspicious?: boolean;
}

export interface PcapAnalysisState {
  packets: Packet[];
  flows: PacketFlow[];
  alerts: Alert[];
  selectedPacketId: string | null;
  selectedFlowId: string | null;
  filters: {
    search: string;
    protocol?: string;
    port?: number;
    ip?: string;
    severity?: Alert["severity"];
  };
  dnsRecords: DNSRecord[];
  httpRecords: HTTPRecord[];
  tlsRecords: TLSRecord[];
  protocolStats: ProtocolStats[];
  loading: boolean;
  error: string | null;
}

export interface TimelineEvent {
  timestamp: string;
  event: string;
  severity: Alert["severity"];
  count: number;
}
