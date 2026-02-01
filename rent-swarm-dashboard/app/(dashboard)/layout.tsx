import React from "react"
import { Sidebar } from "@/components/sidebar";
import { ScoutProvider } from "@/app/context/scout-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-0 md:ml-64 min-h-screen transition-all duration-300">
        <ScoutProvider>
          {children}
        </ScoutProvider>
      </main>
    </div>
  );
}
