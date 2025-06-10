import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, entityType, entityId, sessionId, notes, durationMinutes } = await req.json()
    
    console.log('Work time operation:', { action, entityType, entityId })

    if (action === 'start') {
      const { data, error } = await supabaseClient
        .from('work_time_sessions')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          start_time: new Date().toISOString(),
          is_active: true,
          notes: notes || null
        })
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ success: true, data }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    if (action === 'stop') {
      const endTime = new Date()
      
      console.log('Stopping session:', { sessionId, durationMinutes })
      
      const { error: updateError } = await supabaseClient
        .from('work_time_sessions')
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
          is_active: false,
          notes: notes || null
        })
        .eq('id', sessionId)

      if (updateError) throw updateError
      console.log('Session updated successfully with duration:', durationMinutes)

      // Update total work time
      const tableName = entityType === 'client' ? 'clients' : 'leads'
      const idColumn = entityType === 'client' ? 'client_id' : 'lead_id'
      
      const { data: currentTotal } = await supabaseClient
        .from(tableName)
        .select('total_work_time_minutes')
        .eq(idColumn, entityId)
        .single()

      const newTotal = (currentTotal?.total_work_time_minutes || 0) + durationMinutes

      console.log('Updating total work time:', { 
        currentTotal: currentTotal?.total_work_time_minutes || 0, 
        adding: durationMinutes, 
        newTotal 
      })

      const { error: updateTotalError } = await supabaseClient
        .from(tableName)
        .update({ total_work_time_minutes: newTotal })
        .eq(idColumn, entityId)

      if (updateTotalError) throw updateTotalError

      console.log('Total work time updated successfully to:', newTotal)

      return new Response(JSON.stringify({ success: true, newTotal }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
}) 