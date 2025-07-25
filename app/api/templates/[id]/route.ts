import { NextResponse } from "next/server"

// Datos de ejemplo para las plantillas (mismos que en route.ts)
const templateData = [
  {
    id: 1,
    name: "Bienvenida",
    description: "Email de bienvenida para nuevos usuarios",
    category: "Onboarding",
    lastModified: "12 Abr, 2025",
    content: "<p>Bienvenido a nuestra plataforma...</p>",
    thumbnail: "/templates/welcome.png",
    attachments: [],
  },
  {
    id: 2,
    name: "Confirmación de Compra",
    description: "Confirmación de compra con detalles del pedido",
    category: "Transaccional",
    lastModified: "10 Abr, 2025",
    content: "<p>Gracias por tu compra...</p>",
    thumbnail: "/templates/purchase.png",
    attachments: [
      {
        name: "factura.pdf",
        size: "245.32 KB",
        type: "application/pdf",
      },
    ],
  },
  {
    id: 3,
    name: "Promoción Mensual",
    description: "Promoción mensual con descuentos especiales",
    category: "Marketing",
    lastModified: "5 Abr, 2025",
    content: "<p>Descubre nuestras ofertas especiales...</p>",
    thumbnail: "/templates/promo.png",
    attachments: [
      {
        name: "catalogo.pdf",
        size: "1245.88 KB",
        type: "application/pdf",
      },
      {
        name: "descuentos.xlsx",
        size: "56.44 KB",
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  },
  {
    id: 4,
    name: "Recordatorio de Cita",
    description: "Recordatorio de cita programada",
    category: "Recordatorio",
    lastModified: "2 Abr, 2025",
    content: "<p>Te recordamos tu cita programada...</p>",
    thumbnail: "/templates/reminder.png",
    attachments: [],
  },
]

// GET /api/templates/[id] - Obtener una plantilla específica
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const template = templateData.find((t) => t.id === id)

  if (!template) {
    return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 })
  }

  return NextResponse.json(template)
}

// PUT /api/templates/[id] - Actualizar una plantilla existente
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const templateIndex = templateData.findIndex((t) => t.id === id)

  if (templateIndex === -1) {
    return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 })
  }

  const data = await request.json()

  // En una aplicación real, aquí actualizaríamos la plantilla en la base de datos
  const updatedTemplate = {
    ...templateData[templateIndex],
    ...data,
    lastModified: new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }

  // Simulamos actualizar la plantilla en la base de datos
  templateData[templateIndex] = updatedTemplate

  return NextResponse.json(updatedTemplate)
}

// DELETE /api/templates/[id] - Eliminar una plantilla
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const templateIndex = templateData.findIndex((t) => t.id === id)

  if (templateIndex === -1) {
    return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 })
  }

  // En una aplicación real, aquí eliminaríamos la plantilla de la base de datos
  templateData.splice(templateIndex, 1)

  return NextResponse.json({ success: true })
}
