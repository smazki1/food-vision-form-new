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
    console.log('=== iCount Auto Sync Started ===')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // iCount API credentials
    const icountUser = 'avifridstore'
    const icountPassword = '2be2e0'
    const icountCompanyId = 'fridstore'
    
    console.log('Trying different iCount API endpoints...')
    
    // First authenticate to get session
    console.log('Step 1: Authenticating...')
    const authResponse = await fetch('https://api.icount.co.il/api/v3.php/auth/info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: icountUser,
        pass: icountPassword,
        cid: icountCompanyId
      })
    })

    if (!authResponse.ok) {
      throw new Error(`Authentication failed: ${authResponse.status}`)
    }

    const authData = await authResponse.json()
    if (!authData.status) {
      throw new Error(`Authentication failed: ${authData.reason}`)
    }

    const sessionId = authData.sid
    console.log('✅ Authentication successful, session ID:', sessionId)

    // Now try invoice endpoints with session
    const invoiceEndpointsToTry = [
      'doc/docs',
      'doc/list',
      'doc/getList',
      'document/docs',
      'document/list',
      'document/getList',
      'invoice/docs',
      'invoice/list', 
      'invoice/getList',
      'receipt/docs',
      'receipt/list',
      'receipt/getList',
      'client/list',
      'client/getList'
    ]
    
    let workingEndpoint = null
    let icountData = null
    
    console.log('Step 2: Trying invoice endpoints with session...')
    for (const endpoint of invoiceEndpointsToTry) {
      try {
        console.log(`Trying endpoint: ${endpoint}`)
        
        const icountResponse = await fetch(`https://api.icount.co.il/api/v3.php/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sid: sessionId,
            cid: icountCompanyId
          })
        })

        if (icountResponse.ok) {
          const data = await icountResponse.json()
          console.log(`Response for ${endpoint}:`, data)
          
          if (data.status === true || (data.api && !data.api.messages?.some((m: any) => m.type === 'ERROR'))) {
            console.log(`✅ Working endpoint found: ${endpoint}`)
            workingEndpoint = endpoint
            icountData = data
            break
          } else if (data.api?.messages) {
            const errorMessage = data.api.messages.find((m: any) => m.type === 'ERROR')?.data
            console.log(`❌ ${endpoint} failed: ${errorMessage}`)
          }
        } else {
          console.log(`❌ ${endpoint} HTTP error: ${icountResponse.status}`)
        }
      } catch (error) {
        console.log(`❌ ${endpoint} exception:`, error)
      }
    }
    
    if (!workingEndpoint) {
      console.log('❌ No working endpoints found')
      return new Response(
                 JSON.stringify({ 
           success: false,
           error: 'No working iCount API endpoints found',
           endpoints_tried: invoiceEndpointsToTry
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`✅ Using working endpoint: ${workingEndpoint}`)
    console.log('iCount data structure:', JSON.stringify(icountData, null, 2))

    // For now, just return success with endpoint info
    return new Response(
      JSON.stringify({ 
        success: true, 
        working_endpoint: workingEndpoint,
        data_structure: icountData,
        message: `Found working endpoint: ${workingEndpoint}`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Auto sync error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: error
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})