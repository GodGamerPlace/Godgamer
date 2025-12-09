import React, { useState } from 'react';
import { User } from '../types';
import { getAllUsers, banUser, getGameCode } from '../services/auth';
import Modal from './Modal';

interface OwnerToolsProps {
  isOpen: boolean;
  onClose: () => void;
}

const OwnerTools: React.FC<OwnerToolsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'files'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>(getAllUsers());
  const [fileList] = useState(getGameCode());

  // Refresh users list
  const refreshUsers = () => {
    setUsers(getAllUsers());
  };

  const handleBanToggle = (username: string, currentStatus: boolean) => {
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'UNBAN' : 'BAN'} ${username}?`)) {
      banUser(username, !currentStatus);
      refreshUsers();
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) && u.role !== 'owner'
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="👑 Owner Control Panel">
      <div className="flex gap-2 mb-4 border-b border-gray-200 pb-2">
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'users' ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          User Management
        </button>
        <button 
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'files' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          System Files
        </button>
      </div>

      <div className="min-h-[300px]">
        {activeTab === 'users' && (
          <div className="animate-fade-in">
             <div className="relative mb-4">
                <input 
                  type="text" 
                  placeholder="Search accounts..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 pl-9 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:border-red-400 outline-none"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </div>

             <div className="space-y-2 max-h-[300px] overflow-y-auto">
               {filteredUsers.length === 0 ? (
                 <p className="text-center text-gray-400 py-4">No users found.</p>
               ) : (
                 filteredUsers.map(user => (
                   <div key={user.username} className={`flex justify-between items-center p-3 rounded-lg border ${user.isBanned ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 shadow-sm'}`}>
                      <div>
                        <div className="font-bold text-gray-800 flex items-center gap-2">
                          {user.username}
                          {user.isBanned && <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded">BANNED</span>}
                        </div>
                        <div className="text-xs text-gray-500">Score: {user.score} | Games: {user.gamesPlayed}</div>
                      </div>
                      <button 
                        onClick={() => handleBanToggle(user.username, user.isBanned)}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${user.isBanned ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                        {user.isBanned ? 'UNBAN' : 'BAN'}
                      </button>
                   </div>
                 ))
               )}
             </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="animate-fade-in">
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-xs text-green-400 shadow-inner h-[300px] overflow-y-auto">
              <div className="mb-2 pb-2 border-b border-slate-700 text-slate-400 flex justify-between">
                 <span>/root/food_akinator/src</span>
                 <span>CLOUD_SYNC_ACTIVE</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                 {fileList.map((file, idx) => (
                   <div key={idx} className="flex items-center gap-2 hover:bg-slate-700 p-1 rounded cursor-pointer group">
                      <span className="text-yellow-500">
                        {file.type === 'data' ? '🗄️' : '📄'}
                      </span>
                      <span className="flex-1 group-hover:underline">{file.name}</span>
                      <span className="text-slate-500">{file.size}</span>
                   </div>
                 ))}
                 <div className="mt-4 pt-4 border-t border-slate-700 text-slate-500">
                    <p>// Secure Cloud Storage v2.1</p>
                    <p>// All user data is encrypted.</p>
                    <button className="mt-2 text-blue-400 hover:text-blue-300 underline" onClick={() => alert("Downloading System Dump...")}>
                      [Download Full System Archive]
                    </button>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OwnerTools;