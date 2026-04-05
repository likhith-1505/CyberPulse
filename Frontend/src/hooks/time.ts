/**
 * Safe timestamp and time formatting utilities
 *
 * Handles multiple timestamp formats and prevents negative/invalid values:
 * - ISO 8601 strings: "2024-01-15T10:30:45.123Z"
 * - UNIX milliseconds: 1705328445123 (13 digits)
 * - UNIX seconds: 1705328445 (10 digits)
 * - Date objects
 *
 * Key guarantees:
 * - Never returns negative time values
 * - Handles server/client time drift gracefully
 * - Falls back to "just now" for future timestamps
 * - All inputs validated before processing
 */

/**
 * Convert any timestamp format to milliseconds since epoch
 * Handles ISO strings, UNIX seconds/ms, and Date objects
 *
 * @param timestamp - ISO string, UNIX timestamp, or Date object
 * @returns Milliseconds since epoch, or null if invalid
 */
export const timestampToMs = (
  timestamp: string | number | Date | null | undefined
): number | null => {
  if (!timestamp) return null;

  // If it's already a Date object
  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }

  // If it's a string, try parsing as ISO or number
  if (typeof timestamp === "string") {
    // Try parsing as ISO 8601 first
    const isoDate = new Date(timestamp);
    if (!isNaN(isoDate.getTime())) {
      return isoDate.getTime();
    }

    // Try parsing as numeric string
    const num = parseFloat(timestamp);
    if (!isNaN(num)) {
      return normalizeMsValue(num);
    }

    return null;
  }

  // If it's a number, normalize it
  if (typeof timestamp === "number") {
    return normalizeMsValue(timestamp);
  }

  return null;
};

/**
 * Normalize a numeric timestamp to milliseconds
 * Detects if it's UNIX seconds (10 digits) or milliseconds (13 digits)
 */
const normalizeMsValue = (value: number): number => {
  // UNIX seconds are ~10 digits, milliseconds are ~13 digits
  // Year 2000 timestamp: ~946684800 seconds or ~946684800000 ms
  // Year 2500 timestamp: ~16725225600 seconds or ~16725225600000 ms
  // Safe threshold: if < 1000000000000 (1 billion * 1000), likely seconds

  if (value < 100000000000) {
    // Likely UNIX seconds, convert to milliseconds
    return value * 1000;
  }

  return value;
};

/**
 * Safely format a timestamp as relative time (e.g., "2 minutes ago")
 * Never returns negative values, handles future timestamps gracefully
 *
 * @param timestamp - ISO string, UNIX timestamp, or Date object
 * @returns Human-readable relative time string
 */
export const safeTimeAgo = (
  timestamp: string | number | Date | null | undefined
): string => {
  const ms = timestampToMs(timestamp);

  if (ms === null) {
    return "unknown time";
  }

  const now = Date.now();
  let secondsAgo = Math.floor((now - ms) / 1000);

  // Safety: if time is in the future or very recent, show "just now"
  if (secondsAgo < 0) {
    return "just now";
  }

  if (secondsAgo < 1) {
    return "just now";
  }

  if (secondsAgo < 60) {
    return `${secondsAgo}s ago`;
  }

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) {
    return `${minutesAgo}m ago`;
  }

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) {
    return `${hoursAgo}h ago`;
  }

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 30) {
    return `${daysAgo}d ago`;
  }

  const monthsAgo = Math.floor(daysAgo / 30);
  if (monthsAgo < 12) {
    return `${monthsAgo}mo ago`;
  }

  const yearsAgo = Math.floor(monthsAgo / 12);
  return `${yearsAgo}y ago`;
};

/**
 * Get signed time difference (can be negative for future times)
 * Useful for debugging and monitoring time drift
 *
 * @param timestamp - ISO string, UNIX timestamp, or Date object
 * @returns Milliseconds difference (negative if timestamp is in future)
 */
export const getTimeDiff = (
  timestamp: string | number | Date | null | undefined
): number | null => {
  const ms = timestampToMs(timestamp);
  if (ms === null) return null;
  return Date.now() - ms;
};

/**
 * Check if a timestamp is in the future
 * @param timestamp - ISO string, UNIX timestamp, or Date object
 * @returns true if timestamp is after current time
 */
export const isInFuture = (
  timestamp: string | number | Date | null | undefined
): boolean => {
  const diff = getTimeDiff(timestamp);
  return diff !== null && diff < 0;
};

/**
 * Get current time as ISO string (consistent reference)
 * @returns ISO 8601 string
 */
export const getCurrentTimeISO = (): string => {
  return new Date().toISOString();
};

/**
 * Format a timestamp as a full date/time string
 * Example: "Jan 15, 2024 10:30:45 AM"
 *
 * @param timestamp - ISO string, UNIX timestamp, or Date object
 * @param format - "short" (Jan 15), "medium" (Jan 15, 2024), "long" (full datetime)
 * @returns Formatted string
 */
export const formatFullDateTime = (
  timestamp: string | number | Date | null | undefined,
  format: "short" | "medium" | "long" = "long"
): string => {
  const ms = timestampToMs(timestamp);

  if (ms === null) {
    return "unknown";
  }

  const date = new Date(ms);

  if (format === "short") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  if (format === "medium") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // long format
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

/**
 * Get duration between two timestamps in human-readable format
 * Example: "2h 30m" or "45s"
 *
 * @param startTime - Earlier timestamp
 * @param endTime - Later timestamp (defaults to now)
 * @returns Duration string
 */
export const formatDuration = (
  startTime: string | number | Date | null | undefined,
  endTime?: string | number | Date | null | undefined
): string => {
  const startMs = timestampToMs(startTime);
  const endMs = timestampToMs(endTime) || Date.now();

  if (startMs === null) {
    return "unknown duration";
  }

  let durationMs = endMs - startMs;

  // Handle negative duration
  if (durationMs < 0) {
    durationMs = 0;
  }

  const seconds = Math.floor((durationMs / 1000) % 60);
  const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
  const hours = Math.floor((durationMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
};
