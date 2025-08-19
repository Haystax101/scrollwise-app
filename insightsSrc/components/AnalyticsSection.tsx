import React, { useState } from 'react';
import { ViewsChart } from './charts/ViewsChart';
import { EngagementChart } from './charts/EngagementChart';
import { DemographicsChart } from './charts/DemographicsChart';
import { CalendarIcon } from 'lucide-react';
export function AnalyticsSection() {
  const [timeRange, setTimeRange] = useState('30d');
  return <div>
      <div className="flex items-center space-x-2 bg-gray-800 rounded-lg shadow-sm p-1 mb-4 overflow-x-auto border border-gray-700">
        <button className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap ${timeRange === '7d' ? 'bg-yellow-500 text-black' : 'text-gray-300 hover:bg-gray-700'}`} onClick={() => setTimeRange('7d')}>
          7 days
        </button>
        <button className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap ${timeRange === '30d' ? 'bg-yellow-500 text-black' : 'text-gray-300 hover:bg-gray-700'}`} onClick={() => setTimeRange('30d')}>
          30 days
        </button>
        <button className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap ${timeRange === '90d' ? 'bg-yellow-500 text-black' : 'text-gray-300 hover:bg-gray-700'}`} onClick={() => setTimeRange('90d')}>
          90 days
        </button>
        <button className="flex items-center px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 rounded-md whitespace-nowrap">
          <CalendarIcon className="w-3 h-3 mr-1" />
          Custom
        </button>
      </div>
      {/* Views Chart */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-sm mb-4 border border-gray-700">
        <h3 className="text-sm font-medium mb-3 text-white">Views Over Time</h3>
        <ViewsChart timeRange={timeRange} />
      </div>
      {/* Engagement Chart */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-sm mb-4 border border-gray-700">
        <h3 className="text-sm font-medium mb-3 text-white">
          Engagement Metrics
        </h3>
        <EngagementChart />
      </div>
      {/* Demographics Chart */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-sm mb-4 border border-gray-700">
        <h3 className="text-sm font-medium mb-3 text-white">
          Audience Demographics
        </h3>
        <DemographicsChart />
      </div>
      {/* Top Performing Content - Simplified for mobile */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700">
        <h3 className="text-sm font-medium mb-3 text-white">Top Performing</h3>
        <div className="space-y-3">
          <div className="border-b border-gray-700 pb-2">
            <p className="font-medium text-sm text-white">
              Building High-Performance Teams
            </p>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>2,156 views</span>
              <span>9.7% engagement</span>
            </div>
          </div>
          <div className="border-b border-gray-700 pb-2">
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
    </div>;
}