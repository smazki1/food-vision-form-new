import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user with regular client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin via user_roles table (more robust than email allowlist)
    const { data: roleRow, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    if (roleError || !roleRow || roleRow.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { method } = req
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    switch (method) {
      case 'GET': {
        if (action === 'list-users') {
          const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
          if (error) throw error
          return new Response(
            JSON.stringify({ users }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break
      }
      case 'POST': {
        const body = await req.json()
        if (action === 'create-user') {
          const { email, password, userData } = body
          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: userData || {}
          })
          if (error) throw error
          return new Response(
            JSON.stringify({ user: data.user }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        if (action === 'update-user') {
          const { userId, userData } = body
          if (!userId || typeof userId !== 'string') {
            return new Response(
              JSON.stringify({ error: 'Missing or invalid userId' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Pre-check that the user exists
          const { data: existing, error: getErr } = await supabaseAdmin.auth.admin.getUserById(userId)
          if (getErr) {
            return new Response(
              JSON.stringify({ error: getErr.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          if (!existing?.user) {
            return new Response(
              JSON.stringify({ error: 'User not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, userData)
          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          return new Response(
            JSON.stringify({ user: data.user }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break
      }
      case 'DELETE': {
        if (action === 'delete-user') {
          const userId = url.searchParams.get('userId')
          if (!userId) {
            return new Response(
              JSON.stringify({ error: 'Missing userId' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
          if (error) throw error
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin user management error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 