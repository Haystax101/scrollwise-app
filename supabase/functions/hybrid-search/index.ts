/**
 * Hybrid search: semantic + lexical retrieval, fused with Reciprocal Rank Fusion.
 *
 * Neither retrieval method is sufficient alone. Vector search understands intent
 * ("how do I stop procrastinating" matches an article on habit loops that shares
 * no keywords) but drifts on proper nouns and exact phrases. Keyword search nails
 * those and is useless for paraphrase. So both run, in parallel, and their results
 * are merged.
 *
 * The merge is Reciprocal Rank Fusion (Cormack et al., 2009). Each result scores
 * 1 / (k + rank) in every list it appears in, and those scores are summed:
 *
 *     score(d) = sum over lists L of  1 / (k + rank_L(d))
 *
 * RRF is used here rather than a weighted sum of the raw scores because cosine
 * similarity and ts_rank_cd are not on comparable scales, and normalising them
 * against each other requires tuning that would drift as content changes. RRF
 * only reads *rank*, so it is scale-free and needs no per-corpus calibration.
 * k = 60 is the standard damping constant: it stops any single list's top hit
 * from dominating the fused ordering.
 *
 * A document surfaced by both retrievers therefore outranks one that a single
 * retriever loved, which is the behaviour we want for a discovery feed.
 *
 * Backing SQL: database/search_functions.sql (vector_search, keyword_search).
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { SupabaseClient, createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { backOff } from 'https://esm.sh/exponential-backoff';

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
  console.error('HYBRID_SEARCH_ERROR:', JSON.stringify(errorInfo, null, 2));
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

    // Generate embedding
    console.log('Generating embedding for query...');
    let embedding;
    try {
      const embeddingResponse = await backOff(() => supabase.functions.invoke('create-embedding', {
        body: { input: query }
      }), {
        numOfAttempts: 3,
        startingDelay: 1000,
      });
      
      if (embeddingResponse.error) {
        logError('EMBEDDING_GENERATION', embeddingResponse.error, { query });
        throw embeddingResponse.error;
      }
      
      embedding = embeddingResponse.data;
      console.log(`Generated embedding with ${embedding?.length || 0} dimensions`);
    } catch (error) {
      logError('EMBEDDING_PROCESS', error, { query });
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate embedding',
          details: error.message 
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Perform searches in parallel
    console.log('Performing vector and keyword searches...');
    try {
      const [vectorResults, keywordResults] = await Promise.all([
        supabase.rpc('vector_search', {
          query_embedding: embedding,
          match_threshold: match_threshold,
          match_count: 20,
        }),
        supabase.rpc('keyword_search', {
          query_text: query,
          match_count: 20,
        }),
      ]);

      // Check for errors in search results
      if (vectorResults.error) {
        logError('VECTOR_SEARCH', vectorResults.error, { query, match_threshold });
        throw new Error(`Vector search failed: ${vectorResults.error.message}`);
      }
      
      if (keywordResults.error) {
        logError('KEYWORD_SEARCH', keywordResults.error, { query });
        throw new Error(`Keyword search failed: ${keywordResults.error.message}`);
      }

      console.log(`Vector search: ${vectorResults.data?.length || 0} results`);
      console.log(`Keyword search: ${keywordResults.data?.length || 0} results`);

      // Combine results using reciprocal rank fusion
      const rankedResults = reciprocalRankFusion([
        vectorResults.data || [], 
        keywordResults.data || []
      ]);
      
      const top20Results = rankedResults.slice(0, 20);
      console.log(`Final results: ${top20Results.length} items`);

      return new Response(JSON.stringify({ results: top20Results }), {
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

function reciprocalRankFusion(resultsSets: any[][], k = 60): any[] {
  try {
    const rankedLists = new Map<string, number>();
    
    resultsSets.forEach((set, setIndex) => {
      if (!Array.isArray(set)) {
        console.warn(`ResultSet ${setIndex} is not an array:`, set);
        return;
      }
      
      set.forEach((item, index) => {
        if (!item || !item.id || !item.content_type) {
          console.warn(`Invalid item at ${setIndex}:${index}:`, item);
          return;
        }
        
        // 1 / (k + rank). Rank alone decides the contribution, so the two
        // retrievers' incomparable score scales never have to be reconciled.
        const score = 1 / (k + index + 1);
        const key = `${item.content_type}-${item.id}`;
        rankedLists.set(key, (rankedLists.get(key) || 0) + score);
      });
    });

    const fusedResults = Array.from(rankedLists.entries()).sort((a, b) => b[1] - a[1]);

    const finalResults = fusedResults.map(([key, score]) => {
      const [contentType, id] = key.split('-');
      for (const set of resultsSets) {
        if (!Array.isArray(set)) continue;
        
        const found = set.find(item => 
          item?.content_type === contentType && 
          item?.id?.toString() === id
        );
        
        if (found) {
          return { ...found, score };
        }
      }
      return null;
    }).filter(item => item !== null);

    return finalResults;
  } catch (error) {
    logError('RRF_EXECUTION', error, { resultsSets: resultsSets.map(set => set?.length) });
    return [];
  }
}