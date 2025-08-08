import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('GEMINI_EMBEDDING: Starting request processing...');
    
    // Get API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('GEMINI_EMBEDDING: Missing GEMINI_API_KEY environment variable');
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing API key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Extract input text from the request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('GEMINI_EMBEDDING: Failed to parse JSON:', error.message);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { input } = requestBody;
    if (!input) {
      console.error('GEMINI_EMBEDDING: Missing input parameter');
      return new Response(JSON.stringify({ error: 'Missing "input" parameter.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`GEMINI_EMBEDDING: Processing input of length ${input.length}`);

    // Call Gemini embedding API
    try {
      const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';
      
      const response = await fetch(`${geminiUrl}?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: {
            parts: [{ text: input }]
          },
          outputDimensionality: 384, // Match your database vector size
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GEMINI_EMBEDDING: API error:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.embedding || !data.embedding.values) {
        console.error('GEMINI_EMBEDDING: Invalid response format:', data);
        throw new Error('Invalid embedding response format');
      }

      const embedding = data.embedding.values;
      console.log(`GEMINI_EMBEDDING: Generated embedding with ${embedding.length} dimensions`);

      return new Response(JSON.stringify(embedding), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } catch (error) {
      console.error('GEMINI_EMBEDDING: Failed to generate embedding:', error.message);
      return new Response(JSON.stringify({ 
        error: 'Failed to generate embedding',
        details: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

  } catch (error) {
    console.error('GEMINI_EMBEDDING: Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})