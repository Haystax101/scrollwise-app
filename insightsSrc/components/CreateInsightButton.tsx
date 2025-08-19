import React, { useState } from 'react';
import { PlusIcon, XIcon } from 'lucide-react';
export function CreateInsightButton() {
  const [showModal, setShowModal] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit the form data
    setShowModal(false);
  };
  return <>
      <div className="fixed bottom-6 inset-x-0 flex justify-center z-10">
        <button onClick={() => setShowModal(true)} className="bg-yellow-500 text-black rounded-full p-4 shadow-lg hover:bg-yellow-400 transition-colors duration-200" aria-label="Create new insight">
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>
      {showModal && <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex justify-between items-center border-b border-gray-700 p-4">
              <h2 className="text-xl font-semibold text-white">
                Create New Insight
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-200">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
                  Title
                </label>
                <input type="text" id="title" className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent" placeholder="Enter insight title" required />
              </div>
              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-1">
                  Content
                </label>
                <textarea id="content" rows={5} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent" placeholder="Share your insight..." required></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-1">
                  Tags (comma separated)
                </label>
                <input type="text" id="tags" className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent" placeholder="leadership, growth, strategy" />
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="mr-2 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-400">
                  Publish
                </button>
              </div>
            </form>
          </div>
        </div>}
    </>;
}