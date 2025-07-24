import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EmailNotificationPayload {
  restaurantName: string;
  submitterName: string;
  itemName: string;
  itemType: string;
  itemCount?: number;
  email?: string;
  phone?: string;
  isAuthenticated: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔔 Email notification function triggered')
    
    // Get the Resend API key from environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'Missing Resend API key configuration' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse the request payload
    const payload: EmailNotificationPayload = await req.json()
    console.log('📧 Email payload received:', payload)
    
    // Validate required fields
    if (!payload.restaurantName || !payload.submitterName || !payload.itemName || !payload.itemType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare email content
    const itemCountText = payload.itemCount && payload.itemCount > 1 ? ` (${payload.itemCount} מנות)` : ''
    const contactInfo = payload.email || payload.phone || 'לא נמסר'
    const userTypeText = payload.isAuthenticated ? 'לקוח רשום' : 'לקוח חדש'
    
    const emailSubject = `הגשה חדשה מ-${payload.restaurantName}`
    const emailHtml = `
      <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #8b1e3f; margin-bottom: 20px;">🍽️ הגשה חדשה במערכת!</h2>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
          <h3 style="color: #333; margin-top: 0;">פרטי המסעדה</h3>
          <p><strong>שם המסעדה:</strong> ${payload.restaurantName}</p>
          <p><strong>שם המגיש:</strong> ${payload.submitterName}</p>
          <p><strong>סוג משתמש:</strong> ${userTypeText}</p>
          <p><strong>איש קשר:</strong> ${contactInfo}</p>
        </div>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
          <h3 style="color: #333; margin-top: 0;">פרטי ההגשה</h3>
          <p><strong>שם הפריט:</strong> ${payload.itemName}${itemCountText}</p>
          <p><strong>סוג הפריט:</strong> ${payload.itemType}</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 6px;">
          <p style="margin: 0; font-weight: bold; color: #856404;">
            יש להתחבר למערכת לבדיקת ההגשה החדשה והתחלת העבודה 📋
          </p>
        </div>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          הודעה אוטומטית ממערכת Food Vision
        </p>
      </div>
    `

    const emailText = `
הגשה חדשה במערכת Food Vision!

פרטי המסעדה:
- שם המסעדה: ${payload.restaurantName}
- שם המגיש: ${payload.submitterName}
- סוג משתמש: ${userTypeText}
- איש קשר: ${contactInfo}

פרטי ההגשה:
- שם הפריט: ${payload.itemName}${itemCountText}
- סוג הפריט: ${payload.itemType}

יש להתחבר למערכת לבדיקת ההגשה החדשה והתחלת העבודה.
    `

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Food Vision <noreply@food-vision.co.il>',
        to: ['avifrid121@gmail.com'],
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
      }),
    })

    const emailResult = await emailResponse.json()
    
    if (!emailResponse.ok) {
      console.error('❌ Resend API error:', emailResult)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: emailResult }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Email sent successfully:', emailResult)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email notification sent successfully',
        emailId: emailResult.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error in email notification function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 