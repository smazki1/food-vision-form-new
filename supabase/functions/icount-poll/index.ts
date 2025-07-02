import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== iCount Polling Function Started ===')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get iCount API credentials from environment or database
    const icountApiKey = Deno.env.get('ICOUNT_API_KEY') || ''
    const icountCompanyId = Deno.env.get('ICOUNT_COMPANY_ID') || ''
    
    if (!icountApiKey || !icountCompanyId) {
      console.error('Missing iCount API credentials')
      return new Response(
        JSON.stringify({ error: 'Missing iCount API configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call iCount API to get recent invoices
    const fromDate = new Date()
    fromDate.setHours(fromDate.getHours() - 1) // Check last hour
    
    const icountResponse = await fetch('https://api.icount.co.il/api/v3.php/invoice/get_list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: icountApiKey,
        company_id: icountCompanyId,
        from_date: fromDate.toISOString().split('T')[0],
        status: 'paid' // Only get paid invoices
      })
    })

    if (!icountResponse.ok) {
      throw new Error(`iCount API error: ${icountResponse.status}`)
    }

    const icountData = await icountResponse.json()
    console.log(`Found ${icountData.invoices?.length || 0} invoices from iCount`)

    let newPayments = 0
    
    // Process each invoice
    for (const invoice of (icountData.invoices || [])) {
      // Check if payment already exists
      const { data: existingPayment } = await supabase
        .from('icount_payments')
        .select('payment_id')
        .eq('icount_doc_id', invoice.doc_id)
        .single()

      if (!existingPayment) {
        // Auto-detect package type based on amount
        let detectedPackageType = null;
        const amount = parseFloat(invoice.total_price)
        
        if (amount >= 1690) {
          detectedPackageType = 'deluxe';
        } else if (amount >= 990) {
          detectedPackageType = 'full_menu';
        } else if (amount >= 550) {
          detectedPackageType = 'tasting';
        }

        // Insert new payment
        const { error } = await supabase
          .from('icount_payments')
          .insert({
            icount_doc_id: invoice.doc_id,
            icount_doc_type: 'invoice',
            payment_amount: amount,
            customer_email: invoice.email || '',
            customer_phone: invoice.phone || null,
            customer_name: invoice.client_name || null,
            payment_date: invoice.payment_date || new Date().toISOString(),
            detected_package_type: detectedPackageType,
            webhook_payload: invoice,
            status: 'pending',
            admin_notes: 'Added by automatic polling'
          })

        if (!error) {
          newPayments++
          console.log(`Added new payment: ${invoice.doc_id} - ${invoice.client_name}`)
        } else {
          console.error(`Error adding payment ${invoice.doc_id}:`, error)
        }
      }
    }

    console.log(`=== Polling Complete: ${newPayments} new payments added ===`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoices_checked: icountData.invoices?.length || 0,
        new_payments: newPayments
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Polling error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 