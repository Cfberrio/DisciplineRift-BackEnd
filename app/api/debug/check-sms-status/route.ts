import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { messageId } = await request.json()

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      )
    }

    // Check if Twilio is available
    let twilio
    try {
      twilio = require('twilio')
    } catch (importError) {
      return NextResponse.json({
        error: 'Twilio library not installed'
      }, { status: 500 })
    }

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return NextResponse.json({
        error: 'Twilio credentials not configured'
      }, { status: 500 })
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    console.log(`[DEBUG] Checking status for message: ${messageId}`)
    
    const message = await client.messages(messageId).fetch()
    
    console.log(`[DEBUG] Message status details:`, {
      sid: message.sid,
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      to: message.to,
      from: message.from,
      body: message.body,
      dateCreated: message.dateCreated,
      dateSent: message.dateSent,
      dateUpdated: message.dateUpdated,
      direction: message.direction,
      price: message.price,
      priceUnit: message.priceUnit
    })

    // Diagnóstico específico para undelivered
    if (message.status === 'undelivered' || message.status === 'failed') {
      console.log(`[DEBUG] ⚠️ DELIVERY FAILURE ANALYSIS:`)
      console.log(`[DEBUG] - Status: ${message.status}`)
      console.log(`[DEBUG] - Error Code: ${message.errorCode || 'None'}`)
      console.log(`[DEBUG] - Error Message: ${message.errorMessage || 'None'}`)
      console.log(`[DEBUG] - Message Body Length: ${message.body?.length || 0}`)
      console.log(`[DEBUG] - Has Emojis: ${/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(message.body || '')}`)
      console.log(`[DEBUG] - To Number Country: US/Canada (based on +1 prefix)`)
    }
    
    return NextResponse.json({
      success: true,
      messageStatus: {
        sid: message.sid,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        to: message.to,
        from: message.from,
        body: message.body,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
        direction: message.direction,
        price: message.price,
        priceUnit: message.priceUnit
      }
    })

  } catch (error) {
    console.error("[DEBUG] Error checking SMS status:", error)
    return NextResponse.json(
      { 
        error: "Failed to check SMS status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
