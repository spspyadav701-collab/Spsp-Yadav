import React from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Loader2, Volume2, Power } from 'lucide-react';
import { AssistantState } from '../types/assistant';

interface MicButtonProps {
  state: AssistantState;
  onToggle: () => void;
  disabled?: boolean;
}

export const MicButton: React.FC<MicButtonProps> = ({ state, onToggle, disabled }) => {
  const isConnected = state === 'listening' || state === 'speaking';
  const isConnecting = state === 'connecting';
  const isSpeaking = state === 'speaking';

  let buttonGradient = 'from-slate-900/90 via-slate-800/80 to-slate-900/90 border-white/15 text-slate-300';
  let glowBoxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)';
  let outerRingColor = 'border-purple-500/20';

  if (state === 'speaking') {
    buttonGradient = 'from-pink-600/90 via-purple-600/90 to-indigo-600/90 border-pink-400/80 text-white';
    glowBoxShadow = '0 0 35px rgba(236, 72, 153, 0.65), 0 0 70px rgba(168, 85, 247, 0.4)';
    outerRingColor = 'border-pink-500/50 bg-pink-500/20';
  } else if (state === 'listening') {
    buttonGradient = 'from-cyan-600/90 via-blue-600/90 to-indigo-600/90 border-cyan-400/80 text-white';
    glowBoxShadow = '0 0 35px rgba(6, 182, 212, 0.65), 0 0 65px rgba(59, 130, 246, 0.4)';
    outerRingColor = 'border-cyan-500/50 bg-cyan-500/20';
  } else if (state === 'connecting') {
    buttonGradient = 'from-amber-600/90 via-orange-600/90 to-amber-700/90 border-amber-400/80 text-white';
    glowBoxShadow = '0 0 30px rgba(245, 158, 11, 0.55)';
    outerRingColor = 'border-amber-500/40 bg-amber-500/15';
  } else if (state === 'error') {
    buttonGradient = 'from-rose-700/90 via-red-600/90 to-rose-800/90 border-rose-400/80 text-white';
    glowBoxShadow = '0 0 30px rgba(225, 29, 72, 0.55)';
    outerRingColor = 'border-rose-500/40 bg-rose-500/15';
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 select-none">
      {/* Central Interactive Power/Mic Button with Multi-Ring Glass Aura */}
      <div className="relative flex items-center justify-center">
        {/* Animated Outer Pulse Ring during live session */}
        {isConnected && (
          <motion.div
            className={`absolute -inset-3.5 rounded-full border ${outerRingColor} pointer-events-none`}
            animate={{
              scale: [1, 1.22, 1],
              opacity: [0.35, 0.8, 0.35],
            }}
            transition={{
              repeat: Infinity,
              duration: isSpeaking ? 1.2 : 1.8,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Secondary Ripple Ring */}
        {isConnected && (
          <motion.div
            className={`absolute -inset-7 rounded-full border border-dashed opacity-40 pointer-events-none ${
              isSpeaking ? 'border-pink-400/30' : 'border-cyan-400/30'
            }`}
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
              rotate: { repeat: Infinity, duration: 20, ease: 'linear' },
            }}
          />
        )}

        <motion.button
          id="btn-main-mic-power"
          type="button"
          onClick={onToggle}
          disabled={disabled || isConnecting}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          aria-label={isConnected ? 'Tap to stop live voice session' : 'Tap to start live voice session with AI Teacher'}
          style={{ boxShadow: glowBoxShadow }}
          className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr ${buttonGradient} backdrop-blur-xl border-2 flex items-center justify-center cursor-pointer transition-all duration-300 z-10 focus:outline-none focus:ring-4 focus:ring-purple-500/40 active:brightness-110 shadow-2xl`}
        >
          {isConnecting ? (
            <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 animate-spin text-amber-200" />
          ) : isSpeaking ? (
            <Volume2 className="w-8 h-8 sm:w-9 sm:h-9 animate-pulse text-white" />
          ) : isConnected ? (
            <Mic className="w-8 h-8 sm:w-9 sm:h-9 animate-bounce text-white" />
          ) : state === 'error' ? (
            <MicOff className="w-8 h-8 sm:w-9 sm:h-9 text-rose-200" />
          ) : (
            <Power className="w-8 h-8 sm:w-9 sm:h-9 text-slate-200 group-hover:text-white transition-colors" />
          )}
        </motion.button>
      </div>

      {/* Button Subtitle Status */}
      <div className="text-center mt-1">
        <p className="text-xs sm:text-sm font-semibold tracking-wide text-slate-100 drop-shadow-md">
          {isConnected 
            ? (isSpeaking ? 'AI Teacher is Speaking' : 'Listening to You...') 
            : isConnecting 
            ? 'Connecting Live Stream...' 
            : 'Live Voice Session'}
        </p>
        <p className="text-[11px] text-slate-300/85">
          {isConnected ? 'Tap button to stop' : 'Tap to talk with AI Teacher'}
        </p>
      </div>
    </div>
  );
};
