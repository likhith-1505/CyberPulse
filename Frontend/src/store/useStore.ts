
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Page =
  | "dashboard"
  | "pcap"
  | "fileScanner"
  | "urlAnalyzer"
  | "emailAnalyzer"
  | "settings";

export type Theme = "dark" | "light";
export type AccentColor = "purple" | "cyan" | "emerald" | "rose";

interface AppStore {
  currentPage: Page;
  theme: Theme;
  accentColor: AccentColor;
  sidebarCollapsed: boolean;
  virusTotalApiKey: string;
  notificationsEnabled: boolean;
  totalScans: number;
  threatsDetected: number;
  setPage: (page: Page) => void;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  toggleSidebar: () => void;
  setVirusTotalApiKey: (key: string) => void;
  setNotificationsEnabled: (v: boolean) => void;
  incrementScans: () => void;
  incrementThreats: () => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      currentPage: "dashboard",
      theme: "dark",
      accentColor: "purple",
      sidebarCollapsed: false,
      virusTotalApiKey: "",
      notificationsEnabled: true,
      totalScans: 1247,
      threatsDetected: 83,
      setPage: (page) => set({ currentPage: page }),
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setVirusTotalApiKey: (virusTotalApiKey) => set({ virusTotalApiKey }),
      setNotificationsEnabled: (notificationsEnabled) =>
        set({ notificationsEnabled }),
      incrementScans: () => set((s) => ({ totalScans: s.totalScans + 1 })),
      incrementThreats: () =>
        set((s) => ({ threatsDetected: s.threatsDetected + 1 })),
    }),
    { name: "cyberguard-store" }
  )
);