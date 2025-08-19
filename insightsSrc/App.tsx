import React from 'react';
import { Header } from './components/Header';
import { InsightsList } from './components/InsightsList';
import { CreateInsightButton } from './components/CreateInsightButton';
import { StatsOverview } from './components/StatsOverview';
import { SavedInsightsList } from './components/SavedInsightsList';
import { ReachBoost } from './components/ReachBoost';
export function App() {
  return <div className="bg-gray-900 min-h-screen flex flex-col text-gray-200 max-w-md mx-auto">
      <Header />
      <main className="flex-grow px-3 py-4 pb-24">
        <ReachBoost />
        <StatsOverview />
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-white">My Insights</h2>
            <button className="text-sm text-yellow-500 font-medium">
              See All
            </button>
          </div>
          <InsightsList />
        </div>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-white">Saved Insights</h2>
            <button className="text-sm text-yellow-500 font-medium">
              See All
            </button>
          </div>
          <SavedInsightsList />
        </div>
      </main>
      <CreateInsightButton />
    </div>;
}