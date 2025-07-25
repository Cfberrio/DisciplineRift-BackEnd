import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-provider"
import { ServicesProvider } from "@/contexts/services-context"
import { SchoolsProvider } from "@/contexts/schools-context"
import { StaffProvider } from "@/contexts/staff-context"
import { Toaster } from "@/components/ui/toaster"

// Force dynamic rendering for the entire app
export const dynamic = "force-dynamic"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dashboard con Login",
  description: "Sistema de gestión con autenticación",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <SchoolsProvider>
            <ServicesProvider>
              <StaffProvider>
                {children}
                <Toaster />
              </StaffProvider>
            </ServicesProvider>
          </SchoolsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
