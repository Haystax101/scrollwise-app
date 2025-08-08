import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { SupabaseClient, createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

// Improved logging function
function logError(context: string, error: any, additionalInfo?: any) {
  const errorInfo = {
    context,
    timestamp: new Date().toISOString(),
    error: {
      message: error?.message || 'Unknown error',
      name: error?.name || 'UnknownError',
      stack: error?.stack,
    },
    additionalInfo
  };
  console.error('SEARCH_ERROR:', JSON.stringify(errorInfo, null, 2));
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
      const missingVars = [];
      if (!supabaseUrl) missingVars.push('SUPABASE_URL');
      if (!supabaseAnonKey) missingVars.push('SUPABASE_ANON_KEY');
      
      logError('ENV_VALIDATION', new Error('Missing environment variables'), { missingVars });
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error', 
          details: `Missing: ${missingVars.join(', ')}` 
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      logError('REQUEST_PARSING', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const { query, match_threshold = 0.8 } = requestBody;
    console.log('Search request:', { query: query?.substring(0, 100), match_threshold });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    // Handle empty query - return recent content
    if (!query || query.trim() === '') {
      console.log('Empty query, returning recent content');
      try {
        const { data, error } = await supabase
          .from('combined_content')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (error) {
          logError('COMBINED_CONTENT_QUERY', error);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to fetch recent content',
              details: error.message 
            }), 
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            }
          );
        }
        
        console.log(`Returning ${data?.length || 0} recent items`);
        return new Response(JSON.stringify({ results: data || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        logError('RECENT_CONTENT_FETCH', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch recent content',
            details: error.message 
          }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    // Perform keyword-only search (no vector search for now)
    console.log('Performing keyword search...');
    try {
      const { data: keywordResults, error: keywordError } = await supabase.rpc('keyword_search', {
        query_text: query,
        match_count: 20,
      });

      // Check for errors in search results
      if (keywordError) {
        logError('KEYWORD_SEARCH', keywordError, { query });
        throw new Error(`Keyword search failed: ${keywordError.message}`);
      }

      console.log(`Keyword search: ${keywordResults?.length || 0} results`);

      // Return keyword results directly (no vector fusion needed)
      const results = keywordResults || [];
      console.log(`Final results: ${results.length} items`);

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
      
    } catch (error) {
      logError('SEARCH_EXECUTION', error, { query, match_threshold });
      return new Response(
        JSON.stringify({ 
          error: 'Search execution failed',
          details: error.message 
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

  } catch (error) {
    logError('GENERAL_ERROR', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});