"use client";

export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/sidebar";
import { ServicesTable } from "@/features/services/services-table";
import { ServicesProvider } from "@/contexts/services-context";
import { ProtectedRoute } from "@/components/auth/protected-route";

function ServicesPageContent() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          <ServicesTable />
        </main>
      </div>
    </div>
  );
}

export default function ServiciosPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <ServicesProvider>
        <ServicesPageContent />
      </ServicesProvider>
    </ProtectedRoute>
  );
}
