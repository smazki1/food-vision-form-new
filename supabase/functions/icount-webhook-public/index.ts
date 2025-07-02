import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface ICountWebhookPayload {
  doc_id: string;
  doc_type?: string;
  amount: number;
  customer_email: string;
  customer_phone?: string;
  customer_name?: string;
  payment_date?: string;
  [key: string]: any;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Public Webhook Received ===')
    console.log('Method:', req.method)
    console.log('Headers:', Object.fromEntries(req.headers.entries()))
    
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
    const invoiceNumber = data.invoice_number || data.doc_id || data.document_id || data.id || data.invoice_id
    const amount = parseFloat((data.amount || data.total || data.sum || '0').toString().replace(/[^0-9.]/g, ''))
    const customerName = data.customer_name || data.client_name || data.name || 'Unknown'
    const customerEmail = data.customer_email || data.client_email || data.email || ''
    const paymentDate = data.payment_date || data.date || new Date().toISOString()
    
    if (!invoiceNumber || !amount) {
      console.error('Missing required fields:', { invoiceNumber, amount })
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing invoice number or amount' 
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
        message: 'Payment already recorded' 
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
        admin_notes: 'Received via webhook',
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

    return new Response(JSON.stringify({ 
      success: true,
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
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 