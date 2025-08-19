import React from 'react';
import { EditIcon } from 'lucide-react';
const ProfileHeader = () => {
  return <div className="flex flex-col items-center mb-4 pt-4 relative">
      <button className="absolute top-0 right-0 text-gray-400 hover:text-white">
        <EditIcon size={18} />
      </button>
      <div className="relative">
        <div className="w-28 h-28 rounded-full overflow-hidden mb-4 border-2 border-white shadow-lg">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-center">Sarah Johnson</h1>
      </div>
      <div className="text-center mb-4 w-full max-w-md">
        <p className="text-gray-300">
          Tech enthusiast who loves to build INNOVATIVE solutions
        </p>
      </div>
      <div className="mb-2 w-full max-w-md">
        <div className="bg-gray-900 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-400 mb-1">MY STRONGEST QUALITY</p>
          <p className="text-xl font-bold text-yellow-400">CREATIVITY</p>
        </div>
      </div>
    </div>;
};
export default ProfileHeader;