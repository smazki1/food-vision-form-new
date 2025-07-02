import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ICountWebhookPayload {
  doc_id: string;
  doc_type?: string;
  amount: number;
  customer_email: string;
  customer_phone?: string;
  customer_name?: string;
  payment_date?: string;
  [key: string]: any; // For additional webhook fields
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== iCount Webhook Received ===')
    console.log('Method:', req.method)
    console.log('URL:', req.url)
    
    // Extract secret from URL parameter
    const url = new URL(req.url)
    const secretParam = url.searchParams.get('secret')
    const expectedSecret = '882F87C04676B449'
    
    if (!secretParam || secretParam !== expectedSecret) {
      console.error('Invalid or missing secret parameter. Expected:', expectedSecret, 'Got:', secretParam)
      return new Response(
        JSON.stringify({ error: 'Invalid or missing secret parameter' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Secret parameter verified')

    // Parse webhook payload
    const payload: ICountWebhookPayload = await req.json()
    console.log('Webhook payload:', payload)

    // Initialize Supabase client with service role key (no auth token needed)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Auto-detect package type based on amount
    let detectedPackageType = null;
    if (payload.amount >= 1690) {
      detectedPackageType = 'deluxe';
    } else if (payload.amount >= 990) {
      detectedPackageType = 'full_menu';
    } else if (payload.amount >= 550) {
      detectedPackageType = 'tasting';
    }

    console.log('Detected package type:', detectedPackageType, 'for amount:', payload.amount)

    // Check if payment already exists (prevent duplicates)
    const { data: existingPayment } = await supabase
      .from('icount_payments')
      .select('payment_id')
      .eq('icount_doc_id', payload.doc_id)
      .single()

    if (existingPayment) {
      console.log('Payment already exists:', payload.doc_id)
      return new Response(
        JSON.stringify({ message: 'Payment already processed' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Store payment in database
    const { data: newPayment, error } = await supabase
      .from('icount_payments')
      .insert({
        icount_doc_id: payload.doc_id,
        icount_doc_type: payload.doc_type || 'invoice',
        payment_amount: payload.amount,
        customer_email: payload.customer_email,
        customer_phone: payload.customer_phone || null,
        customer_name: payload.customer_name || null,
        payment_date: payload.payment_date || new Date().toISOString(),
        detected_package_type: detectedPackageType,
        webhook_payload: payload,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Successfully stored payment:', newPayment.payment_id)

    // Try to auto-match with existing affiliate by email
    const { data: matchingAffiliate } = await supabase
      .from('affiliates')
      .select('affiliate_id, name, email')
      .eq('email', payload.customer_email)
      .single()

    let suggestionMessage = 'Payment stored for admin review'
    if (matchingAffiliate) {
      // Update payment with suggested affiliate
      await supabase
        .from('icount_payments')
        .update({ 
          affiliate_id: matchingAffiliate.affiliate_id,
          admin_notes: `Auto-suggested: Matching email found for affiliate "${matchingAffiliate.name}"`
        })
        .eq('payment_id', newPayment.payment_id)

      suggestionMessage = `Payment matched with affiliate: ${matchingAffiliate.name}`
      console.log('✅ Auto-matched affiliate:', matchingAffiliate.name)
    }

    console.log('=== Webhook Processing Complete ===')

    return new Response(
      JSON.stringify({ 
        success: true, 
        payment_id: newPayment.payment_id,
        detected_package: newPayment.detected_package_type,
        suggestion: suggestionMessage
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 