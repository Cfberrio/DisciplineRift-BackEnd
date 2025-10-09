interface CoachReminderData {
  coachName: string
  teamName: string
  sessionDate: string
  sessionTime: string
  sessionEndTime: string
}

/**
 * Genera el template HTML para emails de recordatorio a coaches
 */
export function generateCoachReminderTemplate(data: CoachReminderData): { html: string; text: string } {
  const { coachName, teamName, sessionDate, sessionTime, sessionEndTime } = data

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DRVC - Attendance Reminder</title>
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
      overflow: hidden;
      border: 1px solid #e0e0e0;
    }
    .header {
      background-color: #00bfff;
      color: #ffffff;
      text-align: center;
      padding: 24px;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .content {
      padding: 30px;
      font-size: 16px;
      line-height: 1.6;
      color: #111111;
    }
    .highlight {
      color: #00bfff;
      font-weight: 600;
    }
    .button-wrapper {
      text-align: center;
      margin-top: 30px;
    }
    .button {
      display: inline-block;
      background-color: #00bfff;
      color: #ffffff;
      text-decoration: none;
      font-weight: 600;
      padding: 14px 28px;
      border-radius: 50px;
      font-size: 16px;
    }
    .automated {
      font-size: 13px;
      color: #555555;
      text-align: center;
      padding-top: 20px;
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
      <h1>ATTENDANCE NEEDED</h1>
    </div>
    <div class="content">
      <p>Hi ${coachName},</p>
      <p>This is a <span class="highlight">friendly reminder</span> that you haven’t submitted attendance for <strong>${teamName}</strong> today, <strong>${getCurrentDate()}</strong>.</p>

      <p>The scheduled session was from <strong>${sessionTime}</strong> to <strong>${sessionEndTime}</strong>.</p>

      <p>At DR Sports & Athletics, we lead by example. Staying on top of attendance ensures our teams stay <span class="highlight">#DRIVEN</span> and <span class="highlight">#FUELED</span>.</p>

      <div class="button-wrapper">
        <a href="https://dash-board-coaches-whpv.vercel.app/" class="button">Submit Attendance</a>
      </div>
    </div>
    <div class="automated">
      This is an automated message from Discipline Rift.<br>No action is required if this has already been completed.
    </div>
    <div class="footer">
      DR Sports & Athletics &bull; Fall Season 2025 &bull; #DisciplineRift
    </div>
  </div>
</body>
</html>

  `

  const text = `
    ATTENDANCE REMINDER - ${teamName}
    
    Hello ${coachName},
    
    We remind you that you have a session scheduled for today and the attendance of students has not yet been recorded.
    
    📋 SESSION DETAILS:
    🏐 Team: ${teamName}
    📅 Date: ${sessionDate}
    ⏰ Schedule: ${sessionTime} - ${sessionEndTime}
    
    ⚠️ ACTION REQUIRED:
    Please access the system and record the attendance of students for this session. This is important to maintain an accurate record of team participation.
    
    🎯 NEXT STEPS:
    1. Access the system dashboard
    2. Navigate to the attendance section
    3. Select the corresponding session
    4. Mark the attendance of each student
    
    If you have already recorded the attendance and received this message by error, you can ignore it.
    
    Thank you for keeping the attendance record updated!
    
    ---
    Team Management System
    This is an automatic system message.
  `

  return { html, text }
}

/**
 * Generates the subject line for coach reminder emails
 */
export function generateCoachReminderSubject(teamName: string): string {
  return `Reminder to complete attendance for ${teamName} group`
}

function getCurrentDate(): string {
  const today = new Date();
  return today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
