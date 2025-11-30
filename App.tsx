import React, { useState, useEffect, useRef } from 'react';
import { startGame, sendAnswer, sendRealAnswer, undoLastTurn } from './services/gemini';
import { playSound } from './services/audio';
import { KNOWLEDGE_BASE, SCORES_STORAGE_KEY } from './constants';
import { GameState, GameResponse, Emotion } from './types';

// --- Components ---

interface AvatarProps {
  emotion: Emotion;
}

const Avatar: React.FC<AvatarProps> = ({ emotion }) => {
  // Simple color mapping based on emotion
  const getBaseColor = () => {
    switch (emotion) {
      case 'happy': return 'fill-yellow-400';
      case 'celebrate': return 'fill-green-400';
      case 'confused': return 'fill-purple-400';
      case 'confident': return 'fill-orange-400';
      default: return 'fill-amber-400';
    }
  };

  const getEyeShape = () => {
    if (emotion === 'happy' || emotion === 'celebrate') {
      return (
        <>
          <path d="M70 90 Q85 80 100 90" stroke="#333" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M140 90 Q155 80 170 90" stroke="#333" strokeWidth="6" fill="none" strokeLinecap="round" />
        </>
      );
    }
    if (emotion === 'confused') {
      return (
        <>
          <circle cx="85" cy="90" r="8" fill="#333" />
          <circle cx="155" cy="85" r="12" fill="#333" />
          <path d="M70 70 L100 75" stroke="#333" strokeWidth="4" strokeLinecap="round" />
          <path d="M140 65 L170 60" stroke="#333" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    }
    if (emotion === 'thinking') {
       return (
        <>
          <circle cx="85" cy="80" r="10" fill="#333" />
          <circle cx="155" cy="80" r="10" fill="#333" />
           <path d="M140 60 L170 50" stroke="#333" strokeWidth="4" strokeLinecap="round" />
        </>
       )
    }
    // Default
    return (
      <>
        <circle cx="85" cy="90" r="10" fill="#333" />
        <circle cx="155" cy="90" r="10" fill="#333" />
        <path d="M70 70 Q85 65 100 70" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5"/>
        <path d="M140 70 Q155 65 170 70" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5"/>
      </>
    );
  };

  const getMouthShape = () => {
    if (emotion === 'happy' || emotion === 'celebrate') {
        return <path d="M90 140 Q120 170 150 140" stroke="#333" strokeWidth="6" fill="none" strokeLinecap="round" />;
    }
    if (emotion === 'thinking') {
        return <circle cx="120" cy="150" r="10" fill="#333" />;
    }
    if (emotion === 'confused') {
        return <path d="M100 150 Q120 140 140 155" stroke="#333" strokeWidth="6" fill="none" strokeLinecap="round" />;
    }
    if (emotion === 'confident') {
        return <path d="M90 150 Q120 150 150 145" stroke="#333" strokeWidth="6" fill="none" strokeLinecap="round" />;
    }
    // Idle
    return <path d="M100 150 Q120 160 140 150" stroke="#333" strokeWidth="6" fill="none" strokeLinecap="round" />;
  };

  const getTurbanColor = () => {
       if (emotion === 'celebrate') return 'fill-red-500';
       return 'fill-red-600';
  }

  return (
    <div className={`w-32 h-32 md:w-56 md:h-56 relative transition-all duration-500 ${emotion === 'thinking' ? 'animate-pulse' : 'animate-float'}`}>
      <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" className="w-full h-full filter drop-shadow-2xl">
        {/* Turban/Hat */}
        <path d="M40 80 Q120 -20 200 80" className={getTurbanColor()} />
        <path d="M40 80 Q120 40 200 80 L200 100 Q120 60 40 100 Z" className="fill-red-700" />
        <circle cx="120" cy="50" r="10" className="fill-yellow-400" />

        {/* Head */}
        <circle cx="120" cy="120" r="80" className={getBaseColor()} />
        
        {/* Ears */}
        <circle cx="40" cy="120" r="15" className={getBaseColor()} />
        <circle cx="200" cy="120" r="15" className={getBaseColor()} />

        {/* Face Elements */}
        {getEyeShape()}
        {getMouthShape()}
        
        {/* Beard (optional, styled for Genie/Chef look) */}
        <path d="M120 200 L110 220 L130 220 Z" fill="#333" />
      </svg>
      
      {/* Hands (Simple circles floating) */}
      <div className={`absolute -left-2 top-20 md:top-28 w-6 h-6 md:w-10 md:h-10 rounded-full border-4 border-amber-600 bg-amber-400 transition-all duration-500 ${emotion === 'thinking' ? 'top-16 md:top-20' : ''}`}></div>
      <div className={`absolute -right-2 top-20 md:top-28 w-6 h-6 md:w-10 md:h-10 rounded-full border-4 border-amber-600 bg-amber-400 transition-all duration-500 ${emotion === 'celebrate' ? '-top-4 md:-top-8' : ''}`}></div>
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all border-4 border-amber-300 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-amber-100 p-4 flex justify-between items-center border-b border-amber-200">
          <h3 className="text-xl font-bold text-amber-900">{title}</h3>
          <button 
            onClick={onClose}
            className="text-amber-700 hover:text-amber-900 hover:bg-amber-200 p-1 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

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

  // Report State to Parent Window (For embedding)
  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'GAME_STATE_UPDATE',
        payload: {
          gameState,
          currentText,
          emotion,
          options: currentOptions,
          questionCount,
          scores
        }
      }, '*');
    }
  }, [gameState, currentText, emotion, currentOptions, questionCount, scores]);

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

  // --- External Control Listeners (Window Messages) ---
  // This allows other websites or parent frames to control the game via postMessage
  // Format: { type: 'CMD_START' } | { type: 'CMD_ANSWER', answer: 'Yes' } etc.
  
  // We use refs to access current state/handlers inside the event listener
  const handlersRef = useRef({
    handleStart,
    handleAnswer,
    handleUndo,
    handleRestart,
    handleSubmitRealAnswer
  });

  // Update refs when handlers change (though they are stable in this component structure usually, this is safer)
  useEffect(() => {
    handlersRef.current = {
      handleStart,
      handleAnswer,
      handleUndo,
      handleRestart,
      handleSubmitRealAnswer
    };
  }, [handleStart, handleAnswer, handleUndo, handleRestart, handleSubmitRealAnswer]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || !data.type) return;

      switch (data.type) {
        case 'CMD_START':
          handlersRef.current.handleStart();
          break;
        case 'CMD_ANSWER':
          if (data.answer) handlersRef.current.handleAnswer(data.answer);
          break;
        case 'CMD_UNDO':
          handlersRef.current.handleUndo();
          break;
        case 'CMD_RESTART':
          handlersRef.current.handleRestart();
          break;
        case 'CMD_REAL_ANSWER':
          if (data.answer) {
             setRealAnswerInput(data.answer);
             handlersRef.current.handleSubmitRealAnswer(data.answer);
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const processResponse = (response: GameResponse, isUndo: boolean = false) => {
    setCurrentText(response.content);
    setEmotion(response.emotion);
    setCurrentThinking(response.thinking || "I'm meditating on your food waves...");
    setConfidence(response.confidence || 0);
    setCurrentOptions(response.options || []);
    
    if (response.type === 'question') {
      // If it's an undo, decrement count (min 1). Else increment.
      if (isUndo) {
        setQuestionCount(prev => Math.max(1, prev - 1));
      } else {
        setQuestionCount(prev => prev + 1);
      }
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
    // Replaced min-h-screen with h-full w-full overflow-y-auto for embedding support
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
      </div>

      <div className="absolute top-2 right-2 md:top-4 md:right-4 z-20 flex gap-2">
        <button 
          onClick={() => { playSound('pop'); setShowLeaderboard(true); }}
          className="bg-white/90 px-3 py-1 md:px-4 md:py-2 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2 text-amber-800 font-bold text-sm md:text-base"
        >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5 text-yellow-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0V5.625a2.063 2.063 0 00-2.063-2.063h-3.374a2.063 2.063 0 00-2.063 2.063v7.875" />
          </svg>
          {scores.user} - {scores.ai}
        </button>
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
          <p className="text-sm text-gray-600 mb-4">I specialize in Indian Cuisine but know global vegetarian dishes! Here are some favorites:</p>
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