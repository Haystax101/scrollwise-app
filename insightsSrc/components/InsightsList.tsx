import React from 'react';
import { InsightCard } from './InsightCard';
// Mock data for insights
const mockInsights = [{
  id: 1,
  title: 'The Future of Remote Work',
  excerpt: 'How companies are adapting to the new normal and what it means for productivity and work-life balance.',
  publishedDate: '2023-11-10',
  readTime: '5 min read',
  tags: ['remote work', 'productivity', 'future'],
  metrics: {
    views: 1243,
    likes: 89,
    comments: 32,
    reposts: 15,
    saves: 67
  },
  coverImage: 'https://images.unsplash.com/photo-1590402494587-44b71d7772f6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
}, {
  id: 2,
  title: 'Building High-Performance Teams',
  excerpt: 'Strategies for creating cohesive teams that consistently deliver exceptional results in competitive environments.',
  publishedDate: '2023-10-28',
  readTime: '8 min read',
  tags: ['leadership', 'teams', 'performance'],
  metrics: {
    views: 2156,
    likes: 134,
    comments: 47,
    reposts: 28,
    saves: 103
  },
  coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
}, {
  id: 3,
  title: 'Data-Driven Decision Making',
  excerpt: 'How to leverage analytics to make better business decisions and drive growth in uncertain markets.',
  publishedDate: '2023-10-15',
  readTime: '6 min read',
  tags: ['analytics', 'decision making', 'growth'],
  metrics: {
    views: 1879,
    likes: 112,
    comments: 39,
    reposts: 22,
    saves: 94
  },
  coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
}];
export function InsightsList() {
  return <div className="overflow-x-auto -mx-3 px-3">
      <div className="flex space-x-3" style={{
      minWidth: 'min-content'
    }}>
        {mockInsights.map(insight => <div key={insight.id} className="w-56 flex-shrink-0">
            <InsightCard insight={insight} />
          </div>)}
      </div>
    </div>;
}