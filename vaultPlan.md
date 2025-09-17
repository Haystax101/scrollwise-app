# Vault Implementation Plan

## Overview
Transform the current "Discover" page into a "Vault" that organizes content into categorized sections with search functionality and content creation features for Pro users.

## Current State Analysis

### Current Discover Page (`components/Discover.tsx`)
- **Functionality**: Smart search with keyword and vector search
- **Content Display**: Flat list of mixed content types (articles, papers, books)
- **Features**: Industry filtering, Pro upgrade prompts, caching system
- **Search**: Real-time keyword search + Pro vector search
- **UI Elements**: Search bar, industry filter pills, result cards

### Current Saved Content (`components/profile/SavedContentScrollView.tsx`)
- **Location**: Profile page horizontal scroll view
- **Data Sources**: `article_saves`, `paper_saves`, `book_saves` tables
- **Display**: Horizontal scrolling cards with metadata
- **Navigation**: Links to feed with specific content

## New Vault Design Requirements

### 1. Page Structure
```
┌─────────────────────────────────┐
│ Search Bar                      │
├─────────────────────────────────┤
│ Articles Section                │
│ ┌─── ┬─── ┬─── ┬───┐           │
│ │    │    │    │   │ + Create  │
│ └─── ┴─── ┴─── ┴───┘           │
├─────────────────────────────────┤
│ Papers Section                  │
│ ┌─── ┬─── ┬─── ┬───┐           │
│ │    │    │    │   │            │
│ └─── ┴─── ┴─── ┴───┘           │
├─────────────────────────────────┤
│ Books Section                   │
│ ┌─── ┬─── ┬─── ┬───┐           │
│ │    │    │    │   │            │
│ └─── ┴─── ┴─── ┴───┘           │
├─────────────────────────────────┤
│ Saved Content Section          │
│ ┌─── ┬─── ┬─── ┬───┐           │
│ │    │    │    │   │            │
│ └─── ┴─── ┴─── ┴───┘           │
└─────────────────────────────────┘
```

### 2. Content Organization
- **4 Horizontal ScrollViews** in order:
  1. Articles (top)
  2. Papers
  3. Books
  4. Saved Content (bottom)

### 3. Search Functionality
- **Global Search**: Filters all 4 sections based on search term
- **Real-time filtering**: As user types, content in all sections updates
- **Maintained Industry Filtering**: Keep existing industry pills

### 4. Pro User Features
- **Articles Section**: If empty AND user is Pro → "Create Your Own" button
- **Non-Pro Users**: If articles empty → "Upgrade to Pro to Create Your Own"
- **Pro Status Check**: Query `profiles.pro_plan` boolean field

## Implementation Plan

### Phase 1: Data Architecture

#### Data Fetching Strategy
```typescript
interface VaultData {
  articles: SearchResult[];
  papers: SearchResult[];
  books: SearchResult[];
  savedContent: SavedContent[];
}

interface VaultFilters {
  searchQuery: string;
  selectedIndustry: string | null;
}
```

#### Search Integration
```typescript
// Enhance existing search to return categorized results
const performCategorizedSearch = async (query: string, industryId?: string) => {
  const results = await immediateKeywordSearch(query, industryId);

  return {
    articles: results.filter(r => r.type === 'article'),
    papers: results.filter(r => r.type === 'paper'),
    books: results.filter(r => r.type === 'book')
  };
};
```

#### Pro Plan Detection
```typescript
// Extend existing checkProPlan function
const checkUserProStatus = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('pro_plan')
    .eq('id', user.id)
    .single();

  return data?.pro_plan || false;
};
```

### Phase 2: Component Architecture

#### Main Vault Component Structure
```typescript
// components/Vault.tsx
export const Vault: React.FC = () => {
  const [vaultData, setVaultData] = useState<VaultData>();
  const [filters, setFilters] = useState<VaultFilters>();
  const [isProUser, setIsProUser] = useState(false);

  // Search and filtering logic
  // Section rendering
  // Pro user logic
};
```

#### Section Components
```typescript
// components/vault/ContentSection.tsx
interface ContentSectionProps {
  title: string;
  data: SearchResult[];
  loading: boolean;
  emptyState: 'create' | 'upgrade' | 'none';
  onCreatePress?: () => void;
  onUpgradePress?: () => void;
}

// components/vault/SavedContentSection.tsx
// Reuse existing SavedContentScrollView logic but adapt for vault
```

### Phase 3: File Structure Changes

