import React, { useState } from 'react';
import { LightbulbIcon, MessageSquareIcon, ThumbsUpIcon, EyeIcon } from 'lucide-react';
const InsightsSection = () => {
  const tabs = [{
    id: 'published',
    label: 'Your Insights'
  }, {
    id: 'interactions',
    label: 'Your Interactions'
  }];
  const [activeTab, setActiveTab] = useState('published');
  const publishedInsights = [{
    id: 1,
    title: 'How AI is transforming productivity tools',
    preview: 'The integration of AI into everyday productivity tools is creating new workflows that...',
    likes: 47,
    comments: 12,
    views: 238,
    date: '2 days ago'
  }, {
    id: 2,
    title: 'The future of remote work collaboration',
    preview: 'As remote work becomes the norm, new collaboration tools are emerging to bridge the gap...',
    likes: 32,
    comments: 8,
    views: 176,
    date: '1 week ago'
  }];
  const interactions = [{
    id: 1,
    author: 'Jamie Williams',
    title: 'Web3 and the creator economy',
    interaction: 'You commented: "Great analysis! I think the tokenization aspect is particularly interesting."',
    date: '3 days ago'
  }, {
    id: 2,
    author: 'Alex Chen',
    title: 'The rise of no-code platforms',
    interaction: 'You liked this insight',
    date: '5 days ago'
  }];
  return <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <LightbulbIcon size={20} className="mr-2 text-yellow-400" />
        Insights
      </h2>
      <div className="flex border-b border-gray-700 mb-4">
        {tabs.map(tab => <button key={tab.id} className={`py-2 px-4 font-medium ${activeTab === tab.id ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>)}
      </div>
      {activeTab === 'published' && <div>
          {publishedInsights.map(insight => <div key={insight.id} className="bg-gray-900 rounded-lg p-4 mb-3 border border-gray-800">
              <h3 className="font-bold mb-2 text-white">{insight.title}</h3>
              <p className="text-gray-400 text-sm mb-3">{insight.preview}</p>
              <div className="flex text-xs text-gray-500 justify-between">
                <div className="flex space-x-3">
                  <span className="flex items-center">
                    <ThumbsUpIcon size={12} className="mr-1" /> {insight.likes}
                  </span>
                  <span className="flex items-center">
                    <MessageSquareIcon size={12} className="mr-1" />{' '}
                    {insight.comments}
                  </span>
                  <span className="flex items-center">
                    <EyeIcon size={12} className="mr-1" /> {insight.views}
                  </span>
                </div>
                <span>{insight.date}</span>
              </div>
            </div>)}
        </div>}
      {activeTab === 'interactions' && <div>
          {interactions.map(interaction => <div key={interaction.id} className="bg-gray-900 rounded-lg p-4 mb-3 border border-gray-800">
              <div className="text-sm text-gray-400 mb-1">
                <span className="font-medium text-white">
                  {interaction.author}
                </span>{' '}
                • {interaction.title}
              </div>
              <p className="mb-2 text-gray-300">{interaction.interaction}</p>
              <div className="text-xs text-gray-500">{interaction.date}</div>
            </div>)}
        </div>}
    </div>;
};
export default InsightsSection;