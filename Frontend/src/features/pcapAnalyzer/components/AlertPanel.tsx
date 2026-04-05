/**
 * Alert Panel Component
 * Real-time threat detection and prioritized alerts
 * Supports filtering by severity, type, and status
 */

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, X, Filter } from "lucide-react";
import { usePcapAnalyzer } from "../store";
import type { Alert } from "../types";

type AlertSeverity = "critical" | "high" | "medium" | "low";
type AlertStatus = "active" | "dismissed" | "all";

export function AlertPanel() {
  const { alerts } = usePcapAnalyzer();
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AlertStatus>("active");
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    let result = alerts;

    if (severityFilter !== "all") {
      result = result.filter((a) => a.severity === severityFilter);
    }

    if (statusFilter === "active") {
      result = result.filter((a) => !dismissedAlerts.has(a.id));
    } else if (statusFilter === "dismissed") {
      result = result.filter((a) => dismissedAlerts.has(a.id));
    }

    return result.sort((a, b) => {
      const severityOrder: Record<AlertSeverity, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [alerts, severityFilter, statusFilter, dismissedAlerts]);

  const dismissAlert = (alertId: string) => {
    const newDismissed = new Set(dismissedAlerts);
    newDismissed.add(alertId);
    setDismissedAlerts(newDismissed);
  };

  const getSeverityStyle = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 border-red-500/50 text-red-300";
      case "high":
        return "bg-orange-500/20 border-orange-500/50 text-orange-300";
      case "medium":
        return "bg-yellow-500/20 border-yellow-500/50 text-yellow-300";
      case "low":
        return "bg-blue-500/20 border-blue-500/50 text-blue-300";
    }
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical":
        return "🚨";
      case "high":
        return "⚠️";
      case "medium":
        return "⚡";
      case "low":
        return "ℹ️";
    }
  };

  // Count by severity
  const activeCounts = useMemo(() => {
    const active = alerts.filter((a) => !dismissedAlerts.has(a.id));
    return {
      critical: active.filter((a) => a.severity === "critical").length,
      high: active.filter((a) => a.severity === "high").length,
      medium: active.filter((a) => a.severity === "medium").length,
      low: active.filter((a) => a.severity === "low").length,
    };
  }, [alerts, dismissedAlerts]);

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Alert Summary */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setSeverityFilter("critical")}
          className={`p-2 rounded border text-center text-xs transition-colors ${
            severityFilter === "critical"
              ? "bg-red-500/30 border-red-500 text-red-200"
              : "bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-red-500/50"
          }`}
        >
          <div className="font-semibold text-sm">{activeCounts.critical}</div>
          <div className="text-xs">Critical</div>
        </button>
        <button
          onClick={() => setSeverityFilter("high")}
          className={`p-2 rounded border text-center text-xs transition-colors ${
            severityFilter === "high"
              ? "bg-orange-500/30 border-orange-500 text-orange-200"
              : "bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-orange-500/50"
          }`}
        >
          <div className="font-semibold text-sm">{activeCounts.high}</div>
          <div className="text-xs">High</div>
        </button>
        <button
          onClick={() => setSeverityFilter("medium")}
          className={`p-2 rounded border text-center text-xs transition-colors ${
            severityFilter === "medium"
              ? "bg-yellow-500/30 border-yellow-500 text-yellow-200"
              : "bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-yellow-500/50"
          }`}
        >
          <div className="font-semibold text-sm">{activeCounts.medium}</div>
          <div className="text-xs">Medium</div>
        </button>
        <button
          onClick={() => setSeverityFilter("low")}
          className={`p-2 rounded border text-center text-xs transition-colors ${
            severityFilter === "low"
              ? "bg-blue-500/30 border-blue-500 text-blue-200"
              : "bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-blue-500/50"
          }`}
        >
          <div className="font-semibold text-sm">{activeCounts.low}</div>
          <div className="text-xs">Low</div>
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 border-b border-slate-800/50">
        <button
          onClick={() => setStatusFilter("active")}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            statusFilter === "active"
              ? "border-purple-500 text-purple-300"
              : "border-transparent text-slate-500 hover:text-slate-400"
          }`}
        >
          Active ({alerts.filter((a) => !dismissedAlerts.has(a.id)).length})
        </button>
        <button
          onClick={() => setStatusFilter("dismissed")}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            statusFilter === "dismissed"
              ? "border-purple-500 text-purple-300"
              : "border-transparent text-slate-500 hover:text-slate-400"
          }`}
        >
          Dismissed ({dismissedAlerts.size})
        </button>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-auto space-y-2 pr-2">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-lg border p-3 transition-opacity ${getSeverityStyle(
              alert.severity
            )} ${dismissedAlerts.has(alert.id) ? "opacity-50" : ""}`}
          >
            {/* Alert Header */}
            <div className="flex items-start gap-3">
              <div className="text-xl flex-shrink-0">
                {getSeverityIcon(alert.severity)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm">{alert.title}</h4>
                  <span className="text-xs opacity-75 flex-shrink-0">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-xs opacity-75 mt-1">{alert.description}</p>

                {/* Alert Details */}
                {alert.details && (
                  <div className="mt-2 space-y-1 text-xs opacity-75">
                    <div>
                      {alert.details.srcIp && (
                        <span className="font-mono">
                          From: <span className="text-inherit">{alert.details.srcIp}</span>
                        </span>
                      )}
                      {alert.details.dstIp && (
                        <>
                          {" "}
                          <span className="font-mono">
                            To: <span className="text-inherit">{alert.details.dstIp}</span>
                          </span>
                        </>
                      )}
                    </div>
                    {alert.details.port && (
                      <div className="font-mono">
                        Port: <span className="text-inherit">{alert.details.port}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dismiss Button */}
              {!dismissedAlerts.has(alert.id) && (
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="p-1 hover:bg-current/20 rounded transition-colors flex-shrink-0"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {dismissedAlerts.has(alert.id) && (
                <div className="p-1 flex-shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAlerts.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 text-slate-500">
          <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">
            {statusFilter === "dismissed"
              ? "No dismissed alerts"
              : "No alerts detected"}
          </p>
        </div>
      )}
    </div>
  );
}