#### New Files to Create
```
components/
├── Vault.tsx                    # Main vault component (replaces Discover.tsx)
├── vault/
│   ├── ContentSection.tsx      # Generic content section
│   ├── SavedContentSection.tsx # Saved content section
│   ├── CreateContentButton.tsx # Pro user create button
│   └── UpgradePrompt.tsx       # Non-pro upgrade button
```

#### Files to Modify
```
app/discover.tsx → app/vault.tsx  # Rename and update import
components/Discover.tsx           # Replace with Vault.tsx logic
Navigation/routing               # Update discover → vault references
```

#### Files to Remove from Profile
```
components/profile/SavedContentScrollView.tsx # Move logic to vault
components/profile/NewProfile.tsx             # Remove saved content section
```

### Phase 4: Implementation Details

#### Search Implementation
```typescript
const handleSearch = useCallback(async (query: string) => {
  if (!query.trim()) {
    // Load default content for each section
    loadDefaultContent();
    return;
  }

  setLoading(true);
  try {
    // Search all content types
    const categorizedResults = await performCategorizedSearch(query, selectedIndustry);

    // Filter saved content by search term
    const filteredSaved = savedContent.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.summary?.toLowerCase().includes(query.toLowerCase())
    );

    setVaultData({
      articles: categorizedResults.articles,
      papers: categorizedResults.papers,
      books: categorizedResults.books,
      savedContent: filteredSaved
    });
  } catch (error) {
    console.error('Vault search error:', error);
  } finally {
    setLoading(false);
  }
}, [selectedIndustry, savedContent]);
```

#### Pro User Create Button
```typescript
const CreateContentButton: React.FC = () => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.createButton}
      onPress={() => router.push('/create-article')}
    >
      <Feather name="plus" size={20} color={colors.primary} />
      <Text style={styles.createText}>Create Your Own</Text>
    </TouchableOpacity>
  );
};
```

#### Content Section Component
```typescript
const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  data,
  loading,
  emptyState,
  onCreatePress,
  onUpgradePress
}) => {
  const renderEmptyState = () => {
    if (loading) return <LoadingSkeleton />;

    switch (emptyState) {
      case 'create':
        return <CreateContentButton onPress={onCreatePress} />;
      case 'upgrade':
        return <UpgradePrompt onPress={onUpgradePress} />;
      default:
        return <EmptyMessage message={`No ${title.toLowerCase()} found`} />;
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {data.length > 0 && (
          <TouchableOpacity onPress={() => navigateToFullSection(title)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {data.length > 0 ? (
        <FlatList
          horizontal
          data={data}
          renderItem={renderContentCard}
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
};
```

### Phase 5: Migration Strategy

#### Step 1: Create Vault Components
1. Create `components/Vault.tsx` with basic structure
2. Create vault subfolder with section components
3. Implement search and filtering logic

#### Step 2: Update Routing
1. Rename `app/discover.tsx` to `app/vault.tsx`
2. Update navigation references
3. Update any deep links or references

#### Step 3: Migrate Saved Content
1. Move `SavedContentScrollView` logic to `vault/SavedContentSection.tsx`
2. Remove saved content section from profile
3. Update navigation to vault for saved content

#### Step 4: Pro Features
1. Implement pro plan checking
2. Add create content functionality
3. Add upgrade prompts for non-pro users

#### Step 5: Testing & Polish
1. Test search functionality across all sections
2. Verify pro/non-pro user experiences
3. Test content creation flows
4. Performance optimization

## Technical Considerations

### Performance
- **Lazy Loading**: Load content sections on demand
- **Caching**: Reuse existing caching from Discover
- **Virtualization**: For large content lists

### Data Management
- **State Management**: Consider using context for vault data
- **Search Debouncing**: Maintain existing 300ms debounce
- **Error Handling**: Graceful fallbacks for failed sections

### Accessibility
- **Screen Reader Support**: Proper section labeling
- **Keyboard Navigation**: Tab support for web
- **Focus Management**: Proper focus handling

### SEO & Deep Linking
- **URL Structure**: `/vault?section=articles&search=term`
- **Share Links**: Direct links to specific content
- **Meta Tags**: Proper page metadata

## Success Metrics

### User Experience
- **Search Usage**: Track search frequency and success rate
- **Content Discovery**: Monitor section engagement
- **Pro Conversion**: Track upgrade button clicks

### Technical Performance
- **Load Times**: Measure section render times
- **Search Speed**: Maintain < 300ms search response
- **Error Rates**: Monitor API failure rates

## User-Generated Content Feature

