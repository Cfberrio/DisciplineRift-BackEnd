import { NextResponse } from "next/server"

// Datos de ejemplo para las plantillas
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

// GET /api/templates - Obtener todas las plantillas
export async function GET() {
  return NextResponse.json(templateData)
}

// POST /api/templates - Crear una nueva plantilla
export async function POST(request: Request) {
  const data = await request.json()

  // En una aplicación real, aquí guardaríamos la plantilla en la base de datos
  const newTemplate = {
    id: templateData.length + 1,
    ...data,
    lastModified: new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }

  // Simulamos añadir la plantilla a la base de datos
  templateData.push(newTemplate)

  return NextResponse.json(newTemplate, { status: 201 })
}
