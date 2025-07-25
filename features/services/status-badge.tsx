import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string | boolean | null | undefined
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = () => {
    // Handle undefined, null, or empty status
    if (!status && status !== false) {
      return {
        label: "Desconocido",
        variant: "outline" as const,
        className: "bg-gray-100 text-gray-600",
      }
    }

    // Convert boolean to string if needed
    const statusString = typeof status === "boolean" ? (status ? "active" : "inactive") : String(status).toLowerCase()

    switch (statusString) {
      case "active":
      case "true":
        return {
          label: "Activo",
          variant: "default",
          className: "bg-green-500 hover:bg-green-600 text-white",
        }
      case "inactive":
      case "false":
        return {
          label: "Inactivo",
          variant: "outline" as const,
          className: "border-red-300 text-red-600",
        }
      case "pending":
        return {
          label: "Pendiente",
          variant: "default",
          className: "bg-amber-500 hover:bg-amber-600 text-white",
        }
      case "ended":
        return {
          label: "Finalizado",
          variant: "secondary",
          className: "",
        }
      default:
        return {
          label: statusString || "Desconocido",
          variant: "outline" as const,
          className: "bg-gray-100 text-gray-600",
        }
    }
  }

  const { label, variant, className: statusClassName } = getStatusConfig()

  return (
    <Badge variant={variant} className={cn(statusClassName, className)}>
      {label}
    </Badge>
  )
}
