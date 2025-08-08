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
  console.error('PROGRESSIVE_SEARCH_ERROR:', JSON.stringify(errorInfo, null, 2));
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

    const { 
      query, 
      searchType = 'keyword', // 'keyword', 'vector', or 'progressive'
      match_threshold = 0.75, // Good default for semantic similarity
      industry_id = null,
      content_type = null
    } = requestBody;

    console.log('Progressive search request:', { 
      query: query?.substring(0, 100), 
      searchType, 
      match_threshold 
    });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    // Handle empty query - return recent content (top liked in last 30 days, limited to 10)
    if (!query || query.trim() === '') {
      console.log('Empty query, returning top liked content from last 30 days');
      try {
        // Fetch top liked content across tables in the last 30 days, limit 10
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [articles, papers, books] = await Promise.all([
          supabase
            .from('articles')
            .select('id, title, summary, author, site_name, date, industry_id, created_at, likes_count')
            .gte('created_at', thirtyDaysAgo)
            .order('likes_count', { ascending: false })
            .limit(10),
          supabase
            .from('papers')
            .select('id, title, content_simple, authors, site_name, date, industry_id, created_at, likes_count')
            .gte('created_at', thirtyDaysAgo)
            .order('likes_count', { ascending: false })
            .limit(10),
          supabase
            .from('books')
            .select('id, title, short_summary, author, industry_id, created_at, likes_count, year')
            .gte('created_at', thirtyDaysAgo)
            .order('likes_count', { ascending: false })
            .limit(10)
        ]);

        const err = articles.error || papers.error || books.error;
        if (err) throw err;

        // Map to unified shape and merge
        let merged = [
          ...((articles.data || []).map((a: any) => ({
            id: a.id, content_type: 'article', title: a.title, summary: a.summary, authors: a.author ? [a.author] : [],
            site_name: a.site_name, date: a.date, industry_id: a.industry_id, created_at: a.created_at,
            likes_count: a.likes_count
          }))),
          ...((papers.data || []).map((p: any) => ({
            id: p.id, content_type: 'paper', title: p.title, summary: p.content_simple, authors: p.authors,
            site_name: p.site_name, date: p.date, industry_id: p.industry_id, created_at: p.created_at,
            likes_count: p.likes_count
          }))),
          ...((books.data || []).map((b: any) => ({
            id: b.id, content_type: 'book', title: b.title, summary: b.short_summary, authors: b.author ? [b.author] : [],
            site_name: null, date: b.year ? new Date(b.year, 0, 1).toISOString() : null, industry_id: b.industry_id, created_at: b.created_at,
            likes_count: b.likes_count
          })))
        ];

        if (industry_id) {
          merged = merged.filter((r: any) => r.industry_id === industry_id);
        }

        // Sort globally by likes and take top 10
        merged.sort((a: any, b: any) => (b.likes_count || 0) - (a.likes_count || 0));
        const top10 = merged.slice(0, 10);
          
        console.log(`Returning ${top10.length} top liked items`);
        return new Response(JSON.stringify({ 
          results: top10, 
          searchType: 'recent',
          hasMore: false 
        }), {
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

    // KEYWORD SEARCH (fast, for immediate results)
    if (searchType === 'keyword') {
      console.log('Performing keyword-only search...');
      try {
        // Base keyword search call
        let keywordCall = supabase.rpc('keyword_search', {
          query_text: query,
          match_count: 5,
        });

        // Apply filters client-side after RPC by selecting from content tables
        const { data: keywordResultsRaw, error: keywordError } = await keywordCall;

        if (keywordError) {
          logError('KEYWORD_SEARCH', keywordError, { query });
          throw new Error(`Keyword search failed: ${keywordError.message}`);
        }

        // Filter by industry/content type if provided
        let keywordResults = keywordResultsRaw || [];
        if (industry_id) {
          keywordResults = keywordResults.filter((r: any) => r.industry_id === industry_id);
        }
        if (content_type) {
          keywordResults = keywordResults.filter((r: any) => r.content_type === content_type);
        }

        if (keywordError) {
          logError('KEYWORD_SEARCH', keywordError, { query });
          throw new Error(`Keyword search failed: ${keywordError.message}`);
        }

        console.log(`Keyword search: ${keywordResults?.length || 0} results`);

        return new Response(JSON.stringify({ 
          results: keywordResults || [], 
          searchType: 'keyword',
          hasMore: true // Indicate that vector search can provide more results
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
        
      } catch (error) {
        logError('KEYWORD_SEARCH_EXECUTION', error, { query });
        return new Response(
          JSON.stringify({ 
            error: 'Keyword search failed',
            details: error.message 
          }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    // VECTOR SEARCH (slower, for comprehensive results)
    if (searchType === 'vector') {
      console.log('Performing vector search...');
      
      // Generate embedding using Gemini
      let embedding;
      try {
        console.log('Generating embedding for query...');
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

      // Perform vector search
      try {
        const { data: vectorResults, error: vectorError } = await supabase.rpc('vector_search', {
          query_embedding: embedding,
          match_threshold: match_threshold,
          match_count: 20,
        });

        if (vectorError) {
          logError('VECTOR_SEARCH', vectorError, { query, match_threshold });
          throw new Error(`Vector search failed: ${vectorError.message}`);
        }

        console.log(`Vector search: ${vectorResults?.length || 0} results`);

        return new Response(JSON.stringify({ 
          results: vectorResults || [], 
          searchType: 'vector',
          hasMore: false 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
        
      } catch (error) {
        logError('VECTOR_SEARCH_EXECUTION', error, { query, match_threshold });
        return new Response(
          JSON.stringify({ 
            error: 'Vector search failed',
            details: error.message 
          }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    // PROGRESSIVE SEARCH (keyword + vector combined)
    if (searchType === 'progressive') {
      console.log('Performing progressive search (keyword + vector)...');
      
      try {
        // Start both searches in parallel
        const [keywordPromise, embeddingPromise] = await Promise.allSettled([
          // Quick keyword search
          supabase.rpc('keyword_search', {
            query_text: query,
            match_count: 5,
          }),
          // Generate embedding for vector search
          backOff(() => supabase.functions.invoke('create-embedding', {
            body: { input: query }
          }), {
            numOfAttempts: 3,
            startingDelay: 1000,
          })
        ]);

        let keywordResults = [];
        let vectorResults = [];

        // Process keyword results
        if (keywordPromise.status === 'fulfilled' && !keywordPromise.value.error) {
          keywordResults = keywordPromise.value.data || [];
          if (industry_id) keywordResults = keywordResults.filter((r: any) => r.industry_id === industry_id);
          if (content_type) keywordResults = keywordResults.filter((r: any) => r.content_type === content_type);
          console.log(`Keyword search: ${keywordResults.length} results`);
        } else {
          console.warn('Keyword search failed:', keywordPromise);
        }

        // Process vector search if embedding generation succeeded
        if (embeddingPromise.status === 'fulfilled' && !embeddingPromise.value.error) {
          const embedding = embeddingPromise.value.data;
          console.log(`Generated embedding with ${embedding?.length || 0} dimensions`);
          
          const vectorSearchResult = await supabase.rpc('vector_search', {
            query_embedding: embedding,
            match_threshold: match_threshold,
            match_count: 20,
          });

          if (!vectorSearchResult.error) {
            vectorResults = vectorSearchResult.data || [];
            console.log(`Vector search: ${vectorResults.length} results`);
          } else {
            console.warn('Vector search failed:', vectorSearchResult.error);
          }
        } else {
          console.warn('Embedding generation failed:', embeddingPromise);
        }

        // Combine and deduplicate results
        const combinedResults = combineSearchResults(keywordResults, vectorResults);
        console.log(`Combined results: ${combinedResults.length} items`);

        return new Response(JSON.stringify({ 
          results: combinedResults,
          searchType: 'progressive',
          hasMore: false,
          meta: {
            keywordCount: keywordResults.length,
            vectorCount: vectorResults.length,
            totalCount: combinedResults.length
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
        
      } catch (error) {
        logError('PROGRESSIVE_SEARCH_EXECUTION', error, { query, match_threshold });
        return new Response(
          JSON.stringify({ 
            error: 'Progressive search failed',
            details: error.message 
          }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    // Invalid search type
    return new Response(
      JSON.stringify({ 
        error: 'Invalid search type',
        details: `searchType must be 'keyword', 'vector', or 'progressive'` 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );

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

// Combine and deduplicate search results
function combineSearchResults(keywordResults: any[], vectorResults: any[]): any[] {
  const resultMap = new Map();
  
  // Add keyword results first (higher priority for exact matches)
  keywordResults.forEach((result, index) => {
    const key = `${result.content_type}-${result.id}`;
    resultMap.set(key, {
      ...result,
      searchSource: 'keyword',
      combinedScore: result.score || 0,
      keywordRank: index + 1
    });
  });
  
  // Add vector results, merging if already exists
  vectorResults.forEach((result, index) => {
    const key = `${result.content_type}-${result.id}`;
    if (resultMap.has(key)) {
      // Item found in both searches - boost its score
      const existing = resultMap.get(key);
      resultMap.set(key, {
        ...existing,
        searchSource: 'both',
        combinedScore: existing.combinedScore + (result.score || 0),
        vectorRank: index + 1
      });
    } else {
      // New item from vector search
      resultMap.set(key, {
        ...result,
        searchSource: 'vector',
        combinedScore: result.score || 0,
        vectorRank: index + 1
      });
    }
  });
  
  // Sort by combined score and return top 20
  return Array.from(resultMap.values())
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, 20);
}