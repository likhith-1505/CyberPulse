import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useStore } from "./store/useStore";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./features/dashboard/Dashboard";
import { PcapAnalyzer } from "./features/pcap/PcapAnalyzer";
import { FileScanner } from "./features/fileScan/FileScanner";
import { UrlAnalyzer } from "./features/urlScan/UrlAnalyzer";
import { EmailAnalyzer } from "./features/emailAnalysis/EmailAnalyzer";
import { Settings } from "./features/settings/Settings";
import type { Page } from "./store/useStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const pageComponents: Record<Page, React.ComponentType> = {
  dashboard: Dashboard,
  pcap: PcapAnalyzer,
  fileScanner: FileScanner,
  urlAnalyzer: UrlAnalyzer,
  emailAnalyzer: EmailAnalyzer,
  settings: Settings,
};

function AppContent() {
  const { currentPage } = useStore();
  const PageComponent = pageComponents[currentPage];

  return (
    <Layout>
      <PageComponent />
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0f0f1a",
            color: "#e2e8f0",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: "8px",
          },
        }}
      />
    </QueryClientProvider>
  );
}