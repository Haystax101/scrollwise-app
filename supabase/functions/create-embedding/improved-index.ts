import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('CREATE_EMBEDDING: Starting request processing...');
    
    // Extract input text from the request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('CREATE_EMBEDDING: Failed to parse JSON:', error.message);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { input } = requestBody;
    if (!input) {
      console.error('CREATE_EMBEDDING: Missing input parameter');
      return new Response(JSON.stringify({ error: 'Missing "input" parameter.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`CREATE_EMBEDDING: Processing input of length ${input.length}`);

    // Import the transformers pipeline dynamically to handle loading issues
    let pipeline;
    try {
      const { pipeline: pipelineFunc } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0');
      pipeline = pipelineFunc;
      console.log('CREATE_EMBEDDING: Successfully imported transformers');
    } catch (error) {
      console.error('CREATE_EMBEDDING: Failed to import transformers:', error.message);
      return new Response(JSON.stringify({ error: 'Failed to load embedding model' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Create the feature extraction pipeline
    let extractor;
    try {
      console.log('CREATE_EMBEDDING: Loading embedding model...');
      extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('CREATE_EMBEDDING: Model loaded successfully');
    } catch (error) {
      console.error('CREATE_EMBEDDING: Failed to load model:', error.message);
      return new Response(JSON.stringify({ error: 'Failed to initialize embedding model' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Generate embedding
    let embedding;
    try {
      console.log('CREATE_EMBEDDING: Generating embedding...');
      const output = await extractor(input, {
        pooling: 'mean',
        normalize: true,
      });
      
      embedding = Array.from(output.data);
      console.log(`CREATE_EMBEDDING: Generated embedding with ${embedding.length} dimensions`);
    } catch (error) {
      console.error('CREATE_EMBEDDING: Failed to generate embedding:', error.message);
      return new Response(JSON.stringify({ error: 'Failed to generate embedding' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify(embedding), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('CREATE_EMBEDDING: Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})