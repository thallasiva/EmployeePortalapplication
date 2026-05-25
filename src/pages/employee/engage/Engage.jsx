import React, { useState } from 'react';
import { Heart, MessageCircle, Search, ChevronDown } from 'lucide-react';
import { getUserGreetingName } from '../../../lib/dateUtils';

const Engage = () => {
  const greetingName = getUserGreetingName();
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const activities = [
    {
      id: 1,
      company: 'NAT IT SERVICES',
      group: 'Events',
      timestamp: '8 hours ago',
      content: 'Happy Birthday Satyam Mishra , Have a great year ahead!',
      message: 'Happy Birthday, Satyam Mishra!',
      reactions: 0,
      comments: 0,
      avatar: '👤'
    },
    {
      id: 2,
      company: 'NAT IT SERVICES',
      group: 'Events',
      timestamp: '4 day ago',
      content: 'Happy Birthday Battu Praveen Kumar , Have a great year ahead!',
      message: 'Happy Birthday, Battu Praveen Kumar!',
      reactions: 0,
      comments: 0,
      avatar: '👤'
    },
    {
      id: 3,
      company: 'NAT IT SERVICES',
      group: 'Events',
      timestamp: '2 days ago',
      content: 'Happy Birthday celebration',
      reactions: 0,
      comments: 0,
      avatar: '👤'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Greeting */}
      <div className="bg-white border-b p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-xl">👤</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Hey {greetingName},</h1>
              <p className="text-gray-600">Ready to dive in?</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="flex flex-col items-center gap-2 px-4 py-3 border-2 border-pink-300 rounded-lg hover:bg-pink-50">
              <span className="text-2xl">💝</span>
              <span className="text-xs font-medium text-gray-700">Give Kudos</span>
            </button>
            <button className="flex flex-col items-center gap-2 px-4 py-3 border-2 border-brand-200 rounded-lg hover:bg-brand-50">
              <span className="text-2xl">📊</span>
              <span className="text-xs font-medium text-gray-700">Create Polls</span>
            </button>
            <button className="flex flex-col items-center gap-2 px-4 py-3 border-2 border-purple-300 rounded-lg hover:bg-purple-50">
              <span className="text-2xl">📝</span>
              <span className="text-xs font-medium text-gray-700">Create Posts</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 flex gap-6">
        {/* Sidebar - Filters */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Filters</h3>
            
            {/* Activities Filter */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Activities</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="activity"
                    checked={activeFilter === 'all'}
                    onChange={() => setActiveFilter('all')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">All Activities</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="activity"
                    checked={activeFilter === 'kudos'}
                    onChange={() => setActiveFilter('kudos')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Kudos</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="activity"
                    checked={activeFilter === 'polls'}
                    onChange={() => setActiveFilter('polls')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Polls</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="activity"
                    checked={activeFilter === 'posts'}
                    onChange={() => setActiveFilter('posts')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Posts</span>
                </label>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-gray-400"
                />
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Groups Filter */}
            <div className="mb-4">
              <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <span className="font-medium">Groups</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Location Filter */}
            <div className="mb-4">
              <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <span className="font-medium">Location</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Department Filter */}
            <div className="mb-4">
              <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <span className="font-medium">Department</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Activities Feed */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">All Activities - All Groups</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm text-gray-700 bg-white border border-gray-300 rounded px-3 py-1 focus:outline-none"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="popular">Most popular</option>
              </select>
            </div>
          </div>

          {/* Activities List */}
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-white rounded-lg shadow p-6">
                {/* Activity Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                      N
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">NAT IT</h4>
                      <p className="text-xs text-gray-500">SERVICES</p>
                      <p className="text-xs text-gray-600 mt-1">Group: {activity.group}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{activity.timestamp}</span>
                </div>

                {/* Activity Content */}
                <div className="mb-4">
                  <p className="text-gray-700 text-sm mb-2">{activity.content}</p>
                  {activity.message && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                        👤
                      </div>
                      <p className="text-sm text-brand font-medium">{activity.message}</p>
                    </div>
                  )}
                </div>

                {/* Reaction and Comment Section */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                  <button className="flex items-center gap-2 text-gray-600 hover:text-red-500 text-sm">
                    <Heart className="w-4 h-4" />
                    <span>Reaction</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-600 hover:text-brand text-sm">
                    <MessageCircle className="w-4 h-4" />
                    <span>Comment</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Engage;
