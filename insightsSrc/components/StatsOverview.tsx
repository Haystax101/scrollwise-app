import React, { useState } from 'react';
import { BookOpenIcon, HeartIcon, MessageCircleIcon, ZapIcon, ChevronDownIcon, ChevronUpIcon, CalendarIcon } from 'lucide-react';
import { ViewsChart } from './charts/ViewsChart';
import { EngagementChart } from './charts/EngagementChart';
import { DemographicsChart } from './charts/DemographicsChart';
export function StatsOverview() {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  return <div className="bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-white">Supercharged Stats</h2>
        <button className="flex items-center text-sm text-yellow-500 font-medium" onClick={() => setShowAnalytics(!showAnalytics)}>
          {showAnalytics ? 'Hide Analytics' : 'See Analytics'}
          {showAnalytics ? <ChevronUpIcon className="ml-1 h-4 w-4" /> : <ChevronDownIcon className="ml-1 h-4 w-4" />}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center p-3 bg-gray-700 rounded-lg shadow-inner">
          <div className="bg-yellow-600 p-2 rounded-full mr-3 shadow-lg shadow-yellow-900/30">
            <BookOpenIcon className="h-5 w-5 text-yellow-300" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Posts</p>
            <p className="text-lg font-bold text-white">24</p>
          </div>
        </div>
        <div className="flex items-center p-3 bg-gray-700 rounded-lg shadow-inner">
          <div className="bg-red-600 p-2 rounded-full mr-3 shadow-lg shadow-red-900/30">
            <HeartIcon className="h-5 w-5 text-red-300" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Likes</p>
            <p className="text-lg font-bold text-white">1.2k</p>
          </div>
        </div>
        <div className="flex items-center p-3 bg-gray-700 rounded-lg shadow-inner">
          <div className="bg-blue-600 p-2 rounded-full mr-3 shadow-lg shadow-blue-900/30">
            <MessageCircleIcon className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Comments</p>
            <p className="text-lg font-bold text-white">342</p>
          </div>
        </div>
        <div className="flex items-center p-3 bg-gray-700 rounded-lg shadow-inner">
          <div className="bg-purple-600 p-2 rounded-full mr-3 shadow-lg shadow-purple-900/30">
            <ZapIcon className="h-5 w-5 text-purple-300" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Voltz Points Earnt</p>
            <p className="text-lg font-bold text-white">4.5k</p>
          </div>
        </div>
      </div>
      {/* Analytics Section */}
      {showAnalytics && <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center space-x-2 bg-gray-700 rounded-lg shadow-sm p-1 mb-4 overflow-x-auto">
            <button className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap ${timeRange === '7d' ? 'bg-yellow-500 text-black' : 'text-gray-300 hover:bg-gray-600'}`} onClick={() => setTimeRange('7d')}>
              7 days
            </button>
            <button className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap ${timeRange === '30d' ? 'bg-yellow-500 text-black' : 'text-gray-300 hover:bg-gray-600'}`} onClick={() => setTimeRange('30d')}>
              30 days
            </button>
            <button className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap ${timeRange === '90d' ? 'bg-yellow-500 text-black' : 'text-gray-300 hover:bg-gray-600'}`} onClick={() => setTimeRange('90d')}>
              90 days
            </button>
            <button className="flex items-center px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-600 rounded-md whitespace-nowrap">
              <CalendarIcon className="w-3 h-3 mr-1" />
              Custom
            </button>
          </div>
          {/* Views Chart */}
          <div className="bg-gray-700 p-3 rounded-lg shadow-sm mb-4">
            <h3 className="text-sm font-medium mb-2 text-white">
              Views Over Time
            </h3>
            <ViewsChart timeRange={timeRange} />
          </div>
          {/* Engagement Chart */}
          <div className="bg-gray-700 p-3 rounded-lg shadow-sm mb-4">
            <h3 className="text-sm font-medium mb-2 text-white">
              Engagement Metrics
            </h3>
            <EngagementChart />
          </div>
          {/* Demographics Chart */}
          <div className="bg-gray-700 p-3 rounded-lg shadow-sm mb-4">
            <h3 className="text-sm font-medium mb-2 text-white">
              Audience Demographics
            </h3>
            <DemographicsChart />
          </div>
          {/* Top Performing Content */}
          <div className="bg-gray-700 p-3 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium mb-2 text-white">
              Top Performing
            </h3>
            <div className="space-y-3">
              <div className="border-b border-gray-600 pb-2">
                <p className="font-medium text-sm text-white">
                  Building High-Performance Teams
                </p>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>2,156 views</span>
                  <span>9.7% engagement</span>
                </div>
              </div>
              <div className="border-b border-gray-600 pb-2">
                <p className="font-medium text-sm text-white">
                  Data-Driven Decision Making
                </p>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1,879 views</span>
                  <span>8.5% engagement</span>
                </div>
              </div>
              <div>
                <p className="font-medium text-sm text-white">
                  The Future of Remote Work
                </p>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1,243 views</span>
                  <span>7.1% engagement</span>
                </div>
              </div>
            </div>
          </div>
        </div>}
    </div>;
}