"use client"

import type React from "react"

import Link from "next/link"
import { Home, CalendarDays, Layers, School, Users, Mail, Bell, LogOut, ClipboardList } from "lucide-react"
import { LogoutButton } from "@/components/auth/logout-button"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
}

const navItems: NavItemProps[] = [
  { href: "/", icon: <Home className="w-5 h-5" />, label: "Home" },
  { href: "/agenda", icon: <CalendarDays className="w-5 h-5" />, label: "Schedule" },
  { href: "/calendario", icon: <Layers className="w-5 h-5" />, label: "Calendar" },
  { href: "/servicios", icon: <Layers className="w-5 h-5" />, label: "Services" },
  { href: "/registrations", icon: <ClipboardList className="w-5 h-5" />, label: "Registrations" },
  { href: "/escuelas", icon: <School className="w-5 h-5" />, label: "Schools" },
  { href: "/staff", icon: <Users className="w-5 h-5" />, label: "Staff" },
  { href: "/marketing", icon: <Mail className="w-5 h-5" />, label: "Email Campaigns" },
  { href: "/reminders", icon: <Bell className="w-5 h-5" />, label: "Reminders" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-60 h-screen border-r bg-white">
      <div className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100",
              pathname === href && "bg-gray-100 text-black font-semibold",
            )}
          >
            {icon}
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* single logout button at the very bottom */}
      <div className="p-4 border-t">
        <LogoutButton className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100">
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </LogoutButton>
      </div>
    </aside>
  )
}
