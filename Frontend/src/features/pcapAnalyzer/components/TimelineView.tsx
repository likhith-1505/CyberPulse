/**
 * Timeline View Component
 * Interactive packet and event timeline with drill-down
 */

import { useMemo, useState } from "react";
import { ZoomIn, ZoomOut, Activity } from "lucide-react";
import { usePcapAnalyzer } from "../store";
import type { Packet } from "../types";

type TimelineGranularity = "second" | "minute" | "hourly";

export function TimelineView() {
  const { packets, alerts } = usePcapAnalyzer();
  const [granularity, setGranularity] = useState<TimelineGranularity>("second");
  const [hoverBucket, setHoverBucket] = useState<number | null>(null);

  // Group packets by time
  const timelineBuckets = useMemo(() => {
    if (packets.length === 0) return [];

    const bucketSize =
      granularity === "second" ? 1000 : granularity === "minute" ? 60000 : 3600000;

    const minTime = Math.min(...packets.map((p) => p.timestamp));
    const maxTime = Math.max(...packets.map((p) => p.timestamp));

    const buckets: Array<{
      startTime: number;
      packets: Packet[];
      alerts: typeof alerts;
      avgSize: number;
    }> = [];

    for (let time = minTime; time <= maxTime; time += bucketSize) {
      const endTime = time + bucketSize;
      const bucketPackets = packets.filter(
        (p) => p.timestamp >= time && p.timestamp < endTime
      );
      const bucketAlerts = alerts.filter(
        (a) => a.timestamp >= time && a.timestamp < endTime
      );

      if (bucketPackets.length > 0 || bucketAlerts.length > 0) {
        buckets.push({
          startTime: time,
          packets: bucketPackets,
          alerts: bucketAlerts,
          avgSize:
            bucketPackets.length > 0
              ? Math.round(
                  bucketPackets.reduce((sum, p) => sum + p.length, 0) /
                    bucketPackets.length
                )
              : 0,
        });
      }
    }

    return buckets;
  }, [packets, alerts, granularity]);

  // Calculate statistics
  const maxPacketsInBucket = useMemo(
    () => Math.max(...timelineBuckets.map((b) => b.packets.length), 1),
    [timelineBuckets]
  );

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (granularity === "second") {
      return date.toLocaleTimeString();
    } else if (granularity === "minute") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/30 rounded-lg border border-slate-800/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/50 bg-slate-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Activity Timeline
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setGranularity("second")}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                granularity === "second"
                  ? "bg-purple-500/30 text-purple-200 border border-purple-500/50"
                  : "bg-slate-800/30 text-slate-400 hover:bg-slate-700/50"
              }`}
            >
              1s
            </button>
            <button
              onClick={() => setGranularity("minute")}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                granularity === "minute"
                  ? "bg-purple-500/30 text-purple-200 border border-purple-500/50"
                  : "bg-slate-800/30 text-slate-400 hover:bg-slate-700/50"
              }`}
            >
              1m
            </button>
            <button
              onClick={() => setGranularity("hourly")}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                granularity === "hourly"
                  ? "bg-purple-500/30 text-purple-200 border border-purple-500/50"
                  : "bg-slate-800/30 text-slate-400 hover:bg-slate-700/50"
              }`}
            >
              1h
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* Main Timeline */}
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-3">
              Packet Activity
            </div>
            <div className="space-y-2">
              {timelineBuckets.map((bucket, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setHoverBucket(idx)}
                  onMouseLeave={() => setHoverBucket(null)}
                  className="group cursor-pointer"
                >
                  <div className="flex items-end gap-2 h-20">
                    {/* Bar Chart */}
                    <div className="flex-1 flex items-end gap-0.5 bg-slate-800/20 p-2 rounded">
                      {/* Packet distribution within bucket */}
                      <div
                        className="flex-1 bg-gradient-to-t from-purple-500 to-blue-500 rounded-t transition-all group-hover:from-purple-400 group-hover:to-blue-400"
                        style={{
                          height: `${
                            (bucket.packets.length / maxPacketsInBucket) * 100
                          }%`,
                          minHeight: "4px",
                        }}
                        title={`${bucket.packets.length} packets`}
                      />

                      {/* Alert indicator */}
                      {bucket.alerts.length > 0 && (
                        <div className="w-1 bg-red-500 rounded-t" title={`${bucket.alerts.length} alerts`} />
                      )}
                    </div>

                    {/* Details on hover */}
                    {hoverBucket === idx && (
                      <div className="text-right whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-200">
                          {bucket.packets.length}
                        </div>
                        <div className="text-xs text-slate-500">pkts</div>
                      </div>
                    )}
                  </div>

                  {/* Time label */}
                  <div className="text-xs text-slate-500 mt-1">
                    {formatTime(bucket.startTime)}
                  </div>

                  {/* Expanded details on hover */}
                  {hoverBucket === idx && (
                    <div className="mt-2 space-y-1 bg-slate-800/30 p-2 rounded text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Packets:</span>
                        <span className="text-slate-200 font-semibold">
                          {bucket.packets.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Size:</span>
                        <span className="text-slate-200 font-mono">
                          {bucket.avgSize} bytes
                        </span>
                      </div>
                      {bucket.alerts.length > 0 && (
                        <div className="flex justify-between text-red-400">
                          <span>Alerts:</span>
                          <span className="font-semibold">{bucket.alerts.length}</span>
                        </div>
                      )}

                      {/* Protocols in this bucket */}
                      <div className="mt-2 pt-2 border-t border-slate-700/50">
                        <div className="text-slate-400 mb-1">Protocols:</div>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(
                            new Set(bucket.packets.map((p) => p.protocol))
                          ).map((proto) => (
                            <span
                              key={proto}
                              className="px-1.5 py-0.5 bg-slate-700/50 rounded text-slate-300"
                            >
                              {proto}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Alert Timeline */}
          {alerts.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-3">
                Alert Timeline
              </div>
              <div className="space-y-1">
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-2 rounded text-xs border-l-2 flex items-center justify-between ${
                      alert.severity === "critical"
                        ? "bg-red-500/10 border-red-500 text-red-300"
                        : alert.severity === "high"
                        ? "bg-orange-500/10 border-orange-500 text-orange-300"
                        : alert.severity === "medium"
                        ? "bg-yellow-500/10 border-yellow-500 text-yellow-300"
                        : "bg-blue-500/10 border-blue-500 text-blue-300"
                    }`}
                  >
                    <span className="font-semibold">{alert.title}</span>
                    <span className="text-xs opacity-75">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {timelineBuckets.length === 0 && (
          <div className="flex items-center justify-center h-32 text-slate-500">
            <p>No packets captured</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="px-4 py-3 border-t border-slate-800/50 bg-slate-950/50 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-xs text-slate-500">Total Packets</div>
          <div className="text-sm font-semibold text-slate-200">
            {packets.length}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Alerts</div>
          <div className="text-sm font-semibold text-red-400">
            {alerts.length}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Duration</div>
          <div className="text-sm font-semibold text-slate-200">
            {packets.length > 0
              ? Math.round(
                  (Math.max(...packets.map((p) => p.timestamp)) -
                    Math.min(...packets.map((p) => p.timestamp))) /
                    1000
                ) + "s"
              : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
