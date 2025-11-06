import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ServicesProvider } from "@/contexts/services-context";
import { SchoolsProvider } from "@/contexts/schools-context";
import { StaffProvider } from "@/contexts/staff-context";
import { RefreshDetector } from "@/components/auth/refresh-detector";
import MetricsProvider from "@/components/metrics-provider";
import DevWDYR from "@/components/dev-wdyr";
import { Toaster } from "@/components/ui/toaster";
// import { ConnectionManager } from "@/components/connection-manager";

// Force dynamic rendering for the entire app
export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dashboard with Login",
  description: "Management system with authentication",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {process.env.NODE_ENV === 'development' ? <DevWDYR /> : null}
        <RefreshDetector />
        <MetricsProvider>
          <AuthProvider>
            <QueryProvider>
              <SchoolsProvider>
                <ServicesProvider>
                  <StaffProvider>
                    {/* <ConnectionManager /> */}
                    {children}
                    <Toaster />
                  </StaffProvider>
                </ServicesProvider>
              </SchoolsProvider>
            </QueryProvider>
          </AuthProvider>
        </MetricsProvider>
      </body>
    </html>
  );
}
