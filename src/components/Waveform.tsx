import React, { useEffect, useRef } from 'react';
import { AssistantState, AudioMetrics } from '../types/assistant';

interface WaveformProps {
  state: AssistantState;
  audioMetrics: AudioMetrics;
}

export const Waveform: React.FC<WaveformProps> = ({ state, audioMetrics }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isActive = isSpeaking || isListening;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 26;
      const barWidth = 3;
      const spacing = Math.floor((width - barCount * barWidth) / (barCount - 1));

      const freq = audioMetrics.frequencyData;
      const energy = isSpeaking 
        ? audioMetrics.outputVolume 
        : isListening 
        ? audioMetrics.inputVolume 
        : 0;

      phase += 0.08;

      // Draw audio equalizer bars
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + spacing);
        const centerOffset = Math.abs(i - barCount / 2) / (barCount / 2);
        const bellCurve = Math.cos(centerOffset * (Math.PI / 2));

        let barHeight = 3;

        if (isActive) {
          // Map frequency bin
          const binIndex = Math.min(freq.length - 1, Math.floor((i / barCount) * 32));
          const freqVal = (freq[binIndex] || 0) / 255;
          const dynamicAmp = Math.max(freqVal, energy);
          
          // Combine frequency + sine wave wobble for organic responsiveness
          const wobble = Math.sin(phase + i * 0.3) * 0.12;
          barHeight = Math.max(3, (dynamicAmp * 0.85 + wobble + 0.05) * height * 0.88 * bellCurve);
        } else {
          // Gentle ambient idle wave
          const idleWave = (Math.sin(phase * 0.4 + i * 0.25) + 1) * 0.5;
          barHeight = 3 + idleWave * 6 * bellCurve;
        }

        const y = (height - barHeight) / 2;

        // Gradient color based on state
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isSpeaking) {
          grad.addColorStop(0, '#f43f5e'); // Rose
          grad.addColorStop(0.5, '#ec4899'); // Pink
          grad.addColorStop(1, '#a855f7'); // Purple
        } else if (isListening) {
          grad.addColorStop(0, '#38bdf8'); // Sky
          grad.addColorStop(0.5, '#06b6d4'); // Cyan
          grad.addColorStop(1, '#3b82f6'); // Blue
        } else {
          grad.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
          grad.addColorStop(1, 'rgba(99, 102, 241, 0.25)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, audioMetrics, isSpeaking, isListening, isActive]);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="w-full h-8 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={240}
          height={32}
          className="w-full max-w-[240px] h-8"
        />
      </div>
    </div>
  );
};