### Overview
Pro users can create their own content summaries using AI-powered web search and summarization. This feature adds a "My Summaries" section to the vault and requires integration with web search LLM APIs.

### Database Schema
```sql
-- Create user_summaries table
CREATE TABLE public.user_summaries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    summary text NOT NULL,
    longer_summary text,
    source_query text NOT NULL, -- User's original search query
    source_urls text[], -- Array of URLs used for summary
    industry_id uuid REFERENCES public.industries(id),
    is_shared boolean NOT NULL DEFAULT false, -- For future sharing feature
    shared_at timestamp with time zone,
    views_count integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    saves_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.user_summaries ENABLE ROW LEVEL SECURITY;

-- Users can view their own summaries and shared summaries
CREATE POLICY "Users can view accessible summaries" ON public.user_summaries
    FOR SELECT USING (
        auth.uid() = user_id OR is_shared = true
    );

-- Users can insert their own summaries
CREATE POLICY "Users can create summaries" ON public.user_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own summaries
CREATE POLICY "Users can update own summaries" ON public.user_summaries
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own summaries
CREATE POLICY "Users can delete own summaries" ON public.user_summaries
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_user_summaries_user_id ON public.user_summaries(user_id);
CREATE INDEX idx_user_summaries_shared ON public.user_summaries(is_shared) WHERE is_shared = true;
CREATE INDEX idx_user_summaries_industry ON public.user_summaries(industry_id);
CREATE INDEX idx_user_summaries_created_at ON public.user_summaries(created_at DESC);
```

### Web Search LLM API Research & Recommendations

#### Cost Analysis (Per Request)
| Provider | Basic Search | Advanced/Deep | Features | Best For |
|----------|-------------|---------------|----------|----------|
| **Tavily** | $0.008 | $0.016 | AI-optimized results, LLM-ready | **RECOMMENDED** |
| **Brave Search** | $0.003 | $0.003 | Privacy-focused, fast | Budget option |
| **Perplexity** | $0.001/1k tokens | Variable | Real-time web search + LLM | Full solution |
| **SerpAPI** | $0.0003+ | Variable | Reliable, structured data | High volume |

#### Recommendation: Tavily API
**Why Tavily:**
- **LLM-Optimized**: Specifically designed for AI agents and summarization
- **Cost-Effective**: $0.008 per basic search, $0.016 for advanced
- **Free Tier**: 1,000 requests/month for testing
- **Quality**: Returns curated, relevant content perfect for summarization
- **Integration**: Built for LangChain and AI workflows

**Estimated Costs for Pro Users:**
- **Conservative**: 50 summaries/month = $0.40-0.80/month
- **Active User**: 200 summaries/month = $1.60-3.20/month
- **Heavy User**: 500 summaries/month = $4.00-8.00/month

### Content Creation Workflow

#### User Experience Flow
```
1. User clicks "Create Your Own" in Articles section
2. Modal opens with search input: "What would you like to research?"
3. User enters query: "Latest trends in renewable energy 2025"
4. System searches web using Tavily API
5. LLM generates summary and longer_summary
6. User reviews/edits before saving
7. Content appears in "My Summaries" section
```

#### Technical Implementation
```typescript
// services/ContentCreationService.ts
interface ContentCreationRequest {
  query: string;
  industryId?: string;
  userId: string;
}

interface ContentCreationResponse {
  title: string;
  summary: string;
  longer_summary: string;
  source_urls: string[];
}

class ContentCreationService {
  private tavilyApiKey: string;
  private openaiApiKey: string;

  async createUserSummary(request: ContentCreationRequest): Promise<ContentCreationResponse> {
    // 1. Search web using Tavily
    const searchResults = await this.searchWeb(request.query);

    // 2. Generate summaries using OpenAI/Claude
    const summaries = await this.generateSummaries(searchResults, request.query);

    // 3. Save to database
    await this.saveUserSummary({
      ...summaries,
      userId: request.userId,
      sourceQuery: request.query,
      industryId: request.industryId
    });

    return summaries;
  }

  private async searchWeb(query: string) {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.tavilyApiKey
      },
      body: JSON.stringify({
        query,
        search_depth: 'advanced', // $0.016 per request
        include_answer: true,
        include_domains: [],
        exclude_domains: [],
        max_results: 10
      })
    });

    return response.json();
  }

  private async generateSummaries(searchResults: any, originalQuery: string) {
    const prompt = `
    Based on the following web search results about "${originalQuery}", create:
    1. A title (max 100 characters)
    2. A summary (max 300 characters)
    3. A longer_summary (max 1500 characters)

    Search Results:
    ${JSON.stringify(searchResults.results, null, 2)}

    Format as JSON:
    {
      "title": "...",
      "summary": "...",
      "longer_summary": "..."
    }
    `;

    // Use OpenAI/Claude/local LLM to generate summaries
    const response = await this.callLLM(prompt);
    return JSON.parse(response);
  }
}
```

