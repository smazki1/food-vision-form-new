import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== iCount Webhook Received ===')
    console.log('Method:', req.method)
    console.log('Headers:', Object.fromEntries(req.headers.entries()))
    
    // Check for iCount secret header
    const icountSecret = req.headers.get('x-icount-secret')
    const expectedSecret = '882F87C04676B449' // The secret shown in your screenshot
    
    if (!icountSecret || icountSecret !== expectedSecret) {
      console.error('Invalid or missing X-iCount-Secret header')
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    console.log('✅ iCount secret verified')
    
    // Initialize Supabase with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse webhook data
    const body = await req.text()
    console.log('Raw body:', body)
    
    let data: any
    try {
      data = JSON.parse(body)
    } catch {
      // Try form-data parsing
      const params = new URLSearchParams(body)
      data = Object.fromEntries(params.entries())
    }
    
    console.log('Parsed data:', data)

    // Extract payment info from various possible formats
    const invoiceNumber = 
      data.doc_id || 
      data.invoice_number || 
      data.document_id || 
      data.id || 
      data.invoice_id ||
      data.docId ||
      data.doc_number

    const amount = parseFloat(
      (data.amount || 
       data.total || 
       data.sum || 
       data.total_amount ||
       data.payment_amount ||
       '0').toString().replace(/[^0-9.]/g, '')
    )

    const customerName = 
      data.customer_name || 
      data.client_name || 
      data.name ||
      data.client ||
      data.customer ||
      'Unknown'

    const customerEmail = 
      data.customer_email || 
      data.client_email || 
      data.email ||
      data.mail ||
      ''

    const paymentDate = 
      data.payment_date || 
      data.date ||
      data.pay_date ||
      data.doc_date ||
      new Date().toISOString()
    
    if (!invoiceNumber || !amount) {
      console.error('Missing required fields:', { invoiceNumber, amount })
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing invoice number or amount',
        received_data: data
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Detect package type
    let packageType = 'custom'
    if (amount >= 1650) packageType = 'deluxe'
    else if (amount >= 950) packageType = 'full_menu'
    else if (amount >= 500) packageType = 'tasting'

    console.log(`Invoice: ${invoiceNumber}, Amount: ${amount}, Package: ${packageType}`)

    // Check if payment already exists
    const { data: existing } = await supabase
      .from('icount_payments')
      .select('payment_id')
      .eq('icount_doc_id', invoiceNumber.toString())
      .single()

    if (existing) {
      console.log('Payment already exists:', invoiceNumber)
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Payment already recorded',
        payment_id: existing.payment_id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Insert new payment
    const { data: newPayment, error } = await supabase
      .from('icount_payments')
      .insert({
        icount_doc_id: invoiceNumber.toString(),
        icount_doc_type: 'invoice',
        payment_amount: amount,
        customer_name: customerName,
        customer_email: customerEmail,
        payment_date: paymentDate,
        detected_package_type: packageType,
        status: 'pending',
        admin_notes: 'Received via iCount webhook',
        webhook_payload: data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Payment recorded:', newPayment)

    // Return success response in format iCount expects
    return new Response(JSON.stringify({ 
      success: true,
      status: 'ok',
      payment_id: newPayment.payment_id,
      message: 'Payment recorded successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ 
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 