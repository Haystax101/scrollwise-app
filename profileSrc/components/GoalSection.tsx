import React from 'react';
import { EditIcon, TargetIcon, BriefcaseIcon, BuildingIcon } from 'lucide-react';
const GoalSection = () => {
  const goal = {
    role: 'Design Director',
    company: 'SpaceX',
    timeline: '3-5 years'
  };
  return <div className="mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <TargetIcon size={20} className="mr-2 text-yellow-400" />
        Career Goal
      </h2>
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 relative">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <EditIcon size={16} />
        </button>
        <div className="space-y-3 text-gray-300">
          <p className="flex items-center">
            <BriefcaseIcon size={16} className="mr-2 text-gray-500" />
            Role:{' '}
            <span className="ml-1 text-white font-medium">{goal.role}</span>
          </p>
          <p className="flex items-center">
            <BuildingIcon size={16} className="mr-2 text-gray-500" />
            Company:{' '}
            <span className="ml-1 text-white font-medium">{goal.company}</span>
          </p>
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-500">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Timeline:{' '}
            <span className="ml-1 text-white font-medium">{goal.timeline}</span>
          </p>
        </div>
      </div>
    </div>;
};
export default GoalSection;