import { type NextRequest, NextResponse } from "next/server"
import { createReadStream } from 'fs'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

// Import PDF parsing library - you'll need to install pdf-parse
// npm install pdf-parse @types/pdf-parse
const pdf = require('pdf-parse')

export async function POST(request: NextRequest) {
  let tempFilePath = ''
  
  try {
    console.log("[SERVER] POST /api/marketing/extract-pdf - Starting PDF extraction")

    const formData = await request.formData()
    const file = formData.get('pdf') as File
    
    if (!file) {
      return NextResponse.json(
        { error: "No PDF file provided" },
        { status: 400 }
      )
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      )
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "PDF file too large. Maximum size is 10MB" },
        { status: 400 }
      )
    }

    // Create temporary file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Generate unique filename
    tempFilePath = join(tmpdir(), `temp_pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`)
    
    // Write buffer to temporary file
    await writeFile(tempFilePath, buffer)

    // Extract text from PDF
    const dataBuffer = createReadStream(tempFilePath)
    const pdfData = await pdf(dataBuffer)

    // Clean extracted text
    let extractedText = pdfData.text
    
    // Basic text cleaning
    extractedText = extractedText
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\r/g, '\n')    // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .trim()

    // If text is too short, it might be an image-based PDF
    if (extractedText.length < 50) {
      return NextResponse.json(
        { error: "Could not extract sufficient text from PDF. The PDF might contain only images or be corrupted." },
        { status: 400 }
      )
    }

    console.log(`[SERVER] PDF extraction successful, extracted ${extractedText.length} characters`)

    return NextResponse.json({
      success: true,
      text: extractedText,
      filename: file.name,
      size: file.size,
      pages: pdfData.numpages || 1
    })

  } catch (error) {
    console.error("[SERVER] POST /api/marketing/extract-pdf - Error:", error)
    
    // Return appropriate error message
    let errorMessage = "Failed to extract text from PDF"
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        errorMessage = "Invalid or corrupted PDF file"
      } else if (error.message.includes('Password')) {
        errorMessage = "Password-protected PDFs are not supported"
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath)
        console.log(`[SERVER] Cleaned up temporary file: ${tempFilePath}`)
      } catch (cleanupError) {
        console.error("[SERVER] Error cleaning up temporary file:", cleanupError)
      }
    }
  }
}

// Set maximum request size to 15MB to accommodate PDF files
export const runtime = 'nodejs'
export const maxDuration = 30 // 30 seconds timeout












