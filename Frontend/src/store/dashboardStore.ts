import { create } from "zustand";
import {
  DashboardSummary,
  TimelineDataPoint,
  ThreatDistribution,
  Activity,
  Alert,
  HealthStatus,
} from "../services/api";

/**
 * Dashboard State Management
 *
 * Manages all real-time dashboard data:
 * - Summary statistics (scans, threats, risk score)
 * - Timeline data for traffic charts (with append pattern for persistence)
 * - Threat distribution breakdown
 * - Recent activity feed
 * - Active alerts
 * - System health
 * - Loading/error states (with partial updates to prevent flicker)
 *
 * Automatically triggers re-renders when data updates
 *
 * Key improvements for stability:
 * - Partial state updates prevent full object overwrites
 * - Timeline appends instead of replaces to maintain history
 * - Never sets state to null before fetch (prevents UI flicker)
 * - Limits data arrays to configurable sizes to prevent memory leaks
 */

interface DashboardState {
  // ─── DATA ─────────────────────────────────────────────────────────────────

  summary: DashboardSummary | null;
  timeline: TimelineDataPoint[];
  threats: ThreatDistribution | null;
  activities: Activity[];
  alerts: Alert[];
  health: HealthStatus | null;

  // ─── UI STATE ──────────────────────────────────────────────────────────────

  loading: {
    summary: boolean;
    timeline: boolean;
    threats: boolean;
    activities: boolean;
    alerts: boolean;
    health: boolean;
  };

  errors: {
    summary: string | null;
    timeline: string | null;
    threats: string | null;
    activities: string | null;
    alerts: string | null;
    health: string | null;
  };

  lastUpdated: {
    summary: number; // timestamp
    timeline: number;
    threats: number;
    activities: number;
    alerts: number;
    health: number;
  };

  // ─── ACTIONS ──────────────────────────────────────────────────────────────

  // Summary
  setSummary: (data: DashboardSummary) => void;
  setSummaryLoading: (loading: boolean) => void;
  setSummaryError: (error: string | null) => void;

  // Timeline
  setTimeline: (data: TimelineDataPoint[]) => void;
  appendTimeline: (data: TimelineDataPoint[]) => void; // Append instead of replace
  setTimelineLoading: (loading: boolean) => void;
  setTimelineError: (error: string | null) => void;

  // Threats
  setThreats: (data: ThreatDistribution) => void;
  setThreatsLoading: (loading: boolean) => void;
  setThreatsError: (error: string | null) => void;

  // Activities
  setActivities: (data: Activity[]) => void;
  setActivitiesLoading: (loading: boolean) => void;
  setActivitiesError: (error: string | null) => void;

