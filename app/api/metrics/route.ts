import { NextResponse } from "next/server"

// Datos de ejemplo para las métricas
const metricsData = {
  summary: {
    sent: 2543,
    openRate: 42.8,
    clickRate: 12.4,
    conversionRate: 3.2,
    growth: {
      sent: 12,
      openRate: 3.2,
      clickRate: -1.5,
      conversionRate: 0.8,
    },
  },
  campaigns: [
    {
      id: 1,
      name: "Bienvenida a Nuevos Usuarios",
      sent: 450,
      openRate: 68.5,
      clickRate: 24.2,
      conversionRate: 5.1,
    },
    {
      id: 2,
      name: "Confirmación de Compra",
      sent: 780,
      openRate: 92.1,
      clickRate: 15.3,
      conversionRate: 8.7,
    },
    {
      id: 3,
      name: "Recordatorio de Cita",
      sent: 320,
      openRate: 54.3,
      clickRate: 8.1,
      conversionRate: 2.5,
    },
    {
      id: 4,
      name: "Promoción Mensual",
      sent: 993,
      openRate: 32.7,
      clickRate: 9.8,
      conversionRate: 1.2,
    },
  ],
  deliveryStatus: {
    delivered: 2345,
    pending: 198,
    bounced: 42,
  },
  recentSends: [
    {
      id: 1,
      name: "Promoción Mensual",
      date: "12 Abr, 2025 - 10:30 AM",
    },
    {
      id: 2,
      name: "Recordatorio de Cita",
      date: "10 Abr, 2025 - 09:15 AM",
    },
    {
      id: 3,
      name: "Confirmación de Compra",
      date: "8 Abr, 2025 - 03:45 PM",
    },
    {
      id: 4,
      name: "Bienvenida a Nuevos Usuarios",
      date: "5 Abr, 2025 - 11:20 AM",
    },
  ],
}

// GET /api/metrics - Obtener todas las métricas
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") || "30days"

  // En una aplicación real, aquí filtraríamos las métricas según el período
  // Por ahora, simplemente devolvemos todos los datos

  return NextResponse.json(metricsData)
}
