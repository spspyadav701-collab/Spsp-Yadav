import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, RefreshCw } from 'lucide-react';
import { AssistantState, AudioMetrics } from '../types/assistant';

interface AiTeacherAvatarProps {
  state: AssistantState;
  audioMetrics: AudioMetrics;
  customAvatarUrl?: string | null;
  onAvatarChange?: (url: string | null) => void;
  onTap?: () => void;
}

export const AiTeacherAvatar: React.FC<AiTeacherAvatarProps> = ({
  state,
  audioMetrics,
  customAvatarUrl,
  onAvatarChange,
  onTap,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [blinkState, setBlinkState] = useState(false);

  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isConnecting = state === 'connecting';
  const isIdle = !isSpeaking && !isListening && !isConnecting;

  // Real-time audio energy coefficients from Web Audio Analyser
  const outputEnergy = isSpeaking ? Math.min(1, audioMetrics.outputVolume * 1.4) : 0;
  const inputEnergy = isListening ? Math.min(1, audioMetrics.inputVolume * 1.1) : 0;

  // Dynamic subtle scale calculated from real voice audio stream (gentle, no excessive zoom)
  const dynamicScale = 1 + (isSpeaking ? outputEnergy * 0.028 : isListening ? inputEnergy * 0.015 : 0);

  const currentAvatarSrc = customAvatarUrl || '/photo.jpg';

  // Natural organic blinking simulation (runs during idle and speaking)
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const triggerBlink = () => {
      setBlinkState(true);
      setTimeout(() => {
        setBlinkState(false);
      }, 140);

      // Random next blink interval between 3.5s and 6.5s
      const nextInterval = 3500 + Math.random() * 3000;
      blinkTimeout = setTimeout(triggerBlink, nextInterval);
    };

    blinkTimeout = setTimeout(triggerBlink, 3000);
    return () => clearTimeout(blinkTimeout);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAvatarChange) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onAvatarChange(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      id="ai-teacher-fullscreen-viewport"
      onClick={onTap}
      className="absolute inset-0 w-full h-full overflow-hidden select-none cursor-pointer"
    >
      {/* 1. Full-Screen Audio-Reactive Motion Container (Smart positioning preserves face & logo) */}
      <motion.div
        className="absolute inset-0 w-full h-full pointer-events-none"
        animate={{
          scale: isSpeaking 
            ? [1 * dynamicScale, 1.018 * dynamicScale, 1 * dynamicScale] 
            : isIdle 
            ? [1, 1.008, 1] 
            : [1, 1.005, 1],
          y: isSpeaking 
            ? [0, -outputEnergy * 4, 0] 
            : isIdle 
            ? [0, -3, 0] 
            : [0, -1.5, 0],
          rotate: isSpeaking 
            ? [outputEnergy * -0.35, outputEnergy * 0.35, outputEnergy * -0.2] 
            : isIdle 
            ? [-0.15, 0.15, -0.15] 
            : 0,
        }}
        transition={{
          scale: {
            repeat: Infinity,
            duration: isSpeaking ? 0.45 : isIdle ? 5 : 3.5,
            ease: 'easeInOut',
          },
          y: {
            repeat: Infinity,
            duration: isSpeaking ? 0.35 : isIdle ? 5 : 3.5,
            ease: 'easeInOut',
          },
          rotate: {
            repeat: Infinity,
            duration: isSpeaking ? 0.5 : isIdle ? 6 : 4,
            ease: 'easeInOut',
          },
        }}
        style={{
          transformOrigin: 'center 25%',
        }}
      >
        {/* Exact User Requested Photo Tag - 100% Edge-to-Edge Full Screen with Smart Positioning */}
        <img
          src={currentAvatarSrc}
          alt="Mithila Academy"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-[center_18%] sm:object-[center_22%] md:object-[center_25%] pointer-events-none transition-all duration-500"
        />

        {/* 2. Natural Blinking Micro-Overlay */}
        <div 
          className={`absolute inset-0 bg-slate-950/20 pointer-events-none transition-opacity duration-75 ${
            blinkState ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* 3. Real-time Audio-Reactive Speaking Warmth / Ambient Aura */}
        {isSpeaking && (
          <div
            className="absolute inset-0 bg-gradient-to-t from-pink-500/15 via-purple-500/08 to-transparent pointer-events-none transition-opacity duration-75"
            style={{ opacity: Math.min(1, outputEnergy * 1.3) }}
          />
        )}
      </motion.div>

      {/* 4. Audio-Reactive Ambient Edge Glow / Aura */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-200"
        style={{
          boxShadow: isSpeaking 
            ? `inset 0 0 ${35 + outputEnergy * 65}px rgba(236, 72, 153, ${0.3 + outputEnergy * 0.4}), inset 0 0 ${70 + outputEnergy * 50}px rgba(139, 92, 246, 0.25)`
            : isListening
            ? `inset 0 0 ${30 + inputEnergy * 35}px rgba(6, 182, 212, ${0.25 + inputEnergy * 0.35})`
            : 'inset 0 0 25px rgba(139, 92, 246, 0.15)',
        }}
      />

      {/* 5. Precision Dark Gradient Overlays (Preserves Face & Logo while giving crystal-clear readability to UI) */}
      {/* Top Header Gradient (Keeps Mithila Academy logo visible underneath) */}
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-slate-950/80 via-slate-950/35 to-transparent pointer-events-none" />

      {/* Middle Face Clear Zone: 100% Brightness and Clarity */}

      {/* Bottom Controls Gradient (Ensures status, waveform, pills and mic are crisp and readable) */}
      <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent pointer-events-none" />

      {/* 6. Floating Photo Customization Tool in Top Right */}
      {onAvatarChange && (
        <div 
          className="absolute top-18 sm:top-20 right-4 z-30 flex items-center gap-1.5 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            id="btn-upload-avatar-photo"
            onClick={() => fileInputRef.current?.click()}
            title="Upload Custom Avatar Photo (e.g. /photo.jpg)"
            className="px-2.5 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-900/80 border border-white/10 text-slate-300 hover:text-cyan-300 backdrop-blur-md transition-all shadow-md flex items-center gap-1.5 text-[11px] font-medium cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Change Photo</span>
          </button>
          {customAvatarUrl && (
            <button
              type="button"
              id="btn-reset-avatar-photo"
              onClick={() => onAvatarChange(null)}
              title="Reset to Default Photo (/photo.jpg)"
              className="p-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-900/80 border border-white/10 text-slate-300 hover:text-pink-300 backdrop-blur-md transition-all shadow-md cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
