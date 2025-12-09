import React, { useState } from 'react';
import { setVolume, getVolume } from '../services/audio';
import { changePassword, deleteAccount } from '../services/auth';
import { User } from '../types';
import Modal from './Modal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onLogout: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
  const [volume, setLocalVolume] = useState(getVolume());
  
  // Change Password State
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  
  // Delete Account State
  const [deletePass, setDeletePass] = useState('');
  const [deleteMsg, setDeleteMsg] = useState('');

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setLocalVolume(val);
    setVolume(val);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    const result = changePassword(currentUser.username, oldPass, newPass);
    setPwdMsg(result.message);
    if (result.success) {
      setOldPass('');
      setNewPass('');
    }
  };

  const handleDeleteAccount = () => {
    if (!window.confirm("Are you SURE? This cannot be undone.")) return;
    
    const result = deleteAccount(currentUser.username, deletePass);
    if (result.success) {
      // Successfully deleted. Call onLogout to reset App state and show AuthScreen.
      onLogout(); 
    } else {
      setDeleteMsg(result.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚙️ Settings">
       <div className="flex gap-2 mb-4 border-b border-amber-200 pb-2">
        <button 
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'general' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          General
        </button>
        <button 
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'security' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          Security
        </button>
      </div>

      <div className="min-h-[250px]">
        {activeTab === 'general' && (
          <div className="space-y-6 py-4 animate-fade-in">
             <div className="flex flex-col items-center gap-4">
                <label className="font-bold text-amber-800 text-lg">Sound Volume</label>
                <div className="h-64 flex items-center justify-center p-4 bg-amber-50 rounded-xl border border-amber-200 shadow-inner">
                   {/* Vertical Slider Wrapper */}
                   <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={volume}
                    onChange={handleVolumeChange}
                    className="h-48 -rotate-90 origin-center appearance-none bg-transparent cursor-pointer [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-amber-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-600"
                    style={{ width: '12rem' }} // Width becomes height due to rotation
                   />
                </div>
                <div className="text-2xl font-bold text-amber-600">{volume}%</div>
             </div>
          </div>
        )}

        {activeTab === 'security' && (
           <div className="space-y-6 animate-fade-in">
              {/* Change Password */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                 <h4 className="font-bold text-gray-700 mb-3">Change Password</h4>
                 <form onSubmit={handlePasswordChange} className="space-y-2">
                    <input 
                      type="password" 
                      placeholder="Current Password"
                      value={oldPass}
                      onChange={(e) => setOldPass(e.target.value)}
                      className="w-full p-2 text-sm border rounded"
                    />
                    <input 
                      type="password" 
                      placeholder="New Password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      className="w-full p-2 text-sm border rounded"
                    />
                    {pwdMsg && <p className={`text-xs font-bold ${pwdMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{pwdMsg}</p>}
                    <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded font-bold text-sm hover:bg-blue-600">Update Password</button>
                 </form>
              </div>

              {/* Delete Account */}
              {currentUser.role !== 'owner' && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                   <h4 className="font-bold text-red-700 mb-3">Delete Account</h4>
                   <div className="space-y-2">
                      <input 
                        type="password" 
                        placeholder="Confirm Password"
                        value={deletePass}
                        onChange={(e) => setDeletePass(e.target.value)}
                        className="w-full p-2 text-sm border border-red-200 rounded"
                      />
                      {deleteMsg && <p className="text-xs font-bold text-red-600">{deleteMsg}</p>}
                      <button 
                        onClick={handleDeleteAccount}
                        className="w-full bg-red-600 text-white py-2 rounded font-bold text-sm hover:bg-red-700"
                      >
                        Permanently Delete
                      </button>
                   </div>
                </div>
              )}
           </div>
        )}
      </div>
    </Modal>
  );
};

export default SettingsModal;