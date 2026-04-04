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

  async scanFile(_file: File): Promise<FileScanResult> {
    await delay(3000);
    const detected = Math.floor(Math.random() * 12);
    const engines = [
      "Kaspersky", "Malwarebytes", "CrowdStrike", "SentinelOne", "Sophos",
      "ESET", "Bitdefender", "Avast", "McAfee", "Symantec", "Panda", "Avira",
      "TrendMicro", "F-Secure", "Cylance",
    ].map((name, i) => ({
      name,
      detected: i < detected,
      result: i < detected ? "Trojan.GenericKD.46623585" : null,
    }));
    return {
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      fileName: _file.name,
      fileSize: `${(_file.size / 1024).toFixed(1)} KB`,
      detectionRatio: { detected, total: engines.length },
      engines,
      firstSeen: "2025-11-02 14:32 UTC",
      riskLevel: detected > 5 ? "dangerous" : detected > 0 ? "suspicious" : "clean",
    };
  },

  async analyzeUrl(url: string): Promise<UrlScanResult> {
    await delay(2000);
    const risky = url.includes("phish") || url.includes("malware") || url.includes("hack");
    return {
      url,
      riskLevel: risky ? "dangerous" : "safe",
      riskScore: risky ? 87 : 12,
      domain: new URL(url.startsWith("http") ? url : `https://${url}`).hostname,
      ip: "104.21.45.23",
      country: "United States",
      registrar: "Cloudflare, Inc.",
      createdAt: "2022-03-15",
      indicators: risky
        ? [
            { type: "Phishing Kit", value: "Detected credential harvester", severity: "critical" },
            { type: "Domain Age", value: "Registered 2 days ago", severity: "warning" },
            { type: "SSL Certificate", value: "Self-signed certificate", severity: "warning" },
          ]
        : [
            { type: "SSL", value: "Valid certificate (Let's Encrypt)", severity: "info" },
            { type: "Domain Age", value: "Registered 3 years ago", severity: "info" },
          ],
      categories: risky ? ["Phishing", "Malware"] : ["Technology", "Safe"],
    };
  },

  async analyzeEmail(headers: string): Promise<EmailAnalysisResult> {
    await delay(1800);
    const hasFail = headers.toLowerCase().includes("fail");
    return {
      senderIp: "198.51.100.42",
      fromAddress: "noreply@suspicious-domain.xyz",
      replyTo: "harvester@evil.cc",
      subject: "Urgent: Verify your account",
      spf: hasFail ? "fail" : "pass",
      dkim: hasFail ? "fail" : "pass",
      dmarc: hasFail ? "fail" : "pass",
      spoofingRisk: hasFail ? "high" : "low",
      hops: [
        { from: "mail.suspicious-domain.xyz [198.51.100.42]", by: "mx1.victim.com", time: "Mon, 1 Apr 2025 09:12:03" },
        { from: "mx1.victim.com", by: "mail.victim.com", time: "Mon, 1 Apr 2025 09:12:05" },
      ],
      warnings: hasFail
        ? [
            "SPF record does not authorize sending IP",
            "DKIM signature validation failed",
            "Reply-To domain differs from From domain",
            "Sender IP has history of spam",
          ]
        : ["Reply-To domain differs from From domain"],
    };
  },
};