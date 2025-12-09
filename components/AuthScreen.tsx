import React, { useState } from 'react';
import { login, signup } from '../services/auth';
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

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-amber-50">
       <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border-4 border-amber-300">
          <div className="text-center mb-6">
             <div className="w-20 h-20 bg-amber-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-inner">
                🧞‍♂️
             </div>
             <h2 className="text-2xl font-bold text-amber-900">
               {isLogin ? 'Welcome Back!' : 'Join the Game'}
             </h2>
             <p className="text-amber-700 text-sm">
               {isLogin ? 'Log in to continue your streak' : 'Create a secure cloud account'}
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-amber-800 uppercase mb-1 ml-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-amber-50 border-2 border-amber-200 rounded-xl focus:border-amber-500 outline-none transition-colors"
                placeholder="Unique Username"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-amber-800 uppercase mb-1 ml-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-amber-50 border-2 border-amber-200 rounded-xl focus:border-amber-500 outline-none transition-colors pr-10"
                  placeholder="Private Password"
                  required
                />
                {password.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-amber-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm text-center font-medium animate-pulse">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
            >
              {isLoading ? 'Connecting to Cloud...' : (isLogin ? 'Enter Game' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-amber-700 underline hover:text-amber-900"
            >
              {isLogin ? "New here? Create Account" : "Already have an account? Login"}
            </button>
          </div>
       </div>
    </div>
  );
};

export default AuthScreen;