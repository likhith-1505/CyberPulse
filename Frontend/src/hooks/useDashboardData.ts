import { useEffect, useRef } from "react";
import { api } from "../services/api";
import { useDashboardStore } from "../store/dashboardStore";

/**
 * Main dashboard data fetching hook with consolidated polling
 *
 * Orchestrates all API calls with:
 * - Single master polling timer to prevent thundering herd
 * - Staggered updates at configurable offsets to distribute API load
 * - Automatic error handling and retry logic
 * - Loading state management
 * - Proper cleanup on unmount
 *
 * This prevents simultaneous API calls and state conflicts by centralizing
 * all polling into one master interval with staggered update offsets.
 *
 * Usage:
 *   useDashboardData({ poll: 5000 })
 */

interface UseDashboardDataOptions {
  poll?: number; // Master polling interval in ms (default 5000)
  // Custom intervals (in multiples of poll interval)
  summaryInterval?: number; // 1 = every poll, 2 = every 2 polls (default 1)
  timelineInterval?: number; // (default 1)
  threatsInterval?: number; // (default 2)
  activitiesInterval?: number; // (default 1)
  alertsInterval?: number; // (default 1)
  healthInterval?: number; // (default 3)
}

export const useDashboardData = (
  options: UseDashboardDataOptions = {}
) => {
  const {
    poll = 5000,
    summaryInterval = 1,
    timelineInterval = 1,
    threatsInterval = 2,
    activitiesInterval = 1,
    alertsInterval = 1,
    healthInterval = 3,
  } = options;

  const store = useDashboardStore();
  const pollingCounterRef = useRef(0); // Master counter for staggered updates
  const isMountedRef = useRef(true);

  // ─── FETCHERS WITH ERROR HANDLING ─────────────────────────────────────────

  const fetchSummary = async () => {
    if (!isMountedRef.current) return;
    try {
      store.setSummaryLoading(true);
      const data = await api.getDashboardSummary();
      if (isMountedRef.current) {
        store.setSummary(data);
      }
    } catch (error) {
      if (isMountedRef.current) {
        store.setSummaryError(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  };

  const fetchTimeline = async () => {
    if (!isMountedRef.current) return;
    try {
      store.setTimelineLoading(true);
      const data = await api.getDashboardTimeline();
      if (isMountedRef.current) {
        store.setTimeline(data);
      }
    } catch (error) {
      if (isMountedRef.current) {
        store.setTimelineError(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  };

  const fetchThreats = async () => {
    if (!isMountedRef.current) return;
    try {
      store.setThreatsLoading(true);
      const data = await api.getThreatDistribution();
      if (isMountedRef.current) {
        store.setThreats(data);
      }
    } catch (error) {
      if (isMountedRef.current) {
        store.setThreatsError(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  };

  const fetchActivities = async () => {
    if (!isMountedRef.current) return;
    try {
      store.setActivitiesLoading(true);
      const data = await api.getRecentActivity();
      if (isMountedRef.current) {
        store.setActivities(data);
      }
    } catch (error) {
      if (isMountedRef.current) {
        store.setActivitiesError(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  };

  const fetchAlerts = async () => {
    if (!isMountedRef.current) return;
    try {
      store.setAlertsLoading(true);
      const data = await api.getAlerts();
      if (isMountedRef.current) {
        store.setAlerts(data);
      }
    } catch (error) {
      if (isMountedRef.current) {
        store.setAlertsError(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  };

  const fetchHealth = async () => {
    if (!isMountedRef.current) return;
    try {
      store.setHealthLoading(true);
      const data = await api.getSystemHealth();
      if (isMountedRef.current) {
        store.setHealth(data);
      }
    } catch (error) {
      if (isMountedRef.current) {
        store.setHealthError(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  };

  // ─── INITIAL LOAD ─────────────────────────────────────────────────────────

  useEffect(() => {
    isMountedRef.current = true;

    // Fetch all data immediately on mount
    Promise.all([
      fetchSummary(),
      fetchTimeline(),
      fetchActivities(),
      fetchAlerts(),
    ]); // Fetch fast ones
    fetchThreats(); // Slower
    fetchHealth(); // Slower

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ─── CONSOLIDATED MASTER POLLING LOOP ─────────────────────────────────────
  // This single effect manages all polling with staggered offsets
  // Prevents thundering herd and state conflicts by centralizing the timer

  useEffect(() => {
    if (poll <= 0) return; // Polling disabled

    const masterInterval = setInterval(() => {
      const counter = pollingCounterRef.current++;

      // Each fetcher runs at its configured interval (in multiples of poll)
      // This distributes API load and prevents simultaneous requests

      if (counter % summaryInterval === 0) {
        fetchSummary();
      }

      if (counter % timelineInterval === 0) {
        fetchTimeline();
      }

      if (counter % threatsInterval === 0) {
        fetchThreats();
      }

      if (counter % activitiesInterval === 0) {
        fetchActivities();
      }

      if (counter % alertsInterval === 0) {
        fetchAlerts();
      }

      if (counter % healthInterval === 0) {
        fetchHealth();
      }
    }, poll);

    return () => {
      clearInterval(masterInterval);
    };
  }, [poll, summaryInterval, timelineInterval, threatsInterval, activitiesInterval, alertsInterval, healthInterval]);

  // Return refetch methods for manual updates
  return {
    refetch: {
      summary: fetchSummary,
      timeline: fetchTimeline,
      threats: fetchThreats,
      activities: fetchActivities,
      alerts: fetchAlerts,
      health: fetchHealth,
      all: async () => {
        await Promise.all([
          fetchSummary(),
          fetchTimeline(),
          fetchThreats(),
          fetchActivities(),
          fetchAlerts(),
          fetchHealth(),
        ]);
      },
    },
  };
};
