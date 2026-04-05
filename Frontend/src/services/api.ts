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

export const api = {
  async analyzePcap(_file: File): Promise<PcapResult> {
    await delay(2500);
    return {
      totalPackets: 14823,
      duration: "4m 32s",
      protocols: { TCP: 8420, UDP: 4100, ICMP: 1200, HTTP: 780, DNS: 323 },
      alerts: [
        { severity: "high", message: "Port scan detected from 192.168.1.105", src: "192.168.1.105", dst: "10.0.0.1" },
        { severity: "high", message: "SYN flood attempt detected", src: "203.0.113.42", dst: "10.0.0.5" },
        { severity: "medium", message: "Unusual DNS query volume", src: "192.168.1.20", dst: "8.8.8.8" },
        { severity: "low", message: "Unencrypted HTTP credentials transmitted", src: "192.168.1.55", dst: "104.21.0.1" },
      ],
      trafficTimeline: Array.from({ length: 12 }, (_, i) => ({
        time: `${i * 22}s`,
        bytes: Math.floor(Math.random() * 9000 + 1000),
      })),
    };
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