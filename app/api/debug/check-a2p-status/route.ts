import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Check if Twilio is available
    let twilio
    try {
      twilio = require('twilio')
    } catch (importError) {
      return NextResponse.json({
        error: 'Twilio library not installed'
      }, { status: 500 })
    }

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      return NextResponse.json({
        error: 'Twilio credentials not configured'
      }, { status: 500 })
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    console.log('[A2P CHECK] Checking A2P 10DLC status for:', process.env.TWILIO_PHONE_NUMBER)

    try {
      // Check phone number details
      const phoneNumber = await client.incomingPhoneNumbers.list({
        phoneNumber: process.env.TWILIO_PHONE_NUMBER
      })

      if (phoneNumber.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Phone number not found in your account',
          phoneNumber: process.env.TWILIO_PHONE_NUMBER
        })
      }

      const phoneNumberData = phoneNumber[0]
      console.log('[A2P CHECK] Phone number data:', phoneNumberData)

      // Try to get messaging service information if associated
      let messagingServiceInfo = null
      if (phoneNumberData.messagingServiceSid) {
        try {
          messagingServiceInfo = await client.messaging.v1.services(phoneNumberData.messagingServiceSid).fetch()
          console.log('[A2P CHECK] Messaging service info:', messagingServiceInfo)
        } catch (msError) {
          console.log('[A2P CHECK] Could not fetch messaging service info:', msError)
        }
      }

      // Check for A2P campaigns
      let campaignInfo = []
      try {
        const campaigns = await client.messaging.v1.a2p.campaigns.list()
        campaignInfo = campaigns.map(campaign => ({
          sid: campaign.sid,
          status: campaign.status,
          friendlyName: campaign.friendlyName,
          businessName: campaign.businessName,
          campaignType: campaign.campaignType,
          registrationStatus: campaign.registrationStatus,
          description: campaign.description
        }))
        console.log('[A2P CHECK] A2P Campaigns found:', campaignInfo)
      } catch (campaignError) {
        console.log('[A2P CHECK] Could not fetch A2P campaigns:', campaignError)
      }

      return NextResponse.json({
        success: true,
        phoneNumberInfo: {
          sid: phoneNumberData.sid,
          phoneNumber: phoneNumberData.phoneNumber,
          friendlyName: phoneNumberData.friendlyName,
          smsEnabled: phoneNumberData.capabilities?.sms || false,
          messagingServiceSid: phoneNumberData.messagingServiceSid,
          status: phoneNumberData.status
        },
        messagingServiceInfo: messagingServiceInfo ? {
          sid: messagingServiceInfo.sid,
          friendlyName: messagingServiceInfo.friendlyName,
          inboundRequestUrl: messagingServiceInfo.inboundRequestUrl,
          fallbackUrl: messagingServiceInfo.fallbackUrl
        } : null,
        a2pCampaigns: campaignInfo,
        analysis: {
          hasMessagingService: !!phoneNumberData.messagingServiceSid,
          hasA2PCampaigns: campaignInfo.length > 0,
          requiresA2PRegistration: campaignInfo.length === 0 || campaignInfo.every(c => c.registrationStatus !== 'VERIFIED'),
          recommendations: [
            campaignInfo.length === 0 
              ? "❌ No A2P campaigns found - You need to register for A2P 10DLC"
              : "✅ A2P campaigns found",
            !phoneNumberData.messagingServiceSid 
              ? "⚠️ No Messaging Service - Consider creating one for better deliverability"
              : "✅ Messaging Service configured",
            "📋 Error 30034 indicates A2P registration is required for SMS delivery"
          ]
        }
      })

    } catch (twilioError) {
      console.error('[A2P CHECK] Twilio API error:', twilioError)
      return NextResponse.json({
        success: false,
        error: 'Failed to check A2P status',
        details: twilioError instanceof Error ? twilioError.message : 'Unknown Twilio error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error("[A2P CHECK] Error checking A2P status:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to check A2P 10DLC status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}











