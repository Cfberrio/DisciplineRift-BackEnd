import { NextResponse } from "next/server"

// Datos de ejemplo para las automatizaciones
const automationData = [
  {
    id: 1,
    name: "Bienvenida a Nuevos Usuarios",
    description: "Envía un email de bienvenida cuando un usuario se registra",
    trigger: "Registro de usuarios",
    schedule: "Inmediato",
    template: "Bienvenida",
    templateId: 1,
    status: "active",
    lastRun: "12 Abr, 2025",
  },
  {
    id: 2,
    name: "Confirmación de Compra",
    description: "Envía un email de confirmación después de una compra",
    trigger: "Compra",
    schedule: "Inmediato",
    template: "Confirmación de Compra",
    templateId: 2,
    status: "active",
    lastRun: "10 Abr, 2025",
  },
  {
    id: 3,
    name: "Recordatorio de Cita",
    description: "Envía un recordatorio 24h antes de una cita programada",
    trigger: "Recordatorio",
    schedule: "24h antes",
    template: "Recordatorio de Cita",
    templateId: 4,
    status: "active",
    lastRun: "5 Abr, 2025",
  },
  {
    id: 4,
    name: "Promoción Mensual",
    description: "Envía una promoción mensual a todos los usuarios",
    trigger: "Promociones y marketing",
    schedule: "Recurrente (Mensual)",
    template: "Promoción Mensual",
    templateId: 3,
    status: "inactive",
    lastRun: "1 Abr, 2025",
  },
]

// GET /api/automations - Obtener todas las automatizaciones
export async function GET() {
  return NextResponse.json(automationData)
}

// POST /api/automations - Crear una nueva automatización
export async function POST(request: Request) {
  const data = await request.json()

  // En una aplicación real, aquí guardaríamos la automatización en la base de datos
  const newAutomation = {
    id: automationData.length + 1,
    ...data,
    lastRun: "Nunca",
  }

  // Simulamos añadir la automatización a la base de datos
  automationData.push(newAutomation)

  return NextResponse.json(newAutomation, { status: 201 })
}
