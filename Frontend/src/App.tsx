import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./features/dashboard/Dashboard";
import { PcapAnalyzer } from "./features/pcap/PcapAnalyzer";
import { FileScanner } from "./features/fileScan/FileScanner";
import { UrlAnalyzer } from "./features/urlScan/UrlAnalyzer";
import { EmailAnalyzer } from "./features/emailAnalysis/EmailAnalyzer";
import { Settings } from "./features/settings/Settings";
import { useStore } from "./store/useStore";
import type { Page } from "./store/useStore";

console.log("App.tsx: Component loading");

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
  console.log("AppContent: Rendering");
  try {
    const store = useStore();
    console.log("AppContent: Got store, currentPage =", store.currentPage);
    const { currentPage } = store;
    const PageComponent = pageComponents[currentPage];
    console.log("AppContent: PageComponent =", PageComponent?.name || "unknown");

    return (
      <Layout>
        <PageComponent />
      </Layout>
    );
  } catch (error) {
    console.error("AppContent: Error during render:", error);
    return <div style={{ color: "red", padding: "20px" }}>AppContent Error: {String(error)}</div>;
  }
}

export default function App() {
  console.log("App: Render called");
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
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
  } catch (error) {
    console.error("App: Error during render:", error);
    return <div style={{ color: "red", padding: "20px" }}>App Error: {String(error)}</div>;
  }
}