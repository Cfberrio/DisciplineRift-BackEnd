"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, Users, GraduationCap, UserCheck, Mail, FileText, Bell, Award, LogOut, ChevronLeft, ChevronRight, ClipboardList, Newspaper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Schedule", href: "/agenda", icon: Calendar },
  // { name: "Services", href: "/servicios", icon: Users }, // Hidden - replaced by Registrations
  { name: "Registrations", href: "/registrations", icon: ClipboardList },
  { name: "Schools", href: "/escuelas", icon: GraduationCap },
  { name: "Staff", href: "/staff", icon: UserCheck },
  { name: "Applications", href: "/applications", icon: FileText },
  { name: "Email Campaigns", href: "/marketing", icon: Mail },
  { name: "Newsletter", href: "/email-marketing", icon: Newspaper },
  { name: "Reminders", href: "/reminders", icon: Bell },
  { name: "Certificates", href: "/certificates", icon: Award },
]

export function Sidebar() {
  const pathname = usePathname()
  const { logout } = useAuth() || {}
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    if (logout) {
      await logout()
    }
  }

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>}
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="p-1">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn("w-full justify-start gap-3 text-gray-700 hover:bg-gray-50", collapsed && "justify-center")}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  )
}
