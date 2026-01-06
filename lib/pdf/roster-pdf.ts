import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { RosterData } from "@/hooks/use-roster"
import { DateTime } from "luxon"
import { expandOccurrences } from "@/utils/schedule"

function formatOccurrence(occurrence: { start: Date; end: Date }): string {
  const startDateTime = DateTime.fromJSDate(occurrence.start, { zone: "America/New_York" })
  const endDateTime = DateTime.fromJSDate(occurrence.end, { zone: "America/New_York" })
  
  // Formato: "Tuesday, Jan 21, 6:00 PM – 7:00 PM"
  const formattedDate = startDateTime.toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY, { locale: "en-US" })
  const timeRange = `${startDateTime.toLocaleString(DateTime.TIME_SIMPLE, { locale: "en-US" })} – ${endDateTime.toLocaleString(DateTime.TIME_SIMPLE, { locale: "en-US" })}`
  
  // Extraer solo la parte de fecha (sin "at time")
  return `${formattedDate.split(" at ")[0]}, ${timeRange}`
}

function formatTime(time: string) {
  try {
    const [hours, minutes] = time.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  } catch {
    return time
  }
}

export async function generateRosterPDF(roster: RosterData) {
  console.log("Generating PDF with roster data:", roster)
  console.log("Sample student data:", roster.enrollments[0])

  const doc = new jsPDF("landscape", "mm", "a4")

  // Add logo/header - EXACT REPLICA FROM SERVICES
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("DISCIPLINE RIFT", 20, 25)

  // Service/Season title
  doc.setFontSize(16)
  doc.text(`${roster.team.name || "Team Roster"}`, 20, 35)
  doc.text(`${roster.team.school.name || "School"} Roster`, 20, 45)

  // Prepare table data - EXACT 9 COLUMNS FROM SERVICES
  const tableData = roster.enrollments.map((enrollment) => {
    const student = enrollment.student
    
    const row = [
      student.firstname || "N/A",
      student.lastname || "N/A",
      student.level || "N/A",
      student.grade || "N/A",
      student.studentdismisall || student.StudentDismisall || "N/A",
      student.teacher || "N/A",
      student.ecname || "N/A",
      student.ecphone || "N/A",
      student.medcondition || "N/A",
    ]

    console.log("PDF row data:", {
      name: `${student.firstname} ${student.lastname}`,
      StudentDismisall: student.studentdismisall || student.StudentDismisall,
      teacher: student.teacher,
      medcondition: student.medcondition,
    })

    return row
  })

  // Table headers - EXACT FROM SERVICES
  const headers = [
    "First Name",
    "Last Name",
    "Level",
    "Grade",
    "Dismissal",
    "Teacher",
    "Emergency",
    "Emergency #",
    "Medcondition",
  ]

  // Create table using autoTable - EXACT STYLES FROM SERVICES
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 55,
    theme: "striped", // EXACT: striped not grid
    headStyles: {
      fillColor: [41, 128, 185], // EXACT: Blue color from services
      textColor: 255,
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // EXACT: Light gray for alternate rows
    },
    columnStyles: {
      0: { cellWidth: 30 }, // First Name
      1: { cellWidth: 30 }, // Last Name
      2: { cellWidth: 20, halign: "center" }, // Level
      3: { cellWidth: 15, halign: "center" }, // Grade
      4: { cellWidth: 25 }, // Dismissal
      5: { cellWidth: 25 }, // Teacher
      6: { cellWidth: 30 }, // Emergency
      7: { cellWidth: 30 }, // Emergency #
      8: { cellWidth: 30 }, // Medcondition
    },
    margin: { left: 20, right: 20 },
    tableWidth: "auto",
  })

  // Add footer with additional info - EXACT FROM SERVICES
  const finalY = (doc as any).lastAutoTable.finalY || 150
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(
    `Total Participants: ${roster.enrollments.length}`,
    20,
    finalY + 15
  )
  doc.text(
    `Generated on: ${new Date().toLocaleDateString("en-US")}`,
    20,
    finalY + 25
  )

  // Add detailed schedule with specific dates for each session
  if (roster.sessions && roster.sessions.length > 0) {
    let yPosition = finalY + 35
    
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Session Schedule:", 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    
    roster.sessions.forEach((session, sessionIndex) => {
      // Expandir todas las ocurrencias de esta sesión
      const occurrences = expandOccurrences({
        startdate: session.startdate || new Date().toISOString().split("T")[0],
        enddate: session.enddate,
        starttime: session.starttime,
        endtime: session.endtime,
        daysofweek: session.daysofweek,
        cancel: null, // El roster no maneja cancelaciones
      })
      
      // Si hay múltiples sesiones, agregar un subtítulo
      if (roster.sessions.length > 1) {
        doc.setFont("helvetica", "bold")
        doc.text(
          `Session ${sessionIndex + 1}: ${session.daysofweek} (${occurrences.length} dates)`,
          25,
          yPosition
        )
        yPosition += 7
        doc.setFont("helvetica", "normal")
      }
      
      // Mostrar cada ocurrencia
      occurrences.forEach((occurrence) => {
        const formattedOccurrence = formatOccurrence(occurrence)
        
        // Verificar si necesitamos una nueva página
        if (yPosition > 180) { // Límite antes del final de la página en landscape
          doc.addPage()
          yPosition = 20
          doc.setFontSize(12)
          doc.setFont("helvetica", "bold")
          doc.text("Session Schedule (continued):", 20, yPosition)
          yPosition += 10
          doc.setFontSize(9)
          doc.setFont("helvetica", "normal")
        }
        
        doc.text(`• ${formattedOccurrence}`, 25, yPosition)
        yPosition += 5
      })
      
      // Espacio entre sesiones diferentes
      if (sessionIndex < roster.sessions.length - 1) {
        yPosition += 5
      }
    })
  }

  // Generate filename - EXACT FORMAT FROM SERVICES
  const fileName = `roster_${
    roster.team.name?.replace(/\s+/g, "_") || "team"
  }_${new Date().toISOString().split("T")[0]}.pdf`

  // Save the PDF
  doc.save(fileName)
}


