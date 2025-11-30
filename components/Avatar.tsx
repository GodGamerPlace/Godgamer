import React from 'react';
import { Emotion } from '../types';

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
    <div className={`w-64 h-64 relative ${emotion === 'thinking' ? 'animate-pulse' : 'animate-float'}`}>
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
      <div className={`absolute -left-4 top-32 w-12 h-12 rounded-full border-4 border-amber-600 bg-amber-400 transition-all duration-500 ${emotion === 'thinking' ? 'top-20' : ''}`}></div>
      <div className={`absolute -right-4 top-32 w-12 h-12 rounded-full border-4 border-amber-600 bg-amber-400 transition-all duration-500 ${emotion === 'celebrate' ? '-top-10' : ''}`}></div>
    </div>
  );
};

export default Avatar;