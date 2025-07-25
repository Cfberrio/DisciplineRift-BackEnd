import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

interface NavItemProps {
  href: string
  icon: LucideIcon
  label: string
  isActive?: boolean
}

export function NavItem({ href, icon: Icon, label, isActive = false }: NavItemProps) {
  return (
    <Button variant={isActive ? "default" : "ghost"} className="w-full justify-start gap-3" asChild>
      <Link href={href}>
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  )
}
