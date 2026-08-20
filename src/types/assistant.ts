export type AssistantState = 
  | 'disconnected'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'interrupted'
  | 'error';

export interface ToolCallEvent {
  id: string;
  name: string;
  args: Record<string, any>;
  timestamp: number;
  result?: string;
  status: 'executing' | 'completed' | 'failed';
}

export interface AudioMetrics {
  inputVolume: number; // 0.0 to 1.0
  outputVolume: number; // 0.0 to 1.0
  mouthOpening: number; // 0.0 to 1.0 for lip-sync
  frequencyData: Uint8Array;
}

export interface LiveSessionConfig {
  voiceName?: 'Aoede' | 'Kore' | 'Fenrir' | 'Puck' | 'Zephyr' | 'Charon';
  systemInstruction?: string;
}

export interface SessionError {
  message: string;
  code?: string;
  timestamp: number;
}
