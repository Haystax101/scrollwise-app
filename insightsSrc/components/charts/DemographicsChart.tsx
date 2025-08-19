import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
// Mock data for professional level
const professionalData = [{
  name: 'Entry Level',
  value: 25
}, {
  name: 'Mid-Level',
  value: 40
}, {
  name: 'Senior Level',
  value: 20
}, {
  name: 'Executive',
  value: 15
}];
// Mock data for age distribution
const ageData = [{
  name: '18-24',
  value: 15
}, {
  name: '25-34',
  value: 35
}, {
  name: '35-44',
  value: 30
}, {
  name: '45-54',
  value: 15
}, {
  name: '55+',
  value: 5
}];
// Mock data for industry
const industryData = [{
  name: 'Technology',
  value: 40
}, {
  name: 'Finance',
  value: 15
}, {
  name: 'Healthcare',
  value: 10
}, {
  name: 'Education',
  value: 15
}, {
  name: 'Other',
  value: 20
}];
const COLORS = ['#EAB308', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];
export function DemographicsChart() {
  const [activeData, setActiveData] = useState('professional');
  const getActiveData = () => {
    switch (activeData) {
      case 'age':
        return ageData;
      case 'industry':
        return industryData;
      default:
        return professionalData;
    }
  };
  return <div>
      <div className="flex space-x-1 mb-3 overflow-x-auto pb-1">
        <button className={`px-3 py-1 text-xs rounded-md whitespace-nowrap ${activeData === 'professional' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`} onClick={() => setActiveData('professional')}>
          Professional
        </button>
        <button className={`px-3 py-1 text-xs rounded-md whitespace-nowrap ${activeData === 'age' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`} onClick={() => setActiveData('age')}>
          Age
        </button>
        <button className={`px-3 py-1 text-xs rounded-md whitespace-nowrap ${activeData === 'industry' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`} onClick={() => setActiveData('industry')}>
          Industry
        </button>
      </div>
      <div className="h-48 flex items-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={getActiveData()} cx="50%" cy="50%" labelLine={false} outerRadius={60} fill="#8884d8" dataKey="value" label={({
            name,
            percent
          }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {getActiveData().map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{
            backgroundColor: '#1F2937',
            borderColor: '#374151',
            color: '#F9FAFB'
          }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>;
}