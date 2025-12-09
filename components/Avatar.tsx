import React from 'react';
import { Emotion } from '../types';

interface AvatarProps {
  emotion: Emotion;
}

const Avatar: React.FC<AvatarProps> = ({ emotion }) => {
  // Enhanced color mapping
  const getBaseColor = () => {
    switch (emotion) {
      case 'happy': return 'fill-yellow-400';
      case 'celebrate': return 'fill-green-400 transition-colors duration-500';
      case 'confused': return 'fill-purple-400 transition-colors duration-500';
      case 'confident': return 'fill-orange-400 transition-colors duration-500';
      default: return 'fill-amber-400 transition-colors duration-500';
    }
  };

  const getEyeShape = () => {
    if (emotion === 'happy' || emotion === 'celebrate') {
      return (
        <g className="animate-bounce-slight origin-center">
          <path d="M70 90 Q85 80 100 90" stroke="#333" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M140 90 Q155 80 170 90" stroke="#333" strokeWidth="6" fill="none" strokeLinecap="round" />
        </g>
      );
    }
    if (emotion === 'confused') {
      return (
        <g>
          {/* Left eye small */}
          <circle cx="85" cy="90" r="8" fill="#333" className="animate-pulse" />
          {/* Right eye big */}
          <circle cx="155" cy="85" r="14" fill="#333" />
          {/* Eyebrows */}
          <path d="M70 70 L100 75" stroke="#333" strokeWidth="4" strokeLinecap="round" style={{ transform: 'rotate(10deg)', transformOrigin: '85px 72px' }} />
          <path d="M140 65 L170 60" stroke="#333" strokeWidth="4" strokeLinecap="round" style={{ transform: 'translateY(-5px)' }} />
        </g>
      );
    }
    if (emotion === 'thinking') {
       return (
        <g>
          {/* Moving eyes with blinking */}
          <g className="animate-eyes-move">
             <circle cx="85" cy="80" r="10" fill="#333" className="animate-blink" />
             <circle cx="155" cy="80" r="10" fill="#333" className="animate-blink" />
          </g>
           <path d="M140 60 L170 50" stroke="#333" strokeWidth="4" strokeLinecap="round" />
        </g>
       )
    }
    if (emotion === 'confident') {
        return (
            <g>
               {/* Sunglasses look */}
               <path d="M60 85 Q85 85 110 85 L110 100 Q85 110 60 100 Z" fill="#222" />
               <path d="M130 85 Q155 85 180 85 L180 100 Q155 110 130 100 Z" fill="#222" />
               <line x1="110" y1="90" x2="130" y2="90" stroke="#222" strokeWidth="4" />
            </g>
        )
    }
    // Idle/Default
    return (
      <g>
        <circle cx="85" cy="90" r="10" fill="#333" className="animate-blink" />
        <circle cx="155" cy="90" r="10" fill="#333" className="animate-blink" />
        <path d="M70 70 Q85 65 100 70" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5"/>
        <path d="M140 70 Q155 65 170 70" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5"/>
      </g>
    );
  };

  const getMouthShape = () => {
    if (emotion === 'happy' || emotion === 'celebrate') {
        return <path d="M90 140 Q120 170 150 140" stroke="#333" strokeWidth="6" fill="none" strokeLinecap="round" className="transition-all duration-300" />;
    }
    if (emotion === 'thinking') {
        return <circle cx="120" cy="150" r="10" fill="#333" className="transition-all duration-300" />;
    }
    if (emotion === 'confused') {
        return <path d="M100 150 Q120 140 140 155" stroke="#333" strokeWidth="6" fill="none" strokeLinecap="round" className="transition-all duration-300" />;
    }
    if (emotion === 'confident') {
        return <path d="M100 150 Q120 150 140 145" stroke="#333" strokeWidth="6" fill="none" strokeLinecap="round" className="transition-all duration-300" />;
    }
    // Idle
    return <path d="M100 150 Q120 160 140 150" stroke="#333" strokeWidth="6" fill="none" strokeLinecap="round" className="transition-all duration-300" />;
  };

  const getTurbanColor = () => {
       if (emotion === 'celebrate') return 'fill-red-500 animate-pulse';
       return 'fill-red-600 transition-colors duration-500';
  }

  return (
    <div className={`w-32 h-32 md:w-56 md:h-56 relative transition-all duration-500 ${emotion === 'thinking' ? 'animate-float-fast' : 'animate-float'}`}>
      <style>{`
         @keyframes eyes-move {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
         }
         .animate-eyes-move { animation: eyes-move 2s infinite ease-in-out; }
         
         @keyframes blink {
            0%, 45%, 55%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(0.1); }
         }
         .animate-blink { animation: blink 4s infinite; transform-origin: center; transform-box: fill-box; }

         @keyframes bounce-slight {
             0%, 100% { transform: translateY(0); }
             50% { transform: translateY(-3px); }
         }
         .animate-bounce-slight { animation: bounce-slight 0.5s infinite; }

         @keyframes head-tilt {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-3deg); }
            75% { transform: rotate(3deg); }
         }
         .animate-head-tilt { animation: head-tilt 3s infinite ease-in-out; transform-origin: 120px 200px; }
      `}</style>
      <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" className="w-full h-full filter drop-shadow-2xl">
        <g className={emotion === 'thinking' ? 'animate-head-tilt' : ''}>
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
          
          {/* Beard */}
          <path d="M120 200 L110 220 L130 220 Z" fill="#333" />
        </g>
      </svg>
      
      {/* Hands */}
      <div className={`absolute -left-2 top-20 md:top-28 w-6 h-6 md:w-10 md:h-10 rounded-full border-4 border-amber-600 bg-amber-400 transition-all duration-500 ${emotion === 'thinking' ? 'top-16 md:top-20' : ''}`}></div>
      <div className={`absolute -right-2 top-20 md:top-28 w-6 h-6 md:w-10 md:h-10 rounded-full border-4 border-amber-600 bg-amber-400 transition-all duration-500 ${emotion === 'celebrate' ? '-top-4 md:-top-8' : ''}`}></div>
    </div>
  );
};

export default Avatar;