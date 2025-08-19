import React from 'react';
import { TrendingUpIcon, ZapIcon } from 'lucide-react';
const Leaderboard = () => {
  const leaderboardData = [{
    id: 1,
    rank: 1,
    name: 'Alex Chen',
    points: 5842,
    industry: 'Technology',
    role: 'CTO',
    company: 'TechFusion',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80'
  }, {
    id: 2,
    rank: 2,
    name: 'Jordan Smith',
    points: 4921,
    industry: 'Finance',
    role: 'Investment Analyst',
    company: 'Capital Growth',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80'
  }, {
    id: 3,
    rank: 3,
    name: 'Taylor Wong',
    points: 4156,
    industry: 'Healthcare',
    role: 'Product Manager',
    company: 'MedInnovate',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80'
  }, {
    id: 4,
    rank: 4,
    name: 'Sarah Johnson',
    points: 3245,
    industry: 'Technology',
    role: 'Senior Product Designer',
    company: 'InnovateTech',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    isCurrentUser: true
  }, {
    id: 5,
    rank: 5,
    name: 'Morgan Lee',
    points: 2987,
    industry: 'Education',
    role: 'Learning Experience Designer',
    company: 'EduSpark',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80'
  }];
  return <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <TrendingUpIcon size={20} className="mr-2 text-yellow-400" />
        Leaderboard
      </h2>
      <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
        {leaderboardData.map(user => <div key={user.id} className={`flex items-center p-3 border-b border-gray-800 ${user.isCurrentUser ? 'bg-gray-800' : ''}`}>
            <div className="w-8 text-center font-bold mr-2">
              {user.rank === 1 && '🥇'}
              {user.rank === 2 && '🥈'}
              {user.rank === 3 && '🥉'}
              {user.rank > 3 && user.rank}
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border border-gray-700">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow">
              <p className="font-medium text-white">
                {user.name}{' '}
                {user.isCurrentUser && <span className="text-xs text-gray-400">(You)</span>}
              </p>
              <p className="text-xs text-gray-400">
                {user.role} at {user.company} • {user.industry}
              </p>
            </div>
            <div className="flex items-center text-yellow-400 font-bold">
              <ZapIcon size={16} className="mr-1" />
              {user.points.toLocaleString()}
            </div>
          </div>)}
      </div>
    </div>;
};
export default Leaderboard;