import React from 'react';
import { ZapIcon, TrendingUpIcon } from 'lucide-react';
export function ReachBoost() {
  return <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg shadow-lg p-4 mb-6 border border-gray-700">
      <div className="flex items-center mb-3">
        <div className="bg-yellow-500 p-2 rounded-full mr-3">
          <ZapIcon className="h-5 w-5 text-black" />
        </div>
        <h2 className="text-lg font-bold text-white">Voltz Boost</h2>
      </div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-300">Voltz Points Used</p>
        <p className="text-lg font-bold text-white">750</p>
      </div>
      <div className="w-full bg-gray-700 h-2 rounded-full mb-3">
        <div className="bg-yellow-400 h-2 rounded-full" style={{
        width: '75%'
      }}></div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <TrendingUpIcon className="h-4 w-4 text-green-400 mr-1" />
          <span className="text-sm text-green-400 font-medium">
            +143% Reach
          </span>
        </div>
        <p className="text-xs text-gray-400">1,000 points available</p>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-400">
            Your posts reached 15,432 more users this month
          </p>
          <button className="text-xs bg-yellow-500 text-black font-medium px-3 py-1 rounded-full">
            Boost More
          </button>
        </div>
      </div>
    </div>;
}