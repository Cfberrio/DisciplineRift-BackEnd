import { NextResponse } from "next/server"

// Datos de ejemplo para las métricas de campañas (mismos que en route.ts)
const campaignMetricsData = [
  {
    id: 1,
    name: "Bienvenida a Nuevos Usuarios",
    sent: 450,
    openRate: 68.5,
    clickRate: 24.2,
    conversionRate: 5.1,
    timeline: [
      { date: "1 Abr", sent: 15, opened: 10, clicked: 4 },
      { date: "2 Abr", sent: 12, opened: 8, clicked: 3 },
      { date: "3 Abr", sent: 18, opened: 12, clicked: 5 },
      { date: "4 Abr", sent: 20, opened: 14, clicked: 6 },
      { date: "5 Abr", sent: 25, opened: 18, clicked: 7 },
    ],
  },
  {
    id: 2,
    name: "Confirmación de Compra",
    sent: 780,
    openRate: 92.1,
    clickRate: 15.3,
    conversionRate: 8.7,
    timeline: [
      { date: "1 Abr", sent: 25, opened: 23, clicked: 4 },
      { date: "2 Abr", sent: 30, opened: 28, clicked: 5 },
      { date: "3 Abr", sent: 28, opened: 26, clicked: 4 },
      { date: "4 Abr", sent: 32, opened: 30, clicked: 6 },
      { date: "5 Abr", sent: 35, opened: 32, clicked: 5 },
    ],
  },
  {
    id: 3,
    name: "Recordatorio de Cita",
    sent: 320,
    openRate: 54.3,
    clickRate: 8.1,
    conversionRate: 2.5,
    timeline: [
      { date: "1 Abr", sent: 10, opened: 5, clicked: 1 },
      { date: "2 Abr", sent: 15, opened: 8, clicked: 1 },
      { date: "3 Abr", sent: 12, opened: 7, clicked: 1 },
      { date: "4 Abr", sent: 18, opened: 10, clicked: 2 },
      { date: "5 Abr", sent: 20, opened: 11, clicked: 1 },
    ],
  },
  {
    id: 4,
    name: "Promoción Mensual",
    sent: 993,
    openRate: 32.7,
    clickRate: 9.8,
    conversionRate: 1.2,
    timeline: [
      { date: "1 Abr", sent: 200, opened: 65, clicked: 20 },
      { date: "2 Abr", sent: 180, opened: 60, clicked: 18 },
      { date: "3 Abr", sent: 210, opened: 70, clicked: 21 },
      { date: "4 Abr", sent: 195, opened: 63, clicked: 19 },
      { date: "5 Abr", sent: 208, opened: 67, clicked: 20 },
    ],
  },
]

// GET /api/metrics/campaigns/[id] - Obtener métricas de una campaña específica
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const campaignMetrics = campaignMetricsData.find((c) => c.id === id)

  if (!campaignMetrics) {
    return NextResponse.json({ error: "Métricas de campaña no encontradas" }, { status: 404 })
  }

  return NextResponse.json(campaignMetrics)
}