### UI Components

#### Create Content Modal
```typescript
// components/vault/CreateContentModal.tsx
export const CreateContentModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSuccess: (summary: UserSummary) => void;
}> = ({ visible, onClose, onSuccess }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'generating' | 'review'>('input');

  const handleCreate = async () => {
    setLoading(true);
    try {
      const result = await ContentCreationService.createUserSummary({
        query,
        userId: user.id,
        industryId: selectedIndustry
      });
      setStep('review');
    } catch (error) {
      Alert.alert('Error', 'Failed to create summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      {step === 'input' && (
        <CreateContentInput
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleCreate}
          loading={loading}
        />
      )}
      {step === 'generating' && <GeneratingContent />}
      {step === 'review' && (
        <ReviewContent
          onSave={onSuccess}
          onEdit={() => setStep('input')}
        />
      )}
    </Modal>
  );
};
```

#### My Summaries Section
```typescript
// components/vault/MySummariesSection.tsx
export const MySummariesSection: React.FC = () => {
  const [summaries, setSummaries] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserSummaries();
  }, []);

  const fetchUserSummaries = async () => {
    const { data, error } = await supabase
      .from('user_summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setSummaries(data);
    setLoading(false);
  };

  return (
    <ContentSection
      title="My Summaries"
      data={summaries}
      loading={loading}
      emptyState="create"
      renderItem={renderSummaryCard}
      onCreatePress={() => setCreateModalVisible(true)}
    />
  );
};
```

### Vault Layout Update
The vault now has **5 sections** instead of 4:
1. Articles (with Pro create button)
2. Papers
3. Books
4. Saved Content
5. **My Summaries** (new - below saved content)

### Cost Considerations for Pro Pricing

#### API Costs (Monthly)
- **Light User** (25 summaries): ~$0.50/month
- **Regular User** (100 summaries): ~$2.00/month
- **Heavy User** (300 summaries): ~$6.00/month

#### Recommended Pro Tier Pricing
- **Current Pro Features** + **Content Creation**
- **Suggested Price**: $19.99/month (was considering $14.99)
- **API Cost Buffer**: 3-4x markup covers API costs + infrastructure
- **Value Proposition**: "Create unlimited AI summaries from web research"

#### Usage Limits (Optional)
- **Pro Plan**: 200 summaries/month
- **Pro Max Plan**: Unlimited summaries ($29.99/month)

### Future Enhancements

#### Phase 2 Features
- **Content Sharing**: Public user_summaries with social features
- **Collaboration**: Team summaries and shared workspaces
- **Advanced Filtering**: Search across user summaries
- **Export Options**: PDF, Markdown, API access

#### Phase 3 Features
- **AI Recommendations**: Suggest related topics to research
- **Content Analytics**: Track views, engagement on shared summaries
- **Premium LLMs**: GPT-4, Claude for better summaries (higher tier)
- **Batch Processing**: Multiple queries in one request

## Code Snippets

### Main Vault Component Shell
```typescript
// components/Vault.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ContentSection } from './vault/ContentSection';
import { SavedContentSection } from './vault/SavedContentSection';
import { VaultSearchHeader } from './vault/SearchHeader';

export const Vault: React.FC = () => {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [isProUser, setIsProUser] = useState(false);
  const [vaultData, setVaultData] = useState<VaultData>({
    articles: [],
    papers: [],
    books: [],
    savedContent: []
  });

  // Implementation here...

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <VaultSearchHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedIndustry={selectedIndustry}
        onIndustryChange={setSelectedIndustry}
      />

      <ContentSection
        title="Articles"
        data={vaultData.articles}
        emptyState={isProUser ? 'create' : 'upgrade'}
        onCreatePress={() => router.push('/create-article')}
        onUpgradePress={() => router.push('/upgrade')}
      />

      <ContentSection
        title="Papers"
        data={vaultData.papers}
        emptyState="none"
      />

      <ContentSection
        title="Books"
        data={vaultData.books}
        emptyState="none"
      />

      <SavedContentSection data={vaultData.savedContent} />
    </ScrollView>
  );
};
```

This comprehensive plan provides a roadmap for transforming Discover into Vault with all the requested features while maintaining performance and user experience.