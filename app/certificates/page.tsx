"use client"

import { Sidebar } from "@/components/sidebar"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Award } from "lucide-react"
import { CertificatesManager } from "@/components/certificates/certificates-manager"

export default function CertificatesPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Award className="h-8 w-8" />
                    Certificates
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Generate certificates for students by sport
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Certificate Generation</CardTitle>
                  <CardDescription>
                    Select a sport to view eligible students and generate their certificates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CertificatesManager />
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

