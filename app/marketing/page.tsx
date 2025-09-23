"use client"

export const dynamic = "force-dynamic"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/sidebar"
import { EmailCampaign } from "@/components/marketing/email-campaign"

export default function EmailCampaignsPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Email Campaigns</h1>
                <p className="text-gray-600 mt-2">
                  Send personalized emails to team parents with custom templates
                </p>
              </div>
              <EmailCampaign />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