  // Alerts
  setAlerts: (data: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  setAlertsLoading: (loading: boolean) => void;
  setAlertsError: (error: string | null) => void;

  // Health
  setHealth: (data: HealthStatus) => void;
  setHealthLoading: (loading: boolean) => void;
  setHealthError: (error: string | null) => void;

  // ─── SELECTORS (derived state) ─────────────────────────────────────────────

  getActiveThreatCount: () => number;
  getCriticalAlertCount: () => number;
  isAnythingLoading: () => boolean;
  getLastUpdateTime: () => Date | null;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // ─── INITIAL STATE ────────────────────────────────────────────────────────

  summary: null,
  timeline: [],
  threats: null,
  activities: [],
  alerts: [],
  health: null,

  loading: {
    summary: false,
    timeline: false,
    threats: false,
    activities: false,
    alerts: false,
    health: false,
  },

  errors: {
    summary: null,
    timeline: null,
    threats: null,
    activities: null,
    alerts: null,
    health: null,
  },

  lastUpdated: {
    summary: 0,
    timeline: 0,
    threats: 0,
    activities: 0,
    alerts: 0,
    health: 0,
  },

  // ─── ACTIONS: SUMMARY ─────────────────────────────────────────────────────

  setSummary: (data) =>
    set({
      summary: data,
      lastUpdated: { ...get().lastUpdated, summary: Date.now() },
      errors: { ...get().errors, summary: null },
      loading: { ...get().loading, summary: false },
    }),

  setSummaryLoading: (loading) =>
    set({
      loading: { ...get().loading, summary: loading },
    }),

  setSummaryError: (error) =>
    set({
      errors: { ...get().errors, summary: error },
      loading: { ...get().loading, summary: false },
    }),

  // ─── ACTIONS: TIMELINE ────────────────────────────────────────────────────

  setTimeline: (data) =>
    set({
      timeline: data,
      lastUpdated: { ...get().lastUpdated, timeline: Date.now() },
      errors: { ...get().errors, timeline: null },
      loading: { ...get().loading, timeline: false },
    }),

  appendTimeline: (data) => {
    const current = get().timeline;
    // Merge with existing data, keeping last 288 points (24h at 5-min intervals)
    const merged = [...current, ...data].slice(-288);
    
    set({
      timeline: merged,
      lastUpdated: { ...get().lastUpdated, timeline: Date.now() },
      errors: { ...get().errors, timeline: null },
      loading: { ...get().loading, timeline: false },
    });
  },

  setTimelineLoading: (loading) =>
    set({
      loading: { ...get().loading, timeline: loading },
    }),

  setTimelineError: (error) =>
    set({
      errors: { ...get().errors, timeline: error },
      loading: { ...get().loading, timeline: false },
    }),

  // ─── ACTIONS: THREATS ─────────────────────────────────────────────────────

  setThreats: (data) =>
    set({
      threats: data,
      lastUpdated: { ...get().lastUpdated, threats: Date.now() },
      errors: { ...get().errors, threats: null },
      loading: { ...get().loading, threats: false },
    }),

  setThreatsLoading: (loading) =>
    set({
      loading: { ...get().loading, threats: loading },
    }),

  setThreatsError: (error) =>
    set({
      errors: { ...get().errors, threats: error },
      loading: { ...get().loading, threats: false },
    }),

  // ─── ACTIONS: ACTIVITIES ──────────────────────────────────────────────────

  setActivities: (data) =>
    set({
      activities: data,
      lastUpdated: { ...get().lastUpdated, activities: Date.now() },
      errors: { ...get().errors, activities: null },
      loading: { ...get().loading, activities: false },
    }),

  setActivitiesLoading: (loading) =>
    set({
      loading: { ...get().loading, activities: loading },
    }),

  setActivitiesError: (error) =>
    set({
      errors: { ...get().errors, activities: error },
      loading: { ...get().loading, activities: false },
    }),

  // ─── ACTIONS: ALERTS ──────────────────────────────────────────────────────

  setAlerts: (data) =>
    set({
      alerts: data,
      lastUpdated: { ...get().lastUpdated, alerts: Date.now() },
      errors: { ...get().errors, alerts: null },
      loading: { ...get().loading, alerts: false },
    }),

  addAlert: (alert) =>
    set({
      alerts: [alert, ...get().alerts].slice(0, 50), // Keep top 50
      lastUpdated: { ...get().lastUpdated, alerts: Date.now() },
      loading: { ...get().loading, alerts: false },
    }),

  setAlertsLoading: (loading) =>
    set({
      loading: { ...get().loading, alerts: loading },
    }),

  setAlertsError: (error) =>
    set({
      errors: { ...get().errors, alerts: error },
      loading: { ...get().loading, alerts: false },
    }),

  // ─── ACTIONS: HEALTH ──────────────────────────────────────────────────────

  setHealth: (data) =>
    set({
      health: data,
      lastUpdated: { ...get().lastUpdated, health: Date.now() },
      errors: { ...get().errors, health: null },
      loading: { ...get().loading, health: false },
    }),

  setHealthLoading: (loading) =>
    set({
      loading: { ...get().loading, health: loading },
    }),

  setHealthError: (error) =>
    set({
      errors: { ...get().errors, health: error },
      loading: { ...get().loading, health: false },
    }),

  // ─── SELECTORS ────────────────────────────────────────────────────────────

  getActiveThreatCount: () => {
    const threats = get().threats;
    if (!threats) return 0;
    return threats.malware + threats.phishing + threats.suspicious;
  },

  getCriticalAlertCount: () => {
    return get().alerts.filter((a) => a.severity === "critical").length;
  },

  isAnythingLoading: () => {
    const l = get().loading;
    return l.summary || l.timeline || l.threats || l.activities || l.alerts || l.health;
  },

  getLastUpdateTime: () => {
    const times = Object.values(get().lastUpdated);
    const latest = Math.max(...times);
    return latest > 0 ? new Date(latest) : null;
  },
}));
