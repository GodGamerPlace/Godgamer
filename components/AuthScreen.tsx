import React, { useState } from 'react';
import { login, signup, submitDonation } from '../services/auth';
import { User } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Donation State
  const [donateState, setDonateState] = useState<'idle' | 'option' | 'input' | 'thanks'>('idle');
  const [donateCode, setDonateCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for "Cloud" feel
    setTimeout(() => {
      const result = isLogin ? login(username, password) : signup(username, password);
      
      if (result.success && result.user) {
        onLogin(result.user);
      } else {
        setError(result.message || 'Authentication failed');
      }
      setIsLoading(false);
    }, 800);
  };

  const handleDonateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (donateCode.length < 5) return;
    submitDonation(donateCode);
    setDonateState('thanks');
    setDonateCode('');
    setTimeout(() => {
        setDonateState('idle');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-400 via-amber-300 to-yellow-200">
       {/* Animated Background Elements */}
       <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
       <div className="absolute bottom-20 right-10 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl animate-bounce-slight"></div>
       
       <div className="relative w-full max-w-md p-4">
           {/* Main Glass Card */}
           <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/60 relative z-10 transition-all duration-500 transform hover:scale-[1.01]">
              <div className="text-center mb-8">
                 <div className="w-24 h-24 bg-gradient-to-tr from-amber-500 to-orange-400 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl shadow-lg border-4 border-white transform transition-transform hover:rotate-12">
                    🧞‍♂️
                 </div>
                 <h2 className="text-3xl font-black text-amber-900 tracking-tight">
                   {isLogin ? 'Welcome Back!' : 'Join the Fun'}
                 </h2>
                 <p className="text-amber-700/80 font-medium text-sm mt-1">
                   {isLogin ? 'Enter the culinary realm' : 'Create your secure foodie ID'}
                 </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-800 uppercase ml-3 tracking-wider opacity-70">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-4 bg-white/50 border-2 border-amber-100 rounded-2xl focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-200/50 outline-none transition-all placeholder-amber-300/70 font-semibold text-amber-900"
                    placeholder="MasterChef123"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-800 uppercase ml-3 tracking-wider opacity-70">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-4 bg-white/50 border-2 border-amber-100 rounded-2xl focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-200/50 outline-none transition-all placeholder-amber-300/70 font-semibold text-amber-900 pr-12"
                      placeholder="••••••••"
                      required
                    />
                    {password.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-amber-400 hover:text-amber-600 focus:outline-none transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm text-center font-bold animate-pulse shadow-sm">
                    ⚠️ {error}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-lg py-4 rounded-2xl shadow-[0_10px_20px_-5px_rgba(245,158,11,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(245,158,11,0.5)] transform hover:-translate-y-1 transition-all disabled:opacity-70 disabled:transform-none disabled:shadow-none"
                >
                  {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </span>
                  ) : (isLogin ? 'START GAME' : 'CREATE ACCOUNT')}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button 
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="text-amber-800 font-bold hover:text-orange-600 transition-colors text-sm"
                >
                  {isLogin ? "No account? Create one now!" : "Already a member? Login here"}
                </button>
              </div>
           </div>

           {/* Donate UI - Bottom Center */}
           <div className="absolute -bottom-16 left-0 right-0 flex justify-center z-20 pb-4">
               {donateState === 'idle' && (
                 <button 
                   onClick={() => setDonateState('option')}
                   className="bg-white/90 backdrop-blur-md text-amber-800 px-6 py-2 rounded-full shadow-lg border border-amber-200 font-bold text-sm hover:scale-105 hover:bg-amber-50 transition-all flex items-center gap-2"
                 >
                    <span>🎁</span> Donate to Developer
                 </button>
               )}

               {donateState === 'option' && (
                 <div className="flex flex-col gap-2 items-center animate-fade-in">
                    <button 
                      onClick={() => setDonateState('input')}
                      className="bg-green-600 text-white px-6 py-3 rounded-full shadow-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center gap-2 transform hover:-translate-y-1"
                    >
                        <span className="text-lg">🎫</span> Give a Google Play Code
                    </button>
                    <button 
                      onClick={() => setDonateState('idle')}
                      className="text-amber-800 text-xs hover:underline bg-white/50 px-3 py-1 rounded-full"
                    >
                        Cancel
                    </button>
                 </div>
               )}

               {donateState === 'input' && (
                 <form onSubmit={handleDonateSubmit} className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-green-200 flex flex-col gap-2 w-64 animate-fade-in mb-4">
                    <h4 className="text-center font-bold text-green-800 text-xs uppercase tracking-wide">Enter Code</h4>
                    <input 
                      type="text" 
                      value={donateCode}
                      onChange={(e) => setDonateCode(e.target.value)}
                      placeholder="Paste code here..."
                      className="w-full p-2 border border-green-200 rounded-lg text-sm focus:border-green-500 outline-none font-mono text-center bg-green-50"
                      autoFocus
                    />
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={() => setDonateState('idle')}
                            className="flex-1 bg-gray-100 text-gray-600 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={!donateCode}
                            className="flex-1 bg-green-600 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50"
                        >
                            Submit
                        </button>
                    </div>
                 </form>
               )}

               {donateState === 'thanks' && (
                 <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-xl font-bold text-sm animate-bounce flex items-center gap-2">
                    <span>💖</span> Thank You! <span>💖</span>
                 </div>
               )}
           </div>
       </div>
    </div>
  );
};

export default AuthScreen;