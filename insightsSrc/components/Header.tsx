import React from 'react';
import { BoltIcon, UserIcon } from 'lucide-react';
export function Header() {
  return <header className="bg-black text-white shadow-md border-b border-gray-800 sticky top-0 z-10">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-black rounded-full p-1 mr-2">
            <BoltIcon className="h-6 w-6 text-yellow-400" />
          </div>
          <h1 className="text-lg font-bold">Supercharged</h1>
        </div>
        <button className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800">
          <UserIcon className="h-5 w-5 text-white" />
        </button>
      </div>
    </header>;
}