import React from 'react';
import { SettingsIcon } from 'lucide-react';
import ProfileHeader from './ProfileHeader';
import LevelProgress from './LevelProgress';
import LearningStats from './LearningStats';
import AchievementsSection from './AchievementsSection';
import Leaderboard from './Leaderboard';
import ProfileCustomization from './ProfileCustomization';
import IndustryInterestSection from './IndustryInterestSection';
import GoalSection from './GoalSection';
const ProfilePage = () => {
  return <div className="max-w-md mx-auto px-4 py-6 relative bg-black min-h-screen">
      <button className="absolute top-6 right-4 text-white hover:text-yellow-400 transition-colors">
        <SettingsIcon size={24} />
      </button>
      <ProfileHeader />
      <LevelProgress />
      <LearningStats />
      <AchievementsSection />
      <Leaderboard />
      <IndustryInterestSection />
      <GoalSection />
      <ProfileCustomization />
    </div>;
};
export default ProfilePage;