import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from 'nodemailer';

// Create Gmail SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

export async function POST(request: Request) {
  try {
    const formData = await request.json();
    console.log("Contact form submission received:", formData);

    // Validate required fields
    const requiredFields = ["name", "email", "message"];
    
    for (const field of requiredFields) {
      if (!formData[field] || !formData[field].trim()) {
        return NextResponse.json(
          { message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return NextResponse.json(
        { message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Create admin client for Supabase
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Prepare email content
    const emailSubject = formData.subject 
      ? `Contact Form: ${formData.subject}` 
      : "New Contact Form Submission";

    const emailBody = `
New contact form submission from Discipline Rift website:

Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject || "Not specified"}

Message:
${formData.message}

---
This email was sent automatically from the Discipline Rift contact form.
Submission time: ${new Date().toLocaleString()}
    `.trim();

    console.log("Attempting to send email via SMTP...");

    // Send email using Gmail SMTP
    try {
      // Check if Gmail SMTP is configured
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.error("❌ Gmail SMTP credentials not configured!");
        console.error("- GMAIL_USER:", process.env.GMAIL_USER ? "✅ Set" : "❌ Missing");
        console.error("- GMAIL_APP_PASSWORD:", process.env.GMAIL_APP_PASSWORD ? "✅ Set" : "❌ Missing");
        throw new Error("Gmail SMTP credentials not configured");
      }

      console.log("✅ Gmail SMTP credentials are configured");
      console.log("- GMAIL_USER:", process.env.GMAIL_USER);

      const transporter = createTransporter();

      // Configure email options
      const mailOptions = {
        from: {
          name: 'Discipline Rift Contact Form',
          address: process.env.GMAIL_USER!,
        },
        to: 'info@disciplinerift.com',
        replyTo: formData.email,
        subject: emailSubject,
        text: emailBody,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #2563eb; margin: 0; text-align: center;">📧 New Contact Form Submission</h2>
              <p style="text-align: center; color: #6b7280; margin: 10px 0 0 0;">From Discipline Rift Website</p>
            </div>
            
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
              <h3 style="color: #1f2937; margin-top: 0;">Contact Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 120px;">Name:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${formData.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${formData.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Subject:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${formData.subject || "Not specified"}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-top: 20px;">
              <h3 style="color: #1f2937; margin-top: 0;">Message</h3>
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <p style="margin: 0; line-height: 1.6; color: #374151; white-space: pre-wrap;">${formData.message}</p>
              </div>
            </div>

            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                📅 Submitted on: ${new Date().toLocaleString()}<br>
                🌐 From: Discipline Rift Contact Form<br>
                💬 Reply directly to this email to respond to ${formData.name}
              </p>
            </div>
          </div>
        `,
      };

      // Send the email
      const result = await transporter.sendMail(mailOptions);
      
      console.log('✅ Contact email sent successfully:', result.messageId);
      console.log('📧 Email sent to: info@disciplinerift.com');
      console.log('👤 From user:', formData.name, '(' + formData.email + ')');
      
      if (!result.messageId) {
        throw new Error("Email sent but no messageId received");
      }

      // Optionally store the contact form submission in database
      try {
        await supabaseAdmin
          .from("contact_submissions")
          .insert({
            name: formData.name,
            email: formData.email,
            subject: formData.subject || null,
            message: formData.message,
            submitted_at: new Date().toISOString(),
            status: 'sent'
          });
        console.log("Contact submission stored in database");
      } catch (dbError) {
        console.warn("Could not store in database (table may not exist):", dbError);
        // Continue even if database storage fails
      }

      return NextResponse.json({
        message: "Thank you for your message! We'll get back to you soon.",
        success: true,
      });

    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      
      // Still try to store in database even if email fails
      try {
        await supabaseAdmin
          .from("contact_submissions")
          .insert({
            name: formData.name,
            email: formData.email,
            subject: formData.subject || null,
            message: formData.message,
            submitted_at: new Date().toISOString(),
            status: 'failed'
          });
      } catch (dbError) {
        console.warn("Could not store in database:", dbError);
      }

      return NextResponse.json(
        {
          message: "Thank you for your message! We have received it and will get back to you soon.",
          success: true,
        },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      {
        message: "An error occurred while sending your message. Please try again later.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}