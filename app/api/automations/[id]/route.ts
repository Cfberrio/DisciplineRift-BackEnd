import { NextResponse } from "next/server"

// Datos de ejemplo para las automatizaciones (mismos que en route.ts)
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

// GET /api/automations/[id] - Obtener una automatización específica
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const automation = automationData.find((a) => a.id === id)

  if (!automation) {
    return NextResponse.json({ error: "Automatización no encontrada" }, { status: 404 })
  }

  return NextResponse.json(automation)
}

// PUT /api/automations/[id] - Actualizar una automatización existente
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const automationIndex = automationData.findIndex((a) => a.id === id)

  if (automationIndex === -1) {
    return NextResponse.json({ error: "Automatización no encontrada" }, { status: 404 })
  }

  const data = await request.json()

  // En una aplicación real, aquí actualizaríamos la automatización en la base de datos
  const updatedAutomation = {
    ...automationData[automationIndex],
    ...data,
  }

  // Simulamos actualizar la automatización en la base de datos
  automationData[automationIndex] = updatedAutomation

  return NextResponse.json(updatedAutomation)
}

// DELETE /api/automations/[id] - Eliminar una automatización
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const automationIndex = automationData.findIndex((a) => a.id === id)

  if (automationIndex === -1) {
    return NextResponse.json({ error: "Automatización no encontrada" }, { status: 404 })
  }

  // En una aplicación real, aquí eliminaríamos la automatización de la base de datos
  automationData.splice(automationIndex, 1)

  return NextResponse.json({ success: true })
}
