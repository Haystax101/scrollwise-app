import React from 'react';
import { ClockIcon, PlayCircleIcon, MessageSquareIcon } from 'lucide-react';
const LearningStats = () => {
  const stats = [{
    icon: <ClockIcon size={20} />,
    label: 'Time Spent Learning',
    value: '24h 35m',
    color: 'bg-purple-500'
  }, {
    icon: <PlayCircleIcon size={20} />,
    label: 'Reels Watched',
    value: '128',
    color: 'bg-blue-500'
  }, {
    icon: <MessageSquareIcon size={20} />,
    label: 'Interactions',
    value: '76',
    color: 'bg-green-500'
  }];
  return <div className="bg-gray-900 rounded-lg p-5 mb-8 border border-gray-800">
      <h2 className="text-lg font-bold mb-4 text-gray-200">
        Learning Activity
      </h2>
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => <div key={index} className="flex flex-col items-center">
            <div className={`${stat.color} p-3 rounded-full mb-2`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400 text-center">{stat.label}</p>
          </div>)}
      </div>
    </div>;
};
export default LearningStats;