interface ParentAbsenceData {
  parentName: string
  studentName: string
  teamName: string
  sessionDate: string
  sessionTime: string
  sessionEndTime: string
}

/**
 * Generates HTML and text templates for parent absence notification emails
 */
export function generateParentAbsenceTemplate(data: ParentAbsenceData): { html: string; text: string } {
  const { parentName, studentName, teamName, sessionDate, sessionTime, sessionEndTime } = data

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Student Absence Notification</title>
  <style>
    body {
      font-family: "Segoe UI", Roboto, "Open Sans", sans-serif;
      background-color: transparent;
      margin: 0;
      padding: 0;
      color: #111111;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 10px;
      border: 1px solid #e0e0e0;
      overflow: hidden;
    }
    .header {
      background-color: #00bfff;
      color: #ffffff;
      text-align: center;
      padding: 24px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .content {
      padding: 30px;
      font-size: 16px;
      line-height: 1.6;
      color: #111111;
    }
    .info-box, .concern-box, .action-box {
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      background-color: #f5faff;
      border-left: 5px solid #00bfff;
    }
    .info-box h3, .concern-box h3, .action-box h3 {
      margin-top: 0;
      color: #00bfff;
      font-size: 18px;
    }
    .info-item {
      margin-bottom: 10px;
    }
    .info-item strong {
      display: inline-block;
      width: 120px;
    }
    .disclaimer {
      font-size: 13px;
      color: #555555;
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #999999;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Absence Notification</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${parentName}</strong>,</p>

      <p>We hope this message finds you well. We wanted to inform you that we noticed the absence of <strong>${studentName}</strong> from today’s scheduled session.</p>

      <div class="info-box">
        <h3>📋 Session Information</h3>
        <div class="info-item">
          <strong>👨‍🎓 Student:</strong>
          <span>${studentName}</span>
        </div>
        <div class="info-item">
          <strong>🏐 Team:</strong>
          <span>${teamName}</span>
        </div>
        <div class="info-item">
          <strong>📅 Date:</strong>
          <span>${sessionDate}</span>
        </div>
        <div class="info-item">
          <strong>⏰ Schedule:</strong>
          <span>${sessionTime} - ${sessionEndTime}</span>
        </div>
      </div>

      <div class="concern-box">
        <h3>🤔 Is Everything Alright?</h3>
        <p>We understand that unexpected situations happen. We just want to make sure everything is okay and offer our support if needed.</p>
      </div>

      <div class="action-box">
        <h3>📞 Please Let Us Know</h3>
        <p>If there’s any information you’d like to share regarding the absence, or if arrangements are needed for future sessions, feel free to reach out. We're here to help ensure <strong>${studentName}</strong>'s experience remains positive and consistent.</p>
      </div>

      <p>Thank you for your attention to this matter. We look forward to seeing <strong>${studentName}</strong> back on the court soon!</p>

      <p>Warm regards,<br>
      <strong>The Discipline Rift Team</strong></p>

      <div class="disclaimer">
        ⚙️ This is an automated message based on attendance records.<br>
        If you believe this was sent in error, please <a href="mailto:info@disciplinerift.com" style="color:#00bfff; text-decoration: underline;">let us know</a> so we can correct it.
      </div>
    </div>
    <div class="footer">
      DR Sports & Athletics • #DisciplineRift • #Fueled
    </div>
  </div>
</body>
</html>
`

  const text = `
    STUDENT ABSENCE NOTIFICATION - ${teamName}
    
    Dear ${parentName},
    
    We hope this message finds you well. We wanted to reach out to inform you that we noticed the absence of ${studentName} from today's scheduled session.
    
    📋 SESSION INFORMATION:
    👨‍🎓 Student: ${studentName}
    🏐 Team: ${teamName}
    📅 Date: ${sessionDate}
    ⏰ Schedule: ${sessionTime} - ${sessionEndTime}
    
    🤔 IS EVERYTHING ALRIGHT?
    We understand that sometimes circumstances arise that prevent attendance. We're reaching out to ensure everything is okay and to see if there's anything we should be aware of or if we can provide any assistance.
    
    📞 PLEASE LET US KNOW
    If there's anything we should know about the absence or if you need to make any arrangements for future sessions, please don't hesitate to contact us. We're here to support your child's participation in our program.
    
    Thank you for your attention to this matter, and we look forward to seeing ${studentName} at the next session.
    
    Best regards,
    Team Management
    
    ---
    The Discipline Rift Team
    This is an automatic notification message.
  `

  return { html, text }
}

/**
 * Generates the subject line for parent absence notification emails
 */
export function generateParentAbsenceSubject(studentName: string, teamName: string): string {
  return `Absence Notification - ${studentName} (${teamName})`
}
