import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { RosterData } from "@/hooks/use-roster"

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
      student.dob || "N/A",
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
    "DOB",
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
      2: { cellWidth: 25, halign: "center" }, // DOB
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

  // Add schedule if sessions exist
  if (roster.sessions && roster.sessions.length > 0) {
    const session = roster.sessions[0]
    doc.text(
      `Schedule: ${session.daysofweek} ${session.starttime} - ${session.endtime}`,
      20,
      finalY + 35
    )
  }

  // Generate filename - EXACT FORMAT FROM SERVICES
  const fileName = `roster_${
    roster.team.name?.replace(/\s+/g, "_") || "team"
  }_${new Date().toISOString().split("T")[0]}.pdf`

  // Save the PDF
  doc.save(fileName)
}


