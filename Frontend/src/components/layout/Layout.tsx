import React from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useStore } from "../../store/useStore";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { sidebarCollapsed, theme } = useStore();

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="flex h-screen bg-[#07071a] text-slate-100 overflow-hidden font-mono">
        {/* Animated background grid */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(139,92,246,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.8) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-900/15 rounded-full blur-3xl" />
        </div>

        <Sidebar />

        <div
          className="flex flex-col flex-1 overflow-hidden relative z-10 transition-all duration-300"
          style={{ marginLeft: sidebarCollapsed ? "64px" : "240px" }}
        >
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}