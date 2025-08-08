# Frontend Search Implementation Guide

## Overview
This guide provides everything needed to implement search functionality for the Academic Reels platform. The backend provides powerful full-text search across articles, papers, and books using PostgreSQL's tsvector.

## Database Schema Context

### Content Types
Your platform has three main content types:

1. **Articles** (News articles)
   - `id`, `title`, `summary`, `author`, `site_name`, `date`, `link`, `industry_id`
   - Source: RSS feeds from various news sites

2. **Papers** (Academic research papers)  
   - `id`, `title`, `content_simple`, `content_complex`, `authors[]`, `site_name`, `date`, `link`, `industry_id`
   - Source: arXiv and other academic repositories

3. **Books** (Academic/professional books)
   - `id`, `title`, `short_summary`, `key_insights[]`, `author`, `year`, `industry_id`
   - Source: Curated book lists

### Industries
All content is categorized into these industries:
- Finance & Economics
- Politics, Law & International Relations  
- Technology & AI
- Education
- Entrepreneurship & Startups
- Creative Industries & Arts
- Energy, Sustainability & Climate
- Medicine & Healthcare
- Engineering & Automotive

## Search API

### Primary Search Function

**Function:** `search_all_content(search_query, content_limit)`

**Usage:**
```typescript
const { data, error } = await supabase.rpc('search_all_content', {
  search_query: 'artificial intelligence machine learning',
  content_limit: 20
});
```

**Returns:**
```typescript
interface SearchResult {
  content_type: 'article' | 'paper' | 'book';
  id: number;
  title: string;
  snippet: string;          // summary/content_simple/short_summary
  rank: number;             // Relevance score (higher = more relevant)
  created_at: string;       // ISO timestamp
  industry_id: string;      // UUID
}
```

### Search Features

**1. Simple Text Search**
```typescript
// Searches across titles, content, authors, etc.
const results = await supabase.rpc('search_all_content', {
  search_query: 'machine learning',
  content_limit: 10
});
```

**2. Multi-word Search**
```typescript
// Automatically finds content matching any/all terms
const results = await supabase.rpc('search_all_content', {
  search_query: 'artificial intelligence healthcare applications',
  content_limit: 15
});
```

**3. Author Search**
```typescript
// Searches work great for author names
const results = await supabase.rpc('search_all_content', {
  search_query: 'Geoffrey Hinton',
  content_limit: 10
});
```

### Advanced Search Options

For more complex searches, you can query tables directly:

**Boolean Search:**
```typescript
const { data } = await supabase
  .from('articles')
  .select('*')
  .textSearch('search_vector', 'machine & learning & !robot');
```

**Phrase Search:**
```typescript
const { data } = await supabase
  .from('papers')
  .select('*')
  .textSearch('search_vector', '"artificial intelligence"', { type: 'phrase' });
```

**Single Content Type:**
```typescript
// Search only articles
const { data } = await supabase
  .from('articles')
  .select('*')
  .textSearch('search_vector', 'fintech blockchain')
  .order('created_at', { ascending: false });
```

## Search UI Implementation Examples

### Basic Search Component

```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SearchResult {
  content_type: 'article' | 'paper' | 'book';
  id: number;
  title: string;
  snippet: string;
  rank: number;
  created_at: string;
  industry_id: string;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_all_content', {
        search_query: query,
        content_limit: 20
      });
      
      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles, papers, and books..."
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="search-input"
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      <SearchResults results={results} />
    </div>
  );
}
```

### Search Results Component

```typescript
interface SearchResultsProps {
  results: SearchResult[];
}

export function SearchResults({ results }: SearchResultsProps) {
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return '📰';
      case 'paper': return '📄';
      case 'book': return '📚';
      default: return '📄';
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'article': return 'bg-blue-100 text-blue-800';
      case 'paper': return 'bg-green-100 text-green-800';
      case 'book': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (results.length === 0) {
    return (
      <div className="no-results">
        <p>No results found. Try different keywords or check your spelling.</p>
      </div>
    );
  }

  return (
    <div className="search-results">
      <p className="results-count">{results.length} results found</p>
      
      {results.map((result) => (
        <div key={`${result.content_type}-${result.id}`} className="result-item">
          <div className="result-header">
            <span className={`content-type-badge ${getContentTypeColor(result.content_type)}`}>
              {getContentTypeIcon(result.content_type)} {result.content_type}
            </span>
            <span className="relevance-score">
              Relevance: {(result.rank * 100).toFixed(1)}%
            </span>
          </div>
          
          <h3 className="result-title">
            <Link href={`/${result.content_type}/${result.id}`}>
              {result.title}
            </Link>
          </h3>
          
          <p className="result-snippet">{result.snippet}</p>
          
          <div className="result-meta">
            <span className="result-date">
              {new Date(result.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Search with Filters

```typescript
export function AdvancedSearch() {
  const [query, setQuery] = useState('');
  const [contentType, setContentType] = useState<'all' | 'article' | 'paper' | 'book'>('all');
  const [industryId, setIndustryId] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    let searchPromise;

    if (contentType === 'all') {
      // Use unified search
      searchPromise = supabase.rpc('search_all_content', {
        search_query: query,
        content_limit: 20
      });
    } else {
      // Search specific content type
      let table = contentType === 'article' ? 'articles' : 
                  contentType === 'paper' ? 'papers' : 'books';
      
      let queryBuilder = supabase
        .from(table)
        .select('*, content_type:' + `'${contentType}'`)
        .textSearch('search_vector', query);
      
      if (industryId) {
        queryBuilder = queryBuilder.eq('industry_id', industryId);
      }
      
      searchPromise = queryBuilder;
    }

    const { data, error } = await searchPromise;
    if (error) {
      console.error('Search error:', error);
      return;
    }

    setResults(data || []);
  };

  return (
    <div className="advanced-search">
      <div className="search-filters">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
        />
        
        <select 
          value={contentType} 
          onChange={(e) => setContentType(e.target.value as any)}
        >
          <option value="all">All Content</option>
          <option value="article">Articles</option>
          <option value="paper">Papers</option>
          <option value="book">Books</option>
        </select>
        
        <IndustrySelector 
          value={industryId}
          onChange={setIndustryId}
        />
        
        <button onClick={handleSearch}>Search</button>
      </div>
      
      <SearchResults results={results} />
    </div>
  );
}
```

### Search-as-you-type (Debounced)

```typescript
import { useMemo, useState, useEffect } from 'react';
import { debounce } from 'lodash';

