import { NextResponse } from "next/server"
import type { ActivityData } from "@/lib/api/types"

// Sample activity data
const activityData: ActivityData = {
  items: [
    {
      id: "1",
      title: "Campaña de Email",
      description: '"Oferta Especial" - Enviado el 13 de Abril, 2025',
      timestamp: "2025-04-13",
      type: "email",
      data: {
        delivered: "1.4k",
        openRate: "55%",
        clickRate: "1%",
      },
    },
    {
      id: "2",
      title: "Actualización de rendimiento",
      description: "Han pasado 15 días desde el último email enviado",
      timestamp: "2025-04-14",
      type: "activity",
      data: {},
    },
  ],
}

export async function GET() {
  // Simulate a delay to show loading state
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json(activityData)
}
