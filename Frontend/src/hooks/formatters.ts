/**
 * Real-time dashboard data formatting utilities
 *
 * Converts raw API data into human-friendly formats:
 * - Relative time formatting (e.g. "2 minutes ago")
 * - Number abbreviations (e.g. "1.2K" threats)
 * - Color coding for severity levels
 * - Icon selection based on category
 */

import { safeTimeAgo } from "./time";

export const formatRelativeTime = (dateString: string | number | Date | null | undefined): string => {
  try {
    return safeTimeAgo(dateString);
  } catch {
    return "Unknown";
  }
};

export const formatNumber = (num: number): string => {
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + "K";
  return (num / 1000000).toFixed(1) + "M";
};

export const getRiskLevel = (riskScore: number): "critical" | "high" | "medium" | "low" => {
  if (riskScore >= 80) return "critical";
  if (riskScore >= 60) return "high";
  if (riskScore >= 40) return "medium";
  return "low";
};

export const getRiskColor = (
  level: "critical" | "high" | "medium" | "low"
): string => {
  const colors: Record<string, string> = {
    critical: "#ef4444", // red
    high: "#f97316", // orange
    medium: "#eab308", // yellow
    low: "#22c55e", // green
  };
  return colors[level] || "#666";
};

export const getScanIcon = (type: string): string => {
  const icons: Record<string, string> = {
    pcap: "🔍",
    file: "📁",
    url: "🌐",
    email: "📧",
  };
  return icons[type.toLowerCase()] || "📊";
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    clean: "#22c55e",
    suspicious: "#eab308",
    malicious: "#ef4444",
    unknown: "#666",
  };
  return colors[status.toLowerCase()] || "#666";
};

/**
 * Format bytes to human-readable size
 * Example: 1024 -> "1 KB"
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = (bytes / Math.pow(1024, index)).toFixed(1);
  return `${value} ${units[index]}`;
};

/**
 * Format milliseconds to human-readable time
 * Example: 1500 -> "1.5s"
 */
export const formatLatency = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

/**
 * Parse latency string from API and return numeric value
 * Example: "245ms" -> 245
 */
export const parseLatency = (latency: string): number => {
  if (latency.includes("ms")) {
    return parseInt(latency);
  }
  if (latency.includes("s")) {
    return parseFloat(latency) * 1000;
  }
  return 0;
};

/**
 * Generate a gradient color based on value (0-100)
 * Green (good) -> Yellow (warning) -> Red (critical)
 */
export const getGradientColor = (value: number): string => {
  if (value < 33) return "#22c55e"; // green
  if (value < 66) return "#eab308"; // yellow
  return "#ef4444"; // red
};

/**
 * Format uptime percentage
 * Example: 99.9 -> "99.9%"
 */
export const formatUptime = (percentage: number): string => {
  return `${percentage.toFixed(2)}%`;
};