export function LiveSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('search_all_content', {
          search_query: searchQuery,
          content_limit: 10
        });
        
        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);

  return (
    <div className="live-search">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search as you type..."
      />
      
      {loading && <div className="search-loading">Searching...</div>}
      
      {results.length > 0 && (
        <div className="live-results">
          {results.map((result) => (
            <div key={`${result.content_type}-${result.id}`} className="live-result-item">
              <span className="content-type">{result.content_type}</span>
              <Link href={`/${result.content_type}/${result.id}`}>
                {result.title}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Search Performance Tips

### 1. Limit Results
Always set a reasonable `content_limit` (10-50) to avoid loading too much data.

### 2. Debounce User Input
For search-as-you-type, debounce by 300-500ms to reduce API calls.

### 3. Cache Results
Consider caching search results for repeated queries:

```typescript
const searchCache = new Map<string, SearchResult[]>();

const cachedSearch = async (query: string) => {
  if (searchCache.has(query)) {
    return searchCache.get(query);
  }
  
  const { data } = await supabase.rpc('search_all_content', {
    search_query: query,
    content_limit: 20
  });
  
  searchCache.set(query, data || []);
  return data || [];
};
```

### 4. Pagination for Large Results
```typescript
const [page, setPage] = useState(0);
const pageSize = 10;

const { data } = await supabase.rpc('search_all_content', {
  search_query: query,
  content_limit: pageSize,
  offset: page * pageSize  // If you modify the function to support offset
});
```

## Error Handling

```typescript
const handleSearch = async (query: string) => {
  try {
    const { data, error } = await supabase.rpc('search_all_content', {
      search_query: query,
      content_limit: 20
    });
    
    if (error) {
      // Handle specific error types
      if (error.code === 'PGRST116') {
        throw new Error('Search function not found. Please check database setup.');
      }
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Search failed:', error);
    
    // Show user-friendly error message
    toast.error('Search temporarily unavailable. Please try again.');
    return [];
  }
};
```

## Styling Examples (Tailwind CSS)

```css
/* Search Input */
.search-input {
  @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

/* Search Results */
.result-item {
  @apply border-b border-gray-200 py-4 hover:bg-gray-50;
}

.result-title {
  @apply text-lg font-semibold text-gray-900 hover:text-blue-600;
}

.result-snippet {
  @apply text-gray-600 mt-2 line-clamp-2;
}

.content-type-badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

/* Loading States */
.search-loading {
  @apply flex items-center justify-center py-8 text-gray-500;
}
```

## Key Features to Implement

### Must Have
- [x] Basic search bar
- [x] Search results display  
- [x] Content type indicators
- [x] Click-through to full content
- [x] Loading states
- [x] Error handling

### Nice to Have
- [ ] Search suggestions/autocomplete
- [ ] Recent searches
- [ ] Search filters (content type, industry, date)
- [ ] Search-as-you-type
- [ ] Search result highlighting
- [ ] Export search results
- [ ] Save searches

### Advanced Features  
- [ ] "More like this" using semantic search
- [ ] Search within specific industries
- [ ] Author-based search
- [ ] Date range filtering
- [ ] Advanced boolean search UI

## Testing Search

### Example Queries to Test
```typescript
// These should return good results:
'machine learning'
'artificial intelligence'
'blockchain cryptocurrency' 
'climate change sustainability'
'healthcare AI'
'fintech banking'
'Geoffrey Hinton'  // Author search
'deep learning neural networks'
```

### Performance Benchmarks
- Search response time: < 200ms for typical queries
- Results relevance: Users should find what they're looking for in top 5 results
- No-results rate: < 10% for reasonable queries

Your search functionality is now ready to implement! The database handles all the heavy lifting, so the frontend just needs to call the API and display results beautifully. 🚀 