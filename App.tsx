import React, { useState, useEffect, useRef } from 'react';
import { startGame, sendAnswer, sendRealAnswer, undoLastTurn, configureGame } from './services/gemini';
import { playSound, playMusic, stopMusic, toggleMute } from './services/audio';
import { getCurrentSession, updateUserScore, logout } from './services/auth';
import { KNOWLEDGE_BASE } from './constants';
import { GameState, GameResponse, Emotion, User } from './types';
import AuthScreen from './components/AuthScreen';
import OwnerTools from './components/OwnerTools';
import SettingsModal from './components/SettingsModal';
import Avatar from './components/Avatar';
import Modal from './components/Modal';

// --- Main App ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [gameState, setGameState] = useState<GameState>('start');
  const [currentText, setCurrentText] = useState<string>("Think of a food item you ate recently...");
  const [currentThinking, setCurrentThinking] = useState<string>("");
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [emotion, setEmotion] = useState<Emotion>('idle');
  const [confidence, setConfidence] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Input for real answer
  const [realAnswerInput, setRealAnswerInput] = useState("");
  
  // Modals
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showOwnerTools, setShowOwnerTools] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Initial check for session
  useEffect(() => {
    const session = getCurrentSession();
    if (session) {
      setUser(session);
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    playSound('win'); // Welcome sound
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setGameState('start');
    stopMusic();
    setShowSettings(false);
  };

  // Audio Effects trigger on emotion change
  useEffect(() => {
    if (isLoading || !user) return; 
    
    if (emotion === 'celebrate') playSound('win');
    else if (emotion === 'confused') playSound('confused');
    else if (emotion === 'thinking' && gameState === 'playing') playSound('thinking');
    
  }, [emotion, gameState, isLoading, user]);

  // Music State Management
  useEffect(() => {
    if (!user) {
      stopMusic();
      return;
    }
    
    if (gameState === 'start' || gameState === 'error' || gameState === 'reveal' || gameState === 'lost') {
      stopMusic();
    }
    
    if (gameState === 'playing' || gameState === 'won') {
       if (gameState === 'won') {
         stopMusic();
       } else {
         playMusic('gameplay');
       }
    }
    
  }, [gameState, user]);

  const toggleMuteApp = () => {
      const newState = !isMuted;
      setIsMuted(newState);
      toggleMute(newState);
  };

  const handleStart = async () => {
    playSound('click');
    playMusic('gameplay');
    setIsLoading(true);
    setEmotion('thinking');
    setGameState('playing');
    setQuestionCount(0);
    setCurrentThinking("");
    setConfidence(0);
    setShowHint(false);
    setRealAnswerInput("");
    setCurrentOptions([]);
    try {
      const response = await startGame();
      processResponse(response);
    } catch (e) {
      console.error(e);
      setCurrentText("My psychic powers are foggy (API Error). Try again?");
      setGameState('error');
      stopMusic();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    stopMusic();
    playSound('pop');
    setGameState('start');
    setCurrentText("Think of a food item you ate recently...");
    setEmotion('idle');
    setQuestionCount(0);
    setConfidence(0);
    setShowHint(false);
    setRealAnswerInput("");
    setCurrentOptions([]);
    setIsLoading(false);
  };

  const handleAnswer = async (answer: string) => {
    if (isLoading) return;
    playSound('click');
    setIsLoading(true);
    setEmotion('thinking');
    setShowHint(false);

    try {
      const response = await sendAnswer(answer);
      processResponse(response);
    } catch (e) {
      console.error(e);
      setGameState('error');
      stopMusic();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = async () => {
    if (isLoading || questionCount <= 1) return;
    playSound('click');
    setIsLoading(true);
    setEmotion('thinking');
    setShowHint(false);
    
    try {
      const response = await undoLastTurn();
      processResponse(response, true);
    } catch (e) {
      console.error(e);
      setGameState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRealAnswer = async (overrideInput?: string) => {
    const answerToSubmit = overrideInput || realAnswerInput;
    if (!answerToSubmit.trim()) return;
    
    setIsLoading(true);
    playSound('click');
    try {
        const response = await sendRealAnswer(answerToSubmit);
        setCurrentText(response.content);
        setEmotion(response.emotion);
        setGameState('lost'); // Game completely over now
    } catch(e) {
        console.error(e);
        setGameState('error');
    } finally {
        setIsLoading(false);
    }
  };

  const processResponse = (response: GameResponse, isUndo: boolean = false) => {
    setCurrentText(response.content);
    setEmotion(response.emotion);
    setCurrentThinking(response.thinking || "I'm meditating on your food waves...");
    setConfidence(response.confidence || 0);
    setCurrentOptions(response.options || []);
    
    if (response.type === 'question') {
      if (isUndo) {
        setQuestionCount(prev => Math.max(1, prev - 1));
      } else {
        setQuestionCount(prev => prev + 1);
      }
    } else if (response.type === 'guess') {
      setGameState('won'); // 'won' in this context means the AI made a guess, now we verify
      stopMusic(); // Stop gameplay music when guessing
    }
  };

  const handleVerification = (correct: boolean) => {
    if (correct) {
      setEmotion('celebrate');
      setCurrentText("Aha! I knew it! My culinary senses never fail!");
      setGameState('lost'); // Game over (AI won)
      playMusic('win');
      // AI won, user score doesn't increase, but we log the game played
      if (user) {
         updateUserScore(user.username, user.score); 
      }
    } else {
      setEmotion('confused');
      setCurrentText("What?! Impossible! I must have tasted the wrong spiritual curry. What was it actually?");
      playSound('lose');
      setGameState('reveal'); // Move to reveal state
      stopMusic();
      
      // User won, increase score
      if (user) {
         updateUserScore(user.username, user.score + 100); // 100 points for beating AI
         // Update local user state for UI
         setUser(prev => prev ? ({...prev, score: prev.score + 100}) : null);
      }
    }
  };

  const handleScoreClick = () => {
    if (!user) return;
    playSound('pop');
    
    // Owner Override
    if (user.role === 'owner') {
      const newScoreStr = window.prompt(`Owner Override:\nCurrent Score: ${user.score}\nEnter new score:`);
      if (newScoreStr !== null) {
        const newScore = parseInt(newScoreStr);
        if (!isNaN(newScore)) {
          updateUserScore(user.username, newScore);
          setUser(prev => prev ? ({ ...prev, score: newScore }) : null);
        }
      }
    } else {
      setShowLeaderboard(true);
    }
  };

  const getConfidenceColor = (val: number) => {
    if (val < 30) return 'bg-gray-400';
    if (val < 60) return 'bg-yellow-400';
    if (val < 80) return 'bg-orange-400';
    return 'bg-green-500';
  };

  const getOptionButtonColor = (index: number) => {
    const colors = [
      'bg-green-500 hover:bg-green-600',
      'bg-red-500 hover:bg-red-600',
      'bg-blue-500 hover:bg-blue-600',
      'bg-yellow-500 hover:bg-yellow-600',
    ];
    return colors[index % colors.length];
  };

  if (!user) {
    return <AuthScreen onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="h-full w-full bg-gradient-to-b from-orange-100 to-amber-200 flex flex-col items-center justify-center p-2 md:p-4 relative overflow-y-auto overflow-x-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10 z-0">
        <svg width="100%" height="100%">
          <pattern id="pattern-circles" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            <circle cx="25" cy="25" r="10" fill="#f97316" />
          </pattern>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)" />
        </svg>
      </div>

      {/* Top Bar UI */}
      <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20 flex gap-2">
        <button 
          onClick={handleRestart}
          className="bg-white/90 p-2 md:p-3 rounded-full shadow-lg hover:scale-110 transition-transform text-amber-700"
          title="Restart Game"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
        <button 
          onClick={toggleMuteApp}
          className="bg-white/90 p-2 md:p-3 rounded-full shadow-lg hover:scale-110 transition-transform text-amber-700"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
        <button 
          onClick={() => setShowSettings(true)}
          className="bg-white/90 p-2 md:p-3 rounded-full shadow-lg hover:scale-110 transition-transform text-amber-700"
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
             <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.43.872.95 1.113 1.494.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395" />
          </svg>
        </button>
      </div>

      {/* Top Right Stats & Profile */}
      <div className="absolute top-2 right-2 md:top-4 md:right-4 z-20 flex flex-col items-end gap-2">
         {/* Score Badge */}
         <div className="flex gap-2">
            {user.role === 'owner' && (
              <button 
                onClick={() => setShowOwnerTools(true)}
                className="bg-red-600 text-white px-3 py-1 md:px-4 md:py-2 rounded-full shadow-lg hover:bg-red-700 transition-colors font-bold text-xs md:text-sm animate-pulse"
              >
                 👑 ADMIN TOOLS
              </button>
            )}
            <button 
              onClick={handleScoreClick}
              className="bg-white/90 px-3 py-1 md:px-4 md:py-2 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2 text-amber-800 font-bold text-sm md:text-base cursor-pointer"
              title={user.role === 'owner' ? "Click to Edit Score" : "View Leaderboard"}
            >
              ⭐ {user.score} pts
            </button>
         </div>
         {/* User Logout */}
         <div className="flex items-center gap-2 bg-black/10 px-2 py-1 rounded-full">
            <span className="text-xs font-bold text-amber-900">{user.username}</span>
            <button onClick={handleLogout} className="text-xs text-red-700 underline hover:text-red-900 ml-1">Logout</button>
         </div>
      </div>

      <div className="z-10 w-full max-w-xl flex flex-col items-center justify-center min-h-[500px]">
        
        {/* Question Counter & Undo */}
        {gameState === 'playing' && (
          <div className="flex items-center gap-2 mb-4">
             <div className="bg-white/60 backdrop-blur-sm rounded-full px-4 py-1 shadow text-sm font-semibold text-amber-800">
                Question #{questionCount + 1}
             </div>
             {questionCount > 1 && !isLoading && (
                 <button 
                   onClick={handleUndo}
                   className="bg-white/60 backdrop-blur-sm p-1.5 rounded-full shadow text-amber-700 hover:bg-amber-100 transition-colors"
                   title="Undo Last Answer"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                   </svg>
                 </button>
             )}
          </div>
        )}

        {/* Character Area */}
        <div className="mb-4 md:mb-6 transform transition-all duration-500 relative">
          <Avatar emotion={emotion} />
          
           {/* Confidence Bubble */}
           {gameState === 'playing' && (
             <div className="absolute -right-2 md:-right-8 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm px-2 py-1 md:px-3 md:py-2 rounded-lg shadow-lg border border-amber-200 flex flex-col items-center gap-1 animate-float">
                <span className="text-[8px] md:text-[10px] uppercase font-bold text-gray-500 tracking-wider">Certainty</span>
                <div className="text-sm md:text-xl font-bold text-amber-600">{confidence}%</div>
                <div className="w-8 md:w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${getConfidenceColor(confidence)}`} 
                    style={{ width: `${confidence}%` }}
                  ></div>
                </div>
             </div>
           )}
        </div>

        {/* Dialogue Box */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl w-full text-center relative mb-6 border-4 border-amber-300 min-h-[140px] flex items-center justify-center flex-col">
          {/* Triangle pointer */}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[24px] border-b-amber-300"></div>
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[20px] border-b-white"></div>
          
          {isLoading ? (
             <div className="flex space-x-2 justify-center items-center">
               <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce"></div>
               <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce delay-100"></div>
               <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce delay-200"></div>
             </div>
          ) : (
            <>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight">
                {currentText}
              </h2>
              {gameState === 'playing' && (
                <>
                  <p className="text-[10px] md:text-xs text-gray-400 mt-2 absolute bottom-2 right-4 italic">
                    Select an option...
                  </p>
                  
                  {/* Hint Toggle */}
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                    <button 
                      onClick={() => { playSound('click'); setShowHint(!showHint); }}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-[10px] md:text-xs px-2 py-1 md:px-3 rounded-full shadow-sm border border-blue-200 transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.001 6.001 0 00-5.303-7.5c2.105 1.5 5.299 1.5 7.408 0 6.002 6.002 0 015.304 7.5H12z" />
                      </svg>
                      {showHint ? 'Hide Logic' : 'Read My Mind'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Hint Display */}
        {showHint && gameState === 'playing' && !isLoading && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg text-xs md:text-sm italic animate-fade-in w-full text-center">
            Mind Reading: "{currentThinking}"
          </div>
        )}

        {/* Controls */}
        <div className="w-full">
          {gameState === 'start' && (
            <div className="flex flex-col gap-4">
              <button
                onClick={handleStart}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white text-lg md:text-xl font-bold py-3 md:py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? 'Summoning Spirits...' : 'Think of a Food & Start!'}
              </button>
              
              <button 
                onClick={() => { playSound('pop'); setShowKnowledge(true); }}
                className="text-amber-800 text-sm underline hover:text-amber-900 transition-colors"
              >
                What dishes do you know?
              </button>
            </div>
          )}

          {gameState === 'playing' && !isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentOptions && currentOptions.length > 0 ? (
                currentOptions.map((opt, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleAnswer(opt)} 
                    className={`${getOptionButtonColor(idx)} text-white font-bold py-3 md:py-4 px-4 rounded-xl shadow-md transition-transform active:scale-95 text-sm md:text-base leading-tight`}
                  >
                    {opt}
                  </button>
                ))
              ) : (
                /* Fallback if no options are provided by AI */
                <>
                  <button onClick={() => handleAnswer("Yes")} className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-md transition-transform active:scale-95">Yes</button>
                  <button onClick={() => handleAnswer("No")} className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-md transition-transform active:scale-95">No</button>
                </>
              )}
            </div>
          )}

          {gameState === 'won' && (
            <div className="flex flex-col space-y-4">
              <p className="text-center font-bold text-amber-900 mb-2">Did I get it right?</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleVerification(true)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all">Yes, Amazing!</button>
                <button onClick={() => handleVerification(false)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all">No, Wrong!</button>
              </div>
            </div>
          )}

          {gameState === 'reveal' && (
             <div className="flex flex-col space-y-4 items-center w-full">
                <input 
                  type="text" 
                  value={realAnswerInput}
                  onChange={(e) => setRealAnswerInput(e.target.value)}
                  placeholder="e.g., Paneer Butter Masala"
                  className="w-full p-3 md:p-4 rounded-xl border-2 border-amber-300 focus:border-amber-500 focus:outline-none text-lg text-center shadow-inner"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitRealAnswer()}
                />
                <button 
                    onClick={() => handleSubmitRealAnswer()}
                    disabled={!realAnswerInput.trim() || isLoading}
                    className="w-full bg-blue-600 text-white text-lg md:text-xl font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isLoading ? 'Sending...' : 'Tell Chef Genie'}
                </button>
             </div>
          )}

          {(gameState === 'lost' || gameState === 'error') && (
            <button
              onClick={handleRestart}
              className="w-full bg-amber-600 text-white text-xl font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all mt-4"
            >
              Play Again
            </button>
          )}
        </div>
      </div>

      {/* Leaderboard Modal */}
      <Modal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} title="🏆 Profile Status">
        <div className="space-y-4">
           <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                 {user.username.charAt(0).toUpperCase()}
               </div>
               <div>
                  <div className="font-semibold text-gray-700">{user.username}</div>
                  <div className="text-xs text-gray-500">Member since {new Date(user.createdAt).toLocaleDateString()}</div>
               </div>
             </div>
             <div className="text-right">
                <span className="block text-2xl font-bold text-orange-600">{user.score} pts</span>
             </div>
           </div>
           
           <p className="text-center text-xs text-gray-500 mt-4">Your progress is saved in the secure cloud.</p>
        </div>
      </Modal>

      {/* Knowledge Modal */}
      <Modal isOpen={showKnowledge} onClose={() => setShowKnowledge(false)} title="📜 The Menu of Knowledge">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">I specialize in Indian Cuisine but know global vegetarian dishes! Here are some favorites:</p>
          {Object.entries(KNOWLEDGE_BASE).map(([category, items]) => (
            <div key={category} className="mb-3">
              <h4 className="font-bold text-amber-800 text-sm mb-1">{category}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{items.join(', ')}</p>
            </div>
          ))}
        </div>
      </Modal>

      {/* Owner Tools Modal */}
      {showOwnerTools && (
        <OwnerTools isOpen={showOwnerTools} onClose={() => setShowOwnerTools(false)} />
      )}

      {/* Settings Modal */}
      {showSettings && user && (
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
          currentUser={user} 
          onLogout={handleLogout}
        />
      )}

    </div>
  );
};

export default App;