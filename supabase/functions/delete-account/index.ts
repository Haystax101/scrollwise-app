import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the user from the token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    console.log(`Deleting account for user: ${user.id}`)

    // First, delete the user's profile record to avoid foreign key constraint issues
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileDeleteError) {
      console.error('Error deleting profile:', profileDeleteError)
      throw new Error(`Failed to delete profile: ${profileDeleteError.message}`)
    }

    console.log(`Successfully deleted profile for user: ${user.id}`)

    // Then delete the user from auth using the service role key
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

    if (deleteError) {
      throw deleteError
    }

    console.log(`Successfully deleted auth user: ${user.id}`)

    return new Response(
      JSON.stringify({ message: 'Account deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error deleting account:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})