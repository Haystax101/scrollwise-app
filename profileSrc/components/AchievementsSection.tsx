import React from 'react';
import { TrophyIcon, AwardIcon, ZapIcon, BrainIcon, TargetIcon, StarIcon } from 'lucide-react';
const AchievementsSection = () => {
  const achievements = [{
    id: 1,
    icon: <TrophyIcon size={20} />,
    name: 'First Insight',
    description: 'Published your first insight',
    date: 'Mar 15, 2023'
  }, {
    id: 2,
    icon: <AwardIcon size={20} />,
    name: 'Trending Thinker',
    description: 'Had an insight trend for 24 hours',
    date: 'Apr 2, 2023'
  }, {
    id: 3,
    icon: <ZapIcon size={20} />,
    name: 'Power Streak',
    description: 'Active for 7 days in a row',
    date: 'May 18, 2023'
  }, {
    id: 4,
    icon: <BrainIcon size={20} />,
    name: 'Thought Leader',
    description: 'Received 100+ upvotes on an insight',
    date: 'Jun 5, 2023'
  }, {
    id: 5,
    icon: <TargetIcon size={20} />,
    name: 'Goal Setter',
    description: 'Completed your profile setup',
    date: 'Jun 12, 2023'
  }, {
    id: 6,
    icon: <StarIcon size={20} />,
    name: 'Rising Star',
    description: 'Featured on the weekly digest',
    date: 'Jul 3, 2023'
  }];
  return <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <TrophyIcon size={20} className="mr-2 text-yellow-400" />
        Achievements
      </h2>
      <div className="overflow-x-auto pb-4 hide-scrollbar">
        <div className="flex space-x-3" style={{
        minWidth: 'min-content'
      }}>
          {achievements.map(achievement => <div key={achievement.id} className="bg-gray-900 rounded-lg p-3 flex items-start border border-gray-800" style={{
          minWidth: '240px'
        }}>
              <div className="bg-yellow-400 text-black p-2 rounded-lg mr-3">
                {achievement.icon}
              </div>
              <div>
                <h3 className="font-bold text-white">{achievement.name}</h3>
                <p className="text-sm text-gray-400">
                  {achievement.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">{achievement.date}</p>
              </div>
            </div>)}
        </div>
      </div>
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          height: 4px;
        }
        .hide-scrollbar::-webkit-scrollbar-track {
          background: #1f1f1f;
          border-radius: 10px;
        }
        .hide-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
        .hide-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </div>;
};
export default AchievementsSection;