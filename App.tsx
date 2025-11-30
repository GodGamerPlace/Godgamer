import React, { useState, useEffect } from 'react';
import Avatar from './components/Avatar';
import Modal from './components/Modal';
import { startGame, sendAnswer, sendRealAnswer } from './services/gemini';
import { playSound } from './services/audio';
import { KNOWLEDGE_BASE, SCORES_STORAGE_KEY } from './constants';
import { GameState, GameResponse, Emotion } from './types';

interface Scores {
  user: number;
  ai: number;
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [currentText, setCurrentText] = useState<string>("Think of a food item you ate recently...");
  const [currentThinking, setCurrentThinking] = useState<string>("");
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [emotion, setEmotion] = useState<Emotion>('idle');
  const [confidence, setConfidence] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  
  // Input for real answer
  const [realAnswerInput, setRealAnswerInput] = useState("");
  
  // Modals
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  
  // Scores
  const [scores, setScores] = useState<Scores>({ user: 0, ai: 0 });

  // Load scores on mount
  useEffect(() => {
    const savedScores = localStorage.getItem(SCORES_STORAGE_KEY);
    if (savedScores) {
      try {
        setScores(JSON.parse(savedScores));
      } catch (e) {
        console.error("Failed to load scores", e);
      }
    }
  }, []);

  // Save scores when they change
  useEffect(() => {
    localStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(scores));
  }, [scores]);

  // Audio Effects trigger on emotion change
  useEffect(() => {
    if (isLoading) return; // Don't play while loading/waiting
    
    if (emotion === 'celebrate') playSound('win');
    else if (emotion === 'confused') playSound('confused');
    else if (emotion === 'thinking' && gameState === 'playing') playSound('thinking');
    
  }, [emotion, gameState, isLoading]);

  const handleStart = async () => {
    playSound('click');
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
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
    } finally {
      setIsLoading(false);
    }
  };

  const processResponse = (response: GameResponse) => {
    setCurrentText(response.content);
    setEmotion(response.emotion);
    setCurrentThinking(response.thinking || "I'm meditating on your food waves...");
    setConfidence(response.confidence || 0);
    setCurrentOptions(response.options || []);
    
    if (response.type === 'question') {
      setQuestionCount(prev => prev + 1);
    } else if (response.type === 'guess') {
      setGameState('won'); // 'won' in this context means the AI made a guess, now we verify
    }
  };

  const handleVerification = (correct: boolean) => {
    if (correct) {
      setEmotion('celebrate');
      setCurrentText("Aha! I knew it! My culinary senses never fail!");
      setScores(prev => ({ ...prev, ai: prev.ai + 1 }));
      setGameState('lost'); // Game over (AI won)
    } else {
      setEmotion('confused');
      setCurrentText("What?! Impossible! I must have tasted the wrong spiritual curry. What was it actually?");
      playSound('lose');
      setScores(prev => ({ ...prev, user: prev.user + 1 }));
      setGameState('reveal'); // Move to reveal state
    }
  };

  const handleSubmitRealAnswer = async () => {
    if (!realAnswerInput.trim()) return;
    setIsLoading(true);
    playSound('click');
    try {
        const response = await sendRealAnswer(realAnswerInput);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 to-amber-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
        <svg width="100%" height="100%">
          <pattern id="pattern-circles" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            <circle cx="25" cy="25" r="10" fill="#f97316" />
          </pattern>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)" />
        </svg>
      </div>

      {/* Top Bar UI */}
      <div className="fixed top-4 left-4 z-20 flex gap-2">
        <button 
          onClick={handleRestart}
          className="bg-white/90 p-3 rounded-full shadow-lg hover:scale-110 transition-transform text-amber-700"
          title="Restart Game"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      <div className="fixed top-4 right-4 z-20 flex gap-2">
        <button 
          onClick={() => { playSound('pop'); setShowLeaderboard(true); }}
          className="bg-white/90 px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2 text-amber-800 font-bold"
        >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-yellow-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0V5.625a2.063 2.063 0 00-2.063-2.063h-3.374a2.063 2.063 0 00-2.063 2.063v7.875" />
          </svg>
          {scores.user} - {scores.ai}
        </button>
      </div>

      <div className="z-10 w-full max-w-2xl flex flex-col items-center">
        
        {/* Question Counter (Only when playing) */}
        {gameState === 'playing' && (
          <div className="bg-white/60 backdrop-blur-sm rounded-full px-4 py-1 mb-4 shadow text-sm font-semibold text-amber-800">
            Question #{questionCount + 1}
          </div>
        )}

        {/* Character Area */}
        <div className="mb-8 transform transition-all duration-500 relative">
          <Avatar emotion={emotion} />
          
           {/* Confidence Bubble */}
           {gameState === 'playing' && (
             <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-amber-200 flex flex-col items-center gap-1 animate-float">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Certainty</span>
                <div className="text-xl font-bold text-amber-600">{confidence}%</div>
                <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${getConfidenceColor(confidence)}`} 
                    style={{ width: `${confidence}%` }}
                  ></div>
                </div>
             </div>
           )}
        </div>

        {/* Dialogue Box */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl w-full text-center relative mb-8 border-4 border-amber-300 min-h-[160px] flex items-center justify-center flex-col">
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
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
                {currentText}
              </h2>
              {gameState === 'playing' && (
                <>
                  <p className="text-xs text-gray-400 mt-2 absolute bottom-2 right-4 italic">
                    Select an option...
                  </p>
                  
                  {/* Hint Toggle */}
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                    <button 
                      onClick={() => { playSound('click'); setShowHint(!showHint); }}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs px-3 py-1 rounded-full shadow-sm border border-blue-200 transition-colors flex items-center gap-1"
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
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm italic animate-fade-in w-full text-center">
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
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white text-xl font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentOptions && currentOptions.length > 0 ? (
                currentOptions.map((opt, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleAnswer(opt)} 
                    className={`${getOptionButtonColor(idx)} text-white font-bold py-4 rounded-xl shadow-md transition-transform active:scale-95`}
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
                  className="w-full p-4 rounded-xl border-2 border-amber-300 focus:border-amber-500 focus:outline-none text-lg text-center shadow-inner"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitRealAnswer()}
                />
                <button 
                    onClick={handleSubmitRealAnswer}
                    disabled={!realAnswerInput.trim() || isLoading}
                    className="w-full bg-blue-600 text-white text-xl font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
      <Modal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} title="🏆 Leaderboard">
        <div className="space-y-4">
           <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">You</div>
               <span className="font-semibold text-gray-700">The Challenger</span>
             </div>
             <span className="text-2xl font-bold text-orange-600">{scores.user} pts</span>
           </div>

           <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">AI</div>
               <span className="font-semibold text-gray-700">Chef Genie</span>
             </div>
             <span className="text-2xl font-bold text-red-600">{scores.ai} pts</span>
           </div>

           <p className="text-center text-xs text-gray-500 mt-4">Points are saved automatically in your browser.</p>
        </div>
      </Modal>

      {/* Knowledge Modal */}
      <Modal isOpen={showKnowledge} onClose={() => setShowKnowledge(false)} title="📜 The Menu of Knowledge">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">I specialize in Indian Cuisine. Here are some of the dishes I can detect via my psychic waves:</p>
          {Object.entries(KNOWLEDGE_BASE).map(([category, items]) => (
            <div key={category} className="mb-3">
              <h4 className="font-bold text-amber-800 text-sm mb-1">{category}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{items.join(', ')}</p>
            </div>
          ))}
        </div>
      </Modal>

    </div>
  );
};

export default App;