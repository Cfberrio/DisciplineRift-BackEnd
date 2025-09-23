import nodemailer from 'nodemailer'
import { buildPracticeOccurrences, formatTimeES, type PracticeOccurrence } from './schedule/buildPracticeOccurrences'

// Local interface for email service session data
interface EmailSessionData {
  startdate: string;
  enddate: string;
  starttime: string;
  endtime: string;
  daysofweek: string;
  cancel?: string;
  staff?: {
    name: string;
    email: string;
    phone: string;
  };
}

// Configurar el transportador de Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

// Tipos para los datos del email
interface StudentData {
  firstName: string
  lastName: string
  grade: string
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
}

interface TeamData {
  teamid: string
  name: string
  description: string
  price: number
  created_at: string
  updated_at: string
  timezone?: string
  school: {
    name: string
    location: string
  }
  session?: EmailSessionData[]
  practiceOccurrences?: Array<PracticeOccurrence & {
    timeFormatted: string
  }>
}

interface PaymentData {
  amount: number
  date: string
  sessionId: string
}

interface ParentData {
  firstName: string
  lastName: string
  email: string
}

// HTML Template for payment confirmation email
const createEmailTemplate = (
  studentData: StudentData,
  teamData: TeamData,
  paymentData: PaymentData,
  parentData: ParentData
) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registration Confirmation - Discipline Rift</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8fafc;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .header {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .header p {
          font-size: 16px;
          opacity: 0.9;
        }
        
        .success-icon {
          width: 80px;
          height: 80px;
          background-color: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 40px;
        }
        
        .content {
          padding: 40px 30px;
        }
        
        .section {
          margin-bottom: 30px;
          padding: 25px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
          background-color: #f8fafc;
        }
        
        .section h3 {
          color: #1e40af;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
        }
        
        .section-icon {
          margin-right: 10px;
          font-size: 20px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 15px;
        }
        
        .info-item {
          padding: 12px;
          background-color: white;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        
        .info-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        
        .info-value {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
        }
        
        .amount-highlight {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        }
        
        .amount-highlight .amount {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        

        
        .footer {
          background-color: #1f2937;
          color: #9ca3af;
          padding: 30px;
          text-align: center;
        }
        
        .footer h4 {
          color: white;
          margin-bottom: 15px;
        }
        
        .contact-info {
          margin: 20px 0;
        }
        
        .contact-info p {
          margin: 5px 0;
        }
        
        @media (max-width: 600px) {
          .container {
            margin: 10px;
            border-radius: 8px;
          }
          
          .header, .content, .footer {
            padding: 20px;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
          }
          
          .amount-highlight .amount {
            font-size: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="success-icon">✅</div>
          <h1>Registration Successful!</h1>
          <p>Your payment has been processed successfully</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <!-- Payment Confirmation -->
          <div class="amount-highlight">
            <div class="amount">${formatCurrency(paymentData.amount)}</div>
            <div>Payment confirmed on ${formatDate(paymentData.date)}</div>
          </div>
          
          <!-- Student Information -->
          <div class="section">
            <h3><span class="section-icon">👨‍🎓</span>Student Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Full Name</div>
                <div class="info-value">${studentData.firstName} ${studentData.lastName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Grade</div>
                <div class="info-value">${studentData.grade}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Emergency Contact</div>
                <div class="info-value">${studentData.emergencyContact.name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Emergency Phone</div>
                <div class="info-value">${studentData.emergencyContact.phone}</div>
              </div>
            </div>
          </div>
          
          <!-- Team Information -->
          <div class="section">
            <h3><span class="section-icon">🏐</span>Team Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Team Name</div>
                <div class="info-value">${teamData.name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">School</div>
                <div class="info-value">${teamData.school.name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Location</div>
                <div class="info-value">${teamData.school.location}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Price</div>
                <div class="info-value">${formatCurrency(teamData.price)}</div>
              </div>
            </div>
            
            ${teamData.description ? `
              <div style="margin-top: 15px; padding: 15px; background-color: white; border-radius: 6px; border: 1px solid #e5e7eb;">
                <div class="info-label">Description</div>
                <div class="info-value">${teamData.description}</div>
              </div>
            ` : ''}
          </div>
          
          <!-- Practice Schedule - Individual Sessions -->
          ${teamData.practiceOccurrences && teamData.practiceOccurrences.length > 0 ? `
            <div class="section">
              <h3><span class="section-icon">📅</span>Practice Schedule</h3>
              <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <ul style="list-style: none; padding: 0; margin: 0;">
                  ${teamData.practiceOccurrences?.map((occurrence, index) => `
                    <li style="padding: 12px 0; border-bottom: ${index < (teamData.practiceOccurrences?.length || 0) - 1 ? '1px solid #f3f4f6' : 'none'}; display: flex; justify-content: space-between; align-items: center;">
                      <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1e40af; font-size: 14px; margin-bottom: 2px;">
                          ${occurrence.formattedDateES}
                        </div>
                        <div style="color: #6b7280; font-size: 13px;">
                          ${occurrence.timeFormatted}
                        </div>
                      </div>
                      <div style="text-align: right; color: #9ca3af; font-size: 12px;">
                        ${occurrence.location}
                      </div>
                    </li>
                  `).join('')}
                </ul>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #6b7280; text-align: center;">
                  <strong>Coach:</strong> ${teamData.practiceOccurrences[0]?.coachName || 'TBD'} | 
                  <strong>Location:</strong> ${teamData.practiceOccurrences[0]?.location || 'TBD'}
                  <br>
                  <span style="opacity: 0.8;">Schedule shown in Miami timezone (EST/EDT)</span>
                </div>
              </div>
            </div>
          ` : ''}
          
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <h4>Discipline Rift</h4>
          <div class="contact-info">
            <p>📧 Support: info@disciplinerift.com</p>
            <p>📞 Phone: (407) 6147454</p>
            <p>🌐 Web: www.disciplinerift.com</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #374151;">
            <p style="font-size: 12px;">
              This is an automated email. If you have any questions, please don't hesitate to contact us.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Función principal para enviar el correo de confirmación
export async function sendPaymentConfirmationEmail(
  parentEmail: string,
  studentData: StudentData,
  teamData: TeamData,
  paymentData: PaymentData,
  parentData: ParentData
) {
  try {
    // Verificar que las credenciales de Gmail estén configuradas
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Gmail credentials not configured')
    }

    const transporter = createTransporter()

    // Calculate individual practice occurrences
    let enhancedTeamData = { ...teamData };
    
    if (teamData.session && teamData.session.length > 0) {
      const session = teamData.session[0]; // Assuming single session per team
      
      // Parse days of week
      let daysOfWeek: string[] = [];
      try {
        if (typeof session.daysofweek === "string") {
          const rawValue = session.daysofweek.trim();
          if (rawValue.includes(",")) {
            daysOfWeek = rawValue.split(",").map((day: string) => day.trim());
          } else {
            daysOfWeek = [rawValue];
          }
        }
      } catch (error) {
        console.warn("Error parsing days of week:", error);
        daysOfWeek = ["Monday", "Wednesday", "Friday"];
      }

      // Parse canceled dates from the cancel field
      let canceledDates: string[] = [];
      try {
        if (session.cancel && typeof session.cancel === 'string' && session.cancel.trim()) {
          // Handle different formats: JSON array, comma-separated, or single date
          const cancelString = session.cancel.trim();
          if (cancelString.startsWith('[') && cancelString.endsWith(']')) {
            // JSON array format: ["2024-01-15", "2024-01-22"]
            canceledDates = JSON.parse(cancelString);
          } else if (cancelString.includes(',')) {
            // Comma-separated format: "2024-01-15,2024-01-22"
            canceledDates = cancelString.split(',').map((date: string) => date.trim()).filter((date: string) => date.length > 0);
          } else {
            // Single date format: "2024-01-15"
            canceledDates = [cancelString];
          }
          console.log(`[EMAIL] ✅ Found ${canceledDates.length} canceled dates for email generation:`, canceledDates);
        }
      } catch (parseError) {
        console.warn(`[EMAIL] ⚠️ Error parsing canceled dates for email:`, parseError);
        canceledDates = [];
      }

      // Calculate practice occurrences
      // Ensure times are in HH:MM format (remove seconds if present)
      const cleanStartTime = session.starttime?.includes(':') 
        ? session.starttime.substring(0, 5) 
        : session.starttime;
      const cleanEndTime = session.endtime?.includes(':') 
        ? session.endtime.substring(0, 5) 
        : session.endtime;

      const practiceOccurrences = buildPracticeOccurrences({
        startDate: session.startdate,
        endDate: session.enddate,
        daysOfWeek,
        startTime: cleanStartTime,
        endTime: cleanEndTime,
        location: teamData.school.location,
        coachName: session.staff?.name || 'TBD',
        timezone: teamData.timezone || 'America/New_York',
        canceledDates: canceledDates
      });

      // Format times in Spanish and add to team data
      enhancedTeamData.practiceOccurrences = practiceOccurrences.map(occurrence => ({
        ...occurrence,
        timeFormatted: formatTimeES(occurrence.time)
      }));
    }

    // Generar el HTML del correo
    const htmlContent = createEmailTemplate(studentData, enhancedTeamData, paymentData, parentData)

    // Configurar el correo
    const mailOptions = {
      from: {
        name: 'Discipline Rift',
        address: process.env.GMAIL_USER!,
      },
      to: parentEmail,
      subject: `✅ Registration Confirmation - ${studentData.firstName} ${studentData.lastName}`,
      html: htmlContent,
    }

    // Enviar el correo
    const result = await transporter.sendMail(mailOptions)
    
    console.log('✅ Email sent successfully:', result.messageId)
    return { success: true, messageId: result.messageId }
    
  } catch (error) {
    console.error('❌ Error sending email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Función para verificar la configuración del email
export async function verifyEmailConfiguration() {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return { configured: false, message: 'Gmail credentials not configured' }
    }

    const transporter = createTransporter()
    await transporter.verify()
    
    return { configured: true, message: 'Email configuration is valid' }
  } catch (error) {
    return { 
      configured: false, 
      message: error instanceof Error ? error.message : 'Unknown configuration error' 
    }
  }
} 

// Template HTML para notificación de pago a la empresa
const createCompanyNotificationTemplate = (
  studentData: StudentData,
  teamData: TeamData,
  paymentData: PaymentData,
  parentData: ParentData
) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Payment Received - Discipline Rift</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8fafc;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          color: white;
          padding: 20px;
          text-align: center;
        }
        .content {
          padding: 20px;
        }
        .amount-highlight {
          background: #f0fdf4;
          border: 2px solid #10b981;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .amount {
          font-size: 36px;
          font-weight: bold;
          color: #059669;
          margin-bottom: 10px;
        }
        .info-section {
          margin: 20px 0;
          padding: 15px;
          background-color: #f8fafc;
          border-radius: 6px;
          border-left: 4px solid #3b82f6;
        }
        .info-title {
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 10px;
          font-size: 16px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-label {
          font-weight: 500;
          color: #6b7280;
        }
        .info-value {
          font-weight: 600;
          color: #1f2937;
        }
        @media (max-width: 600px) {
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 New Payment Received!</h1>
          <p>A new registration payment has been processed</p>
        </div>
        
        <div class="content">
          <div class="amount-highlight">
            <div class="amount">${formatCurrency(paymentData.amount)}</div>
            <div>Payment received on ${formatDate(paymentData.date)}</div>
            <div style="font-size: 14px; color: #6b7280; margin-top: 10px;">
              Session ID: ${paymentData.sessionId}
            </div>
          </div>
          
          <div class="info-section">
            <div class="info-title">👨‍👩‍👧‍👦 Parent Information</div>
            <div class="info-item">
              <span class="info-label">Name:</span>
              <span class="info-value">${parentData.firstName} ${parentData.lastName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email:</span>
              <span class="info-value">${parentData.email}</span>
            </div>
          </div>
          
          <div class="info-section">
            <div class="info-title">👨‍🎓 Student Information</div>
            <div class="info-item">
              <span class="info-label">Name:</span>
              <span class="info-value">${studentData.firstName} ${studentData.lastName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Grade:</span>
              <span class="info-value">${studentData.grade}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Emergency Contact:</span>
              <span class="info-value">${studentData.emergencyContact.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Emergency Phone:</span>
              <span class="info-value">${studentData.emergencyContact.phone}</span>
            </div>
          </div>
          
          <div class="info-section">
            <div class="info-title">🏐 Team Information</div>
            <div class="info-item">
              <span class="info-label">Team:</span>
              <span class="info-value">${teamData.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">School:</span>
              <span class="info-value">${teamData.school.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Location:</span>
              <span class="info-value">${teamData.school.location}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Team Price:</span>
              <span class="info-value">${formatCurrency(teamData.price)}</span>
            </div>
          </div>
          
          ${teamData.session && teamData.session.length > 0 ? `
            <div class="info-section">
              <div class="info-title">📅 Schedule Information</div>
              ${teamData.session.map(session => `
                <div style="margin-bottom: 10px; padding: 10px; background-color: white; border-radius: 4px;">
                  <div class="info-item">
                    <span class="info-label">Dates:</span>
                    <span class="info-value">${formatDate(session.startdate)} - ${formatDate(session.enddate)}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Time:</span>
                    <span class="info-value">${session.starttime} - ${session.endtime}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Days:</span>
                    <span class="info-value">${session.daysofweek}</span>
                  </div>
                  ${session.staff ? `
                    <div class="info-item">
                      <span class="info-label">Coach:</span>
                      <span class="info-value">${session.staff.name}</span>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-weight: 500;">
              📊 This is an automated payment notification. Please verify the payment in your Stripe dashboard.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Función para enviar notificación de pago a la empresa
export async function sendPaymentNotificationToCompany(
  studentData: StudentData,
  teamData: TeamData,
  paymentData: PaymentData,
  parentData: ParentData
) {
  try {
    // Verificar que las credenciales de Gmail estén configuradas
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Gmail credentials not configured')
    }

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)
    }

    const transporter = createTransporter()

    // Generar el HTML del correo
    const htmlContent = createCompanyNotificationTemplate(studentData, teamData, paymentData, parentData)

    // Configurar el correo
    const mailOptions = {
      from: {
        name: 'Discipline Rift Payment System',
        address: process.env.GMAIL_USER!,
      },
      to: 'disciplinerift@gmail.com',
      subject: `💰 New Payment: ${formatCurrency(paymentData.amount)} - ${studentData.firstName} ${studentData.lastName}`,
      html: htmlContent,
    }

    // Enviar el correo
    const result = await transporter.sendMail(mailOptions)
    
    console.log('✅ Company notification email sent successfully:', result.messageId)
    return { success: true, messageId: result.messageId }
    
  } catch (error) {
    console.error('❌ Error sending company notification email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Template HTML para el popup de registro de padres
const createParentGuideEmailTemplate = (email: string, sportInterest?: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Stay Connected to Your Child's Sports Journey</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px;">
      
      <p>Hi Parent,</p>
      
      <p>
        Sports can be one of the most rewarding experiences for your child — not just for physical health, 
        but for building confidence, discipline, and teamwork. Even if you can't be at practice, you can still 
        play a big role in keeping the spark alive at home.
      </p>

      <p>Here are <strong>5 simple ways</strong> to stay connected to your child's sports journey this season:</p>

      <ol>
        <li>
          <strong>Start Every Week with Curiosity</strong><br>
          Ask open-ended questions after practice:
          <blockquote style="margin: 10px 0; padding-left: 15px; border-left: 3px solid #ccc;">
            "What was the most fun thing you did today?"<br>
            "Can you show me something new you learned?"
          </blockquote>
          This shows interest without pressure and keeps conversations flowing.
        </li>

        <li>
          <strong>Create a Home Sports Ritual</strong><br>
          Set aside 10 minutes a couple of times a week to "play" their sport together — soft toss volleyball in the living room, 
          mini pickleball rallies, or shadow tennis swings. The goal is bonding, not coaching.
        </li>

        <li>
          <strong>Celebrate Small Wins</strong><br>
          If they share a moment of progress ("I served over the net!"), mark it on a calendar or a "sports milestones" board. 
          Progress becomes something you both look forward to.
        </li>

        <li>
          <strong>Let Them Teach You</strong><br>
          Invite your child to "coach" you. Kids love taking the lead, and explaining skills helps them internalize what they've learned.
        </li>

        <li>
          <strong>Share the Story of Sports</strong><br>
          Watch short highlight clips together and talk about effort, teamwork, and joy — the values that last long after the game ends.
        </li>
      </ol>

      <p>
        Small moments like these create lasting memories and keep your child excited to learn, grow, and play.
      </p>

      <p>With love,<br>
      <strong>The Discipline Rift Team</strong></p>

      <p>
        📧 <a href="mailto:info@disciplinerift.com">info@disciplinerift.com</a><br>
        📞 <a href="tel:+14076147454">(407) 614-7454</a>
      </p>

    </body>
    </html>
  `
}

// Template HTML para recordatorios de sesión
const createSessionReminderTemplate = (
  studentName: string,
  teamName: string,
  schoolName: string,
  sessionDate: string,
  sessionTime: string,
  schoolLocation: string,
  reminderType: string
) => {
  const reminderMessages = {
    '30d': {
      title: '🗓️ Reminder: Your training session is in 30 days',
      message: 'Your training session is approaching. Make sure you have everything ready.',
      urgency: 'info'
    },
    '7d': {
      title: '⏰ Reminder: Your training session is in 7 days',
      message: 'Your training session is next week. Prepare your sports equipment.',
      urgency: 'warning'
    },
    '1d': {
      title: '🚨 Reminder: Your training session is TOMORROW',
      message: 'Your training session is tomorrow. Don\'t forget to attend!',
      urgency: 'urgent'
    }
  };

  const reminder = reminderMessages[reminderType as keyof typeof reminderMessages] || reminderMessages['1d'];
  const urgencyColors = {
    info: '#3b82f6',
    warning: '#f59e0b',
    urgent: '#ef4444'
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${reminder.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px;">
      
      <div style="background: linear-gradient(135deg, ${urgencyColors[reminder.urgency as keyof typeof urgencyColors]} 0%, #1e40af 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 24px;">${reminder.title}</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${reminder.message}</p>
      </div>

      <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid ${urgencyColors[reminder.urgency as keyof typeof urgencyColors]}; margin-bottom: 25px;">
        <h2 style="color: #1e40af; margin-top: 0; font-size: 20px;">📋 Session Details</h2>
        
        <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 15px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 120px;">Student:</td>
              <td style="padding: 8px 0; color: #1f2937;">${studentName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Team:</td>
              <td style="padding: 8px 0; color: #1f2937;">${teamName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">School:</td>
              <td style="padding: 8px 0; color: #1f2937;">${schoolName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Date:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${new Date(sessionDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Time:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${sessionTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Location:</td>
              <td style="padding: 8px 0; color: #1f2937;">${schoolLocation}</td>
            </tr>
          </table>
        </div>
      </div>

      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
        <h3 style="color: #059669; margin-top: 0; font-size: 18px;">✅ What to bring to the session:</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: #374151;">
          <li>Comfortable athletic clothing</li>
          <li>Appropriate athletic shoes</li>
          <li>Water bottle</li>
          <li>Small towel</li>
          <li>Positive attitude and eagerness to learn</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          If you have any questions or need to reschedule, contact us:<br>
          📧 <a href="mailto:info@disciplinerift.com" style="color: #3b82f6;">info@disciplinerift.com</a><br>
          📞 <a href="tel:+14076147454" style="color: #3b82f6;">(407) 614-7454</a>
        </p>
      </div>

      <div style="background-color: #1f2937; color: #9ca3af; padding: 20px; border-radius: 8px; text-align: center; margin-top: 30px;">
        <p style="margin: 0; font-size: 12px;">
          This is an automated reminder from Discipline Rift<br>
          Sent on ${new Date().toLocaleDateString('en-US')} at ${new Date().toLocaleTimeString('en-US')}
        </p>
      </div>

    </body>
    </html>
  `;
};

// Función para enviar recordatorio de sesión
export async function sendSessionReminderEmail(data: {
  parentEmail: string;
  studentName: string;
  teamName: string;
  schoolName: string;
  sessionDate: string;
  sessionTime: string;
  schoolLocation: string;
  reminderType: string;
}) {
  try {
    // Verificar que las credenciales de Gmail estén configuradas
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Gmail credentials not configured');
    }

    const transporter = createTransporter();

    // Generar el HTML del correo
    const htmlContent = createSessionReminderTemplate(
      data.studentName,
      data.teamName,
      data.schoolName,
      data.sessionDate,
      data.sessionTime,
      data.schoolLocation,
      data.reminderType
    );

    const reminderTypeNames = {
      '30d': '30 days',
      '7d': '7 days', 
      '1d': '1 day'
    };

    const reminderName = reminderTypeNames[data.reminderType as keyof typeof reminderTypeNames] || 'soon';

    // Configurar el correo
    const mailOptions = {
      from: {
        name: 'Discipline Rift',
        address: process.env.GMAIL_USER!,
      },
      to: data.parentEmail,
      subject: `🏐 Reminder: ${data.studentName}'s session in ${reminderName}`,
      html: htmlContent,
    };

    // Enviar el correo
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Session reminder email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Error sending session reminder email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Función para enviar el email del Parent Guide desde el popup
export async function sendParentGuideEmail(email: string, sportInterest?: string) {
  try {
    // Verificar que las credenciales de Gmail estén configuradas
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Gmail credentials not configured')
    }

    const transporter = createTransporter()

    // Generar el HTML del correo
    const htmlContent = createParentGuideEmailTemplate(email, sportInterest)

    // Configurar el correo
    const mailOptions = {
      from: {
        name: 'Discipline Rift',
        address: process.env.GMAIL_USER!,
      },
      to: email,
      subject: "Stay Connected to Your Child's Sports Journey",
      html: htmlContent,
    }

    // Enviar el correo
    const result = await transporter.sendMail(mailOptions)
    
    console.log('✅ Parent Guide email sent successfully:', result.messageId)
    return { success: true, messageId: result.messageId }
    
  } catch (error) {
    console.error('❌ Error sending Parent Guide email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Función para enviar correo promocional del Labor Day
export async function sendLaborDayPromoEmail(email: string) {
  try {
    // Verificar que las credenciales de Gmail estén configuradas
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Gmail credentials not configured')
    }

    const transporter = createTransporter()

    const laborDayTemplate = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <title>It's Labor Day! Here's what actually matters</title>
  <style>
    /* Basic email resets */
    html, body { margin:0; padding:0; height:100%; }
    body, table, td, p { margin: 0; padding: 0; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse; }

    /* Layout helpers */
    .inner { width:600px; max-width:600px; }
    .shadow { box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
    .card { background-color:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden; }
    .px-32 { padding-left:32px; padding-right:32px; }
    .py-32 { padding-top:32px; padding-bottom:32px; }
    .badge { display:inline-block; padding:2px 8px; border-radius:9999px; background:#eef2ff; color:#1e40af; font-weight:700; font-size:13px; letter-spacing:.02em; }
    .code-badge { display:inline-block; padding:2px 8px; border-radius:8px; background:#111827; color:#ffffff; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size:14px; }
    .muted { color:#6b7280; }
    .lead { color:#374151; }
    .divider { height:1px; background:#e5e7eb; line-height:1px; }
    .callout { border-left:4px solid #3b82f6; background:#f9fafb; border-radius:12px; }

    /* Responsive */
    @media (max-width: 600px) {
      .inner { width:100% !important; max-width:100% !important; }
      .px-32 { padding-left: 20px !important; padding-right: 20px !important; }
      .py-32 { padding-top: 24px !important; padding-bottom: 24px !important; }
      .h1 { font-size:24px !important; line-height:32px !important; }
    }
  </style>
</head>
<body style="background:#f6f7f9; background-image:linear-gradient(180deg,#f8fafc, #eef2ff 25%, #f6f7f9 60%); margin:0; padding:0;">
  <center role="article" aria-roledescription="email" lang="en" style="width:100%;">
    <table role="presentation" width="100%" style="width:100%;" aria-hidden="true">
      <tr>
        <td align="center" style="padding:24px;">
          <!-- Card -->
          <table role="presentation" class="inner card shadow" width="600">
            <!-- Header / Hero -->
            <tr>
              <td style="padding:28px 32px; background: linear-gradient(135deg,#0ea5e9,#3b82f6);">
                <h1 class="h1" style="font-family: Arial, Helvetica, sans-serif; font-size:28px; line-height:36px; font-weight:800; margin:0; color:#ffffff; letter-spacing:.2px;">It's Labor Day! Here's what actually matters</h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td class="px-32 py-32" style="font-family: Arial, Helvetica, sans-serif; color:#111827;">

                <!-- Lead -->
                <p style="font-size:16px; line-height:24px; margin:0;" class="lead"><strong>What do kids value the most in sports?</strong> The friendships they make</p>

                <div style="height:16px; line-height:16px;">&nbsp;</div>
                <div class="divider" style="height:1px; background:#e5e7eb;">&nbsp;</div>
                <div style="height:16px; line-height:16px;">&nbsp;</div>

                <!-- Did you know -->
                <p style="font-size:14px; line-height:22px; margin:0; font-weight:700;">Did you know?</p>
                <div style="height:8px; line-height:8px;">&nbsp;</div>
                <p style="font-size:16px; line-height:24px; margin:0;" class="lead">80% of players highlighted positive social interactions as the top benefit<br/>(Anderson-Butcher et al., 2022)</p>

                <div style="height:16px; line-height:16px;">&nbsp;</div>

                <!-- Callout -->
                <table role="presentation" width="100%" style="width:100%;" class="callout">
                  <tr>
                    <td style="padding:16px;">
                      <p style="font-size:16px; line-height:24px; color:#111827; margin:0;"><strong>The WE, not ME:</strong> partner + team drills that require communication, encouragement, and shared goals.</p>
                    </td>
                  </tr>
                </table>

                <div style="height:16px; line-height:16px;">&nbsp;</div>

                <!-- Meaningful -->
                <p style="font-size:16px; line-height:24px; margin:0;" class="lead">Social interaction with peers and coaches is what makes sports experiences meaningful</p>

                <div style="height:24px; line-height:24px;">&nbsp;</div>
                <div class="divider" style="height:1px; background:#e5e7eb;">&nbsp;</div>
                <div style="height:16px; line-height:16px;">&nbsp;</div>

                <!-- Labor Day note -->
                <p style="font-size:16px; line-height:24px; margin:0;">Because you read this on labor day, let's celebrate your hard work</p>

                <div style="height:16px; line-height:16px;">&nbsp;</div>

                <!-- Offer -->
                <p style="font-size:16px; line-height:28px; margin:0;" class="lead">Register by 11:59 PM, September 1st<br/>Use code: <span class="code-badge">LABORDAY</span><br/>Get a discount on this season's registration</p>

                <div style="height:16px; line-height:16px;">&nbsp;</div>

                <!-- Sports -->
                <p style="font-size:12px; line-height:20px; margin:0; text-transform:uppercase; letter-spacing:.12em;" class="muted">Tennis | Tennis | Pickleball</p>

                <div style="height:28px; line-height:28px;">&nbsp;</div>

                <!-- CTA Button (Bulletproof) -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="left">
                  <tr>
                    <td>
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="https://www.disciplinerift.com/#register" style="height:50px;v-text-anchor:middle;width:230px;" arcsize="14%" stroke="f" fillcolor="#ef4444">
                        <w:anchorlock/>
                        <center style="color:#ffffff;font-family:Arial, Helvetica, sans-serif;font-size:16px;font-weight:700;">REGISTER NOW</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-- -->
                      <a href="https://www.disciplinerift.com/#register" target="_blank" style="display:inline-block; padding:16px 26px; font-size:16px; line-height:18px; color:#ffffff; text-decoration:none; font-weight:700; border-radius:12px; font-family: Arial, Helvetica, sans-serif; background:linear-gradient(135deg,#ef4444,#dc2626); box-shadow:0 8px 16px rgba(220,38,38,0.25);">REGISTER NOW</a>
                      <!--<![endif]-->
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>
          <!-- /Card -->

          <div style="height:24px; line-height:24px;">&nbsp;</div>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`

    const mailOptions = {
      from: `"Discipline Rift" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "What does your child care about in sports?",
      html: laborDayTemplate,
    }

    console.log(`📧 Sending Labor Day email to: ${email}`)
    const result = await transporter.sendMail(mailOptions)
    console.log(`✅ Labor Day email sent successfully to: ${email}`)
    
    return {
      success: true,
      messageId: result.messageId
    }

  } catch (error) {
    console.error(`❌ Error sending Labor Day email to ${email}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Template para correo de recordatorio de pago incompleto
const createIncompletePaymentReminderTemplate = (parentFirstName: string, enrollments: any[]) => {
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Sorry, I can't. They've got something better.</title>
  <style>
    /* Basic reset for email */
    body { margin:0; padding:0; background:#f3f5f9; }
    img { border:0; outline:none; text-decoration:none; display:block; }
    table { border-collapse:collapse; }
    .container { width:600px; }
    .card {
      background:#ffffff;
      border-radius:16px;
      overflow:hidden;
      box-shadow:0 10px 24px rgba(16,24,40,0.08);
    }
    .p-outer { padding:32px; }
    .p-inner { padding:40px; }
    .h1 {
      font-family:Segoe UI, Arial, Verdana, sans-serif;
      font-size:26px; line-height:34px; color:#0f172a; margin:0 0 12px; font-weight:800;
    }
    .lead {
      font-family:Segoe UI, Arial, Verdana, sans-serif;
      font-size:16px; line-height:24px; color:#334155; margin:0 0 18px;
    }
    .muted {
      font-family:Segoe UI, Arial, Verdana, sans-serif;
      font-size:14px; line-height:22px; color:#64748b; margin:0 0 20px;
    }
    .chip {
      display:inline-block; padding:8px 14px; border-radius:999px;
      background:#eef2ff; color:#3730a3; font-family:Segoe UI, Arial, Verdana, sans-serif;
      font-size:14px; margin:6px 6px 0 0; font-weight:600;
    }
    .divider {
      height:1px; border-top:1px solid #e5e7eb; margin:24px 0;
    }
    .btn a {
      display:inline-block; text-decoration:none; font-family:Segoe UI, Arial, Verdana, sans-serif;
      font-size:17px; font-weight:700; padding:14px 24px; border-radius:999px;
      background:#0ea5e9; color:#ffffff;
    }
    .footer-p {
      font-family:Segoe UI, Arial, Verdana, sans-serif;
      font-size:12px; color:#64748b; margin:0;
    }

    /* Mobile */
    @media screen and (max-width:600px){
      .container { width:100% !important; }
      .p-outer { padding:20px !important; }
      .p-inner { padding:24px !important; }
      .h1 { font-size:22px !important; line-height:30px !important; }
      .lead { font-size:15px !important; }
      .btn a { font-size:16px !important; }
    }

    /* Optional dark mode hint (limited support) */
    @media (prefers-color-scheme: dark){
      body { background:#0f172a !important; }
      .card { background:#111827 !important; color:#e5e7eb !important; }
      .lead { color:#cbd5e1 !important; }
      .muted, .footer-p { color:#94a3b8 !important; }
      .divider { border-color:#1f2937 !important; }
      .chip { background:#1f2937 !important; color:#c7d2fe !important; }
      .btn a { background:#22d3ee !important; color:#0f172a !important; }
    }
  </style>
</head>
<body>
  <!-- Preheader (hidden in most clients) -->
  <div style="display:none; overflow:hidden; line-height:1px; opacity:0; max-height:0; max-width:0;">
    7 days left to register for Volleyball • Tennis • Pickleball
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="container card" width="600" style="width:600px;">
          <!-- Header -->
          <tr>
            <td class="p-outer" align="center" style="background:linear-gradient(135deg,#0f172a 0%, #1e293b 65%, #0ea5e9 130%);">
              <div style="font-family:Segoe UI, Arial, Verdana, sans-serif; color:#ffffff; font-size:18px; font-weight:800; letter-spacing:1.2px;">
                DISCIPLINE RIFT
              </div>
              <div style="font-family:Segoe UI, Arial, Verdana, sans-serif; color:#c7e9fb; font-size:13px; margin-top:6px;">
                Fall Sports Registration
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="p-inner" style="text-align:left;">
              <h1 class="h1">Sorry, I can't. They've got something better.</h1>

              <p class="lead">Hi ${parentFirstName},</p>

              <p class="lead">This fall, your child could be doing more than just school.</p>
              <p class="lead">They could be growing, training, and having the time of their life playing sports.</p>

              <p class="lead"><strong>In ONE week, our fall season begins and registrations are closing.</strong></p>

              <!-- Sports chips -->
              <div>
                <span class="chip">Volleyball</span>
                <span class="chip">Tennis</span>
                <span class="chip">Pickleball</span>
              </div>

              <div class="divider"></div>

              <p class="lead"><strong>You've got 7 days.</strong> Let's get your child in the game.</p>

              <p class="muted">We believe school doesn't teach everything. Sports help kids practice empathy, resilience, and how to win and lose in life.</p>
              <p class="muted">We build life skills through the game so kids grow as people, not just players.</p>

              <p class="lead" style="margin-top:18px;"><em>Sorry, I can't. They've got something better.</em></p>
              <p class="lead" style="margin-top:6px;">7 days left to register for <strong>Volleyball • Tennis • Pickleball</strong>.</p>

              <!-- CTA Button (with VML for Outlook) -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="left" class="btn" style="margin-top:16px;">
                <tr>
                  <td align="left">
                    <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="https://www.disciplinerift.com/#register"
                        style="height:48px;v-text-anchor:middle;width:220px;" arcsize="50%" stroke="f" fillcolor="#0ea5e9">
                        <w:anchorlock/>
                        <center style="color:#ffffff;font-family:Segoe UI, Arial, sans-serif;font-size:17px;font-weight:700;">
                          Register Now
                        </center>
                      </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-- -->
                    <a href="https://www.disciplinerift.com/#register" target="_blank" rel="noopener">
                      Register Now
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p class="muted" style="margin-top:16px;">
                Or paste this link in your browser: https://www.disciplinerift.com/#register
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="p-outer" style="background:#f8fafc; text-align:center;">
              <p class="footer-p">You're receiving this because you asked about Discipline Rift Fall programs.</p>
              <p class="footer-p" style="margin-top:6px;">&copy; Discipline Rift — All rights reserved</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Función para enviar correo de recordatorio de pago incompleto
export async function sendIncompletePaymentReminderEmail(
  parentEmail: string,
  parentFirstName: string,
  enrollments: any[]
) {
  try {
    // Verificar que las credenciales de Gmail estén configuradas
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Gmail credentials not configured')
    }

    const transporter = createTransporter()

    // Generar el HTML del correo
    const htmlContent = createIncompletePaymentReminderTemplate(parentFirstName, enrollments)

    // Configurar el correo
    const mailOptions = {
      from: {
        name: 'Discipline Rift',
        address: process.env.GMAIL_USER!,
      },
      to: parentEmail,
      subject: "Sorry, I can't. They've got something better.",
      html: htmlContent,
    }

    // Enviar el correo
    const result = await transporter.sendMail(mailOptions)
    
    console.log('✅ Incomplete payment reminder email sent successfully:', result.messageId)
    return { success: true, messageId: result.messageId }
    
  } catch (error) {
    console.error('❌ Error sending incomplete payment reminder email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Función de prueba directa (temporal)
export async function testSendIncompletePaymentEmail() {
  console.log('🧪 === EJECUTANDO PRUEBA DE CORREO DIRECTO ===');
  
  try {
    const result = await sendIncompletePaymentReminderEmail(
      'cberrio04@gmail.com',
      'Carlos',
      []
    );
    
    if (result.success) {
      console.log('✅ PRUEBA EXITOSA - CORREO ENVIADO');
      console.log(`📬 Message ID: ${result.messageId}`);
    } else {
      console.error('❌ PRUEBA FALLÓ:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error en prueba:', error);
    return { success: false, error: 'Test failed' };
  }
} 