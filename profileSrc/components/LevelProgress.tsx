import React from 'react';
const LevelProgress = () => {
  const level = 7;
  const progress = 65; // percentage
  return <div className="bg-gray-900 rounded-lg p-5 mb-6 border border-gray-800">
      <div className="flex justify-between items-center mb-3">
        <div>
          <span className="text-sm text-gray-400">CURRENT LEVEL</span>
          <h2 className="text-2xl font-bold flex items-center">
            <span className="text-yellow-400 mr-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 3V10H21L11 21V14H3L13 3Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            Level {level}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-400">VOLTZ POINTS</span>
          <p className="text-xl font-bold text-yellow-400">3,245</p>
        </div>
      </div>
      {/* Battery progress bar without gridlines */}
      <div className="relative h-10 bg-gray-800 rounded-md overflow-hidden border border-gray-700 flex items-center">
        {/* Battery terminal */}
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 h-6 w-2 bg-gray-600 rounded-r-sm"></div>
        {/* Progress fill - dark to light gradient */}
        <div className="h-full bg-gradient-to-r from-yellow-700 to-yellow-400 flex items-center pl-2" style={{
        width: `${progress}%`
      }}>
          {progress > 15 && <span className="text-xs font-bold text-black">⚡</span>}
        </div>
        {/* Percentage label */}
        <span className="absolute left-1/2 transform -translate-x-1/2 text-xs font-bold text-white">
          {progress}% to Level {level + 1}
        </span>
      </div>
    </div>;
};
export default LevelProgress;