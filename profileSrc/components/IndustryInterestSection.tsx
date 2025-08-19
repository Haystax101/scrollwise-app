import React from 'react';
import { EditIcon, GlobeIcon, BuildingIcon } from 'lucide-react';
const IndustryInterestSection = () => {
  const industryInterests = [{
    name: 'Technology',
    subIndustries: ['Product Design', 'UX Research', 'UI Development']
  }, {
    name: 'Creative',
    subIndustries: ['Design Systems', 'Visual Design']
  }];
  return <div className="mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <GlobeIcon size={20} className="mr-2 text-yellow-400" />
        Industry Interests
      </h2>
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 relative">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <EditIcon size={16} />
        </button>
        <div className="space-y-4">
          {industryInterests.map((industry, index) => <div key={index} className="border-l-2 border-gray-700 pl-4 py-1">
              <div className="flex items-center mb-2">
                <BuildingIcon size={16} className="mr-2 text-gray-500" />
                <h4 className="font-medium text-white">{industry.name}</h4>
              </div>
              <div className="flex flex-wrap gap-2 ml-1">
                {industry.subIndustries.map((subIndustry, idx) => <span key={idx} className="bg-gray-800 px-3 py-1 rounded-full text-sm border border-gray-700 text-gray-300">
                    {subIndustry}
                  </span>)}
              </div>
            </div>)}
        </div>
      </div>
    </div>;
};
export default IndustryInterestSection;