import React from 'react';
import { InsightCard } from './InsightCard';
// Mock data for saved insights
const savedInsights = [{
  id: 4,
  title: 'The Psychology of Productivity',
  excerpt: 'Understanding the mental barriers to productivity and how to overcome them for peak performance.',
  publishedDate: '2023-11-05',
  readTime: '7 min read',
  tags: ['psychology', 'productivity', 'mindset'],
  metrics: {
    views: 3421,
    likes: 245,
    comments: 53,
    reposts: 87,
    saves: 176
  },
  coverImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
}, {
  id: 5,
  title: 'Effective Leadership in Crisis',
  excerpt: 'How great leaders navigate through uncertainty and help their teams thrive during challenging times.',
  publishedDate: '2023-10-22',
  readTime: '9 min read',
  tags: ['leadership', 'crisis management', 'resilience'],
  metrics: {
    views: 2876,
    likes: 198,
    comments: 41,
    reposts: 62,
    saves: 143
  },
  coverImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
}, {
  id: 6,
  title: 'The Future of AI in Business',
  excerpt: 'Exploring how artificial intelligence is transforming industries and creating new opportunities for innovation.',
  publishedDate: '2023-11-01',
  readTime: '6 min read',
  tags: ['AI', 'technology', 'innovation'],
  metrics: {
    views: 4132,
    likes: 287,
    comments: 67,
    reposts: 93,
    saves: 211
  },
  coverImage: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
}];
export function SavedInsightsList() {
  return <div className="overflow-x-auto -mx-3 px-3">
      <div className="flex space-x-3" style={{
      minWidth: 'min-content'
    }}>
        {savedInsights.map(insight => <div key={insight.id} className="w-56 flex-shrink-0">
            <InsightCard insight={insight} />
          </div>)}
      </div>
    </div>;
}