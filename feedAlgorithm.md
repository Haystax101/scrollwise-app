Here are several algorithmic approaches you can use to present your mixed content feed effectively:
Time-Based Algorithms
Reverse Chronological

- Simple newest-first ordering
- Good for: Breaking news, real-time updates
- Downside: Important older content gets buried
  Decaying Time Score
- Weight recent items higher, but don't completely ignore older content
- Formula: score = base_score _ e^(-decay_rate _ hours_old)
- Good balance between freshness and quality
  Content-Type Balancing
  Round Robin with Weights
- Ensure variety: news → book → insight → research → news...
- Assign weights: maybe 40% news, 25% insights, 20% research, 15% books
- Prevents any single content type from dominating
  Cluster Prevention
- Avoid showing 5 news articles in a row
- Insert other content types between similar items
- Maintains engagement through variety
  Engagement-Based Algorithms
  Hot Score (Reddit-style)
- Combines recency with engagement metrics
- score = (upvotes - downvotes) / (time_since_posted + 2)^gravity
- Works well if you have user interaction data
  Trending Detection
- Boost content that's getting unusually high engagement
- Compare recent engagement to historical averages
- Great for surfacing viral or important content
  Personalization Approaches
  Content-Type Preferences
- Learn user preferences: some users love research, others prefer news
- Adjust the content mix based on what they actually read/engage with
  Topic Clustering
- Group related content across types (e.g., "AI" topic includes AI news, AI research papers, AI book recommendations)
- Present topic-based sections or boost related content
  Hybrid Algorithms
  Multi-Signal Ranking Combine multiple factors:
- Recency (30% weight)
- Content type balance (25% weight)
- Quality score (20% weight)
- User preference match (15% weight)
- Source authority (10% weight)
  Machine Learning Approach
- Train on user behavior (clicks, time spent, shares)
- Features: content type, topic, source, time, user history
- More complex but potentially most effective
  Practical Implementation Strategy
  Start simple and evolve:

1. Phase 1: Time-based with content-type balancing
2. Phase 2: Add engagement metrics and quality scores
3. Phase 3: Introduce personalization based on user behavior
4. Phase 4: ML-based ranking if you have enough data
   Additional Considerations
   Visual Hierarchy

- Vary card sizes: feature articles get larger cards
- Use different layouts for different content types
- Break up text-heavy feeds with visual content
  Filtering Options
- Let users filter by content type
- Provide "focus modes" (e.g., "Deep Work" = more books/research, less news)
  Time-of-Day Optimization
- Morning: news and insights
- Afternoon: research and books
- Evening: lighter content
