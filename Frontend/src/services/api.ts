// Mock API service — replace with real FastAPI calls
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface PcapResult {
  totalPackets: number;
  duration: string;
  protocols: Record<string, number>;
  alerts: Array<{ severity: "high" | "medium" | "low"; message: string; src: string; dst: string }>;
  trafficTimeline: Array<{ time: string; bytes: number }>;
}

export interface FileScanResult {
  sha256: string;
  fileName: string;
  fileSize: string;
  detectionRatio: { detected: number; total: number };
  engines: Array<{ name: string; detected: boolean; result: string | null }>;
  firstSeen: string;
  riskLevel: "clean" | "suspicious" | "dangerous";
}

export interface UrlScanResult {
  url: string;
  riskLevel: "safe" | "suspicious" | "dangerous";
  riskScore: number;
  domain: string;
  ip: string;
  country: string;
  registrar: string;
  createdAt: string;
  indicators: Array<{ type: string; value: string; severity: "info" | "warning" | "critical" }>;
  categories: string[];
}

export interface EmailAnalysisResult {
  senderIp: string;
  fromAddress: string;
  replyTo: string;
  subject: string;
  spf: "pass" | "fail" | "neutral" | "none";
  dkim: "pass" | "fail" | "none";
  dmarc: "pass" | "fail" | "none";
  spoofingRisk: "low" | "medium" | "high";
  hops: Array<{ from: string; by: string; time: string }>;
  warnings: string[];
}

export interface DashboardStats {
  total_scans: number;
  threats_detected: number;
}

export interface RecentScan {
  type: string;
  timestamp: string;
  result: string;
  threat_count: number;
}

export const api = {
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch("http://localhost:8000/stats");
    if (!res.ok) throw new Error("Failed to fetch dashboard stats");
    return res.json();
  },

  async getRecentActivity(): Promise<RecentScan[]> {
    const res = await fetch("http://localhost:8000/recent-activity");
    if (!res.ok) throw new Error("Failed to fetch recent activity");
    return res.json();
  },

  async analyzePcap(file: File): Promise<PcapResult> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:8000/pcap/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("PCAP analysis failed");
    return res.json();
  },

  async scanFile(file: File): Promise<FileScanResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("http://localhost:8000/file/scan", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("File scan failed");
  return res.json();
},

  async analyzeUrl(url: string): Promise<UrlScanResult> {
  const res = await fetch("http://localhost:8000/url/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("Scan failed");
  return res.json();
},

  async analyzeEmail(headers: string): Promise<EmailAnalysisResult> {
  const res = await fetch("http://localhost:8000/email/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ headers }),
  });
  if (!res.ok) throw new Error("Analysis failed");
  return res.json();
},
};