import type { CancellationRecipient } from "./cancellation-query"

/**
 * Genera el HTML del email de cancelación con los reemplazos dinámicos
 * Usa exactamente el template proporcionado por el usuario
 */
export function generateCancellationEmailHTML(recipient: CancellationRecipient): string {
  const parentName = `${recipient.parentFirstName} ${recipient.parentLastName}`.trim()
  
  return `<!doctype html>
<html lang="en" style="margin:0; padding:0;">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <title>Cancellation — ${recipient.teamName} — Important Update</title>
  <style>
    /* Mobile tweaks */
    @media (max-width:600px){
      .container{width:100% !important;}
      .p-24{padding:16px !important;}
      .h1{font-size:22px !important; line-height:28px !important;}
    }
    /* Dark mode */
    @media (prefers-color-scheme: dark){
      body, table, td{background:#0b0b0d !important; color:#f2f2f3 !important;}
      .card{background:#16161a !important; border-color:#2a2a31 !important;}
      .muted{color:#b7b7c0 !important;}
      .btn{background:#e5e7eb !important; color:#111827 !important; border-color:#e5e7eb !important;}
      a{color:#9dc1ff !important;}
    }
    /* Apple link color reset */
    a[x-apple-data-detectors]{color:inherit !important; text-decoration:none !important;}
      /* Visual polish */
    body{background:#f3f4f6; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;}
    .card{box-shadow:0 12px 32px rgba(17,24,39,.08); border-top:4px solid #111827; border-radius:14px;}
    .h1{letter-spacing:.2px;}
    .muted{color:#6b7280;}
    ul li{margin-bottom:8px;}
    a:hover{opacity:0.9;}
      /* Extra polish */
    :root{--brand:#111827;--border:#e5e7eb;--muted:#6b7280;--bg:#f3f4f6;--card:#ffffff;}
    h1,h2,p,li,a{ -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; }
    p, li{letter-spacing:.1px;}
    h2{padding-bottom:6px; border-bottom:1px solid var(--border);} 
    .card{background:var(--card); backdrop-filter:saturate(120%) blur(.5px); transition: box-shadow .2s ease;}
    .card:hover{box-shadow:0 16px 48px rgba(17,24,39,.12);} 
    a{ text-underline-offset:2px; text-decoration-thickness: from-font; }
    a:hover{ text-decoration:underline; opacity:.95; }
    .divider{height:1px; background:var(--border); margin:12px 0;}
    @media (prefers-reduced-motion: reduce){ *{transition:none !important; animation:none !important;} }
    @media (max-width:600px){ .hide-mobile{display:none !important;} .card{box-shadow:0 8px 24px rgba(17,24,39,.12);} }
  </style>
</head>
<body style="margin:0; padding:0; background:#f3f4f6; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
    Season cancellation notice for ${recipient.teamName} at ${recipient.schoolName}. Refund of $129 and priority notice for the next session.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="container" style="width:600px; max-width:600px;">
          <!-- Brand/Header -->
          <tr>
            <td align="left" style="padding:8px 8px 16px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font:700 18px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111827;">
                    Discipline Rift
                  </td>
                  <td align="right" style="font:400 12px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#6b7280;">
                    info@disciplinerift.com • (407) 614-7454
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="card p-24" style="background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:24px;">
              <h1 class="h1" style="margin:0 0 12px 0; font:700 24px/1.25 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111827;">
                Cancellation — <span style="white-space:nowrap;">${recipient.teamName}</span> — Important Update
              </h1>

              <p style="margin:0 0 4px 0; font:400 14px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#374151;">
                Hi <strong>${parentName}</strong>,
              </p>

              <p style="margin:0 0 12px 0; font:400 14px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#374151;">
                We're writing with a tough update: we are canceling the <strong>${recipient.teamName}</strong> season at <strong>${recipient.schoolName}</strong>.
              </p>

              <p style="margin:0 0 12px 0; font:400 14px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#374151;">
                We didn't receive enough registrations to run a safe, meaningful program on campus.
              </p>

              <p style="margin:0 0 16px 0; font:400 14px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#374151;">
                We know this is disappointing—we were excited to coach your players, and it hurts to send this message.
              </p>

              <!-- What happens next -->
              <h2 style="margin:0 0 8px 0; font:700 16px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111827;">
                What happens next:
              </h2>

              <ul style="margin:0 0 16px 20px; padding:0; font:400 14px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#374151;">
                <li style="margin:0 0 6px 0;">Full refund of <strong>$129</strong> to your original payment method within <strong>3 business days</strong>.</li>
                <li style="margin:0 0 6px 0;">Priority notice for the next session at <strong>${recipient.schoolName}</strong>.</li>
              </ul>

              <p style="margin:0 0 12px 0; font:400 14px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#374151;">
                Thank you for understanding and for supporting youth sports.
              </p>

              <p style="margin:0 0 16px 0; font:400 14px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#374151;">
                We'll keep working with the school to bring <strong>${recipient.teamName}</strong> back when there are enough players.
              </p>

              <p style="margin:0 0 16px 0; font:400 14px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#374151;">
                With appreciation,<br/>
                <strong>Discipline Rift</strong><br/>
                <a href="mailto:info@disciplinerift.com" style="color:#2563eb; text-decoration:none;">info@disciplinerift.com</a> • <a href="tel:+14076147454" style="color:#2563eb; text-decoration:none;">(407) 614-7454</a>
              </p>

              <p class="muted" style="margin:0; font:400 12px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#6b7280;">
                This notice applies only to <strong>${recipient.teamName}</strong>; other teams continue as scheduled.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px 8px 0 8px;">
              <p class="muted" style="margin:0; font:400 12px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#6b7280;">
                © <span style="white-space:nowrap;">Discipline Rift</span>
              </p>
            </td>
          </tr>
          <tr><td style="height:24px; line-height:24px; font-size:0;">&nbsp;</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Genera el asunto del email de cancelación
 */
export function generateCancellationEmailSubject(recipient: CancellationRecipient): string {
  return `Cancellation — ${recipient.teamName} — Important Update`
}

/**
 * Genera el preheader del email (texto de vista previa oculto)
 */
export function generateCancellationEmailPreheader(recipient: CancellationRecipient): string {
  return `Season cancellation notice for ${recipient.teamName} at ${recipient.schoolName}. Refund of $129 and priority notice for the next session.`
}





