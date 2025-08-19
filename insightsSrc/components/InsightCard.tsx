import React from 'react';
import { EyeIcon, HeartIcon, MessageCircleIcon, RepeatIcon, BookmarkIcon, MoreVerticalIcon } from 'lucide-react';
interface InsightMetrics {
  views: number;
  likes: number;
  comments: number;
  reposts: number;
  saves: number;
}
interface InsightProps {
  id: number;
  title: string;
  excerpt: string;
  publishedDate: string;
  readTime: string;
  tags: string[];
  metrics: InsightMetrics;
  coverImage: string;
}
export function InsightCard({
  insight
}: {
  insight: InsightProps;
}) {
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };
  return <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-700">
      <div className="relative h-48">
        <img src={insight.coverImage} alt={insight.title} className="w-full h-full object-cover" />
        <div className="absolute top-3 right-3">
          <button className="bg-gray-900 bg-opacity-75 rounded-full p-1.5 shadow-sm hover:bg-gray-800">
            <MoreVerticalIcon className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
          <span>{insight.publishedDate}</span>
          <span>{insight.readTime}</span>
        </div>
        <h3 className="text-lg font-bold mb-2 line-clamp-2 text-white">
          {insight.title}
        </h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-3">
          {insight.excerpt}
        </p>
        <div className="flex flex-wrap gap-1 mb-4">
          {insight.tags.map((tag, index) => <span key={index} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
              {tag}
            </span>)}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <div className="flex items-center space-x-3 text-gray-400 text-xs">
            <div className="flex items-center">
              <EyeIcon className="w-4 h-4 mr-1" />
              <span>{formatNumber(insight.metrics.views)}</span>
            </div>
            <div className="flex items-center">
              <HeartIcon className="w-4 h-4 mr-1" />
              <span>{formatNumber(insight.metrics.likes)}</span>
            </div>
            <div className="flex items-center">
              <MessageCircleIcon className="w-4 h-4 mr-1" />
              <span>{formatNumber(insight.metrics.comments)}</span>
            </div>
          </div>
          <button className="text-yellow-500 text-sm font-medium hover:text-yellow-400">
            Edit
          </button>
        </div>
      </div>
    </div>;
}