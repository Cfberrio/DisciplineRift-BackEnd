"use client"

export const dynamic = "force-dynamic"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/sidebar"
import { MarketingAutomations } from "@/components/marketing-automations"
import { MarketingMetrics } from "@/components/marketing-metrics"
import { MarketingTemplates } from "@/components/marketing-templates"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MarketingPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <Tabs defaultValue="automations" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="automations">Automatizaciones</TabsTrigger>
                  <TabsTrigger value="metrics">Métricas</TabsTrigger>
                  <TabsTrigger value="templates">Plantillas</TabsTrigger>
                </TabsList>

                <TabsContent value="automations" className="space-y-6">
                  <MarketingAutomations />
                </TabsContent>

                <TabsContent value="metrics" className="space-y-6">
                  <MarketingMetrics />
                </TabsContent>

                <TabsContent value="templates" className="space-y-6">
                  <MarketingTemplates />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
