import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    console.log("🔄 Sending login OTP to:", email);

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Usar la función integrada de Supabase para enviar OTP de 6 dígitos
    // La configuración para códigos OTP debe estar habilitada en el dashboard de Supabase
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: true, // Crear usuario automáticamente si no existe
        // Para códigos OTP de 6 dígitos, la configuración debe estar en Supabase Dashboard:
        // Authentication > Settings > Email Templates > Enable "Email OTP"
      },
    });

    if (error) {
      console.error("❌ OTP error:", error);

      if (error.message.includes("Email rate limit exceeded")) {
        return NextResponse.json(
          {
            message:
              "Too many login attempts. Please wait a few minutes before trying again.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { message: "Failed to send login code" },
        { status: 500 }
      );
    }

    console.log("✅ Login OTP sent successfully");

    return NextResponse.json({
      message:
        "Login code sent successfully. Please check your email and enter the 6-digit code.",
      expiresIn: "10 minutes",
    });
  } catch (error) {
    console.error("❌ Send login OTP error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
