import { AssistantState, AudioMetrics, ToolCallEvent } from '../types/assistant';
import { AudioStreamer } from '../audio/AudioStreamer';
import { executeOpenWebsite } from '../tools/openWebsite';

/**
 * LiveSession coordinates client-server Live audio streaming via WebSocket,
 * with automatic seamless HTTP Voice Turn API fallback if WebSockets are restricted.
 */
export class LiveSession {
  private ws: WebSocket | null = null;
  private audioStreamer: AudioStreamer;
  private state: AssistantState = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 2;
  private isIntentionallyClosed = false;
  private isFallbackMode = false;
  private conversationHistory: any[] = [];

  private onStateChangeCb: ((state: AssistantState) => void) | null = null;
  private onMetricsCb: ((metrics: AudioMetrics) => void) | null = null;
  private onToolCallCb: ((event: ToolCallEvent) => void) | null = null;
  private onErrorCb: ((err: string) => void) | null = null;

  constructor() {
    this.audioStreamer = new AudioStreamer();

    // Hook audio streamer mic output -> send to server via WebSocket or buffer
    this.audioStreamer.setOnMicAudio((pcm16Base64) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'audio',
          audio: pcm16Base64,
        }));
      }
    });

    // Hook audio metrics -> notify UI (avatar, waveform, lip-sync)
    this.audioStreamer.setOnMetrics((metrics) => {
      if (this.onMetricsCb) {
        this.onMetricsCb(metrics);
      }
    });

    // Hook speaking state from audio playback
    this.audioStreamer.setOnSpeakingState((isSpeaking) => {
      if (this.state !== 'connecting' && this.state !== 'disconnected' && this.state !== 'error') {
        const newState: AssistantState = isSpeaking ? 'speaking' : 'listening';
        this.setState(newState);
      }
    });

    // Instant client-side barge-in / interruption
    this.audioStreamer.setOnInterrupt(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'client_interrupted',
        }));
      }
      this.setState('listening');
    });
  }

  public setOnStateChange(cb: (state: AssistantState) => void) {
    this.onStateChangeCb = cb;
  }

  public setOnMetrics(cb: (metrics: AudioMetrics) => void) {
    this.onMetricsCb = cb;
  }

  public setOnToolCall(cb: (event: ToolCallEvent) => void) {
    this.onToolCallCb = cb;
  }

  public setOnError(cb: (err: string) => void) {
    this.onErrorCb = cb;
  }

  public getState(): AssistantState {
    return this.state;
  }

  private setState(state: AssistantState) {
    this.state = state;
    if (this.onStateChangeCb) {
      this.onStateChangeCb(state);
    }
  }

  /**
   * Connect to the AI Teacher Live Voice session
   */
  public async connect(): Promise<void> {
    if (this.state === 'connecting' || this.state === 'listening' || this.state === 'speaking') {
      return;
    }

    this.isIntentionallyClosed = false;
    this.setState('connecting');

    try {
      // 1. Initialize microphone and audio contexts
      try {
        await this.audioStreamer.init();
      } catch (micErr: any) {
        console.warn('[ClientLive] Mic initialization notice (continuing with speaker):', micErr);
      }

      // 2. Determine WebSocket URL
      let wsUrl: string;
      const customServer = localStorage.getItem('ai_teacher_custom_server_url');

      if (customServer && customServer.trim()) {
        const cleanServer = customServer.trim().replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
        wsUrl = `wss://${cleanServer}/live-ws`;
      } else if (
        window.location.protocol === 'capacitor:' ||
        (window.location.hostname === 'localhost' && window.location.port === '') ||
        (window.location.hostname === 'localhost' && window.location.port === '80')
      ) {
        // Standalone Android APK environment fallback to live cloud server
        wsUrl = 'wss://ais-dev-3ovvzbwe3y2fxdwgd4xq7b-148475878375.asia-southeast1.run.app/live-ws';
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}/live-ws`;
      }

      console.log('[ClientLive] Connecting WebSocket to:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[ClientLive] Connected to Live Voice WebSocket');
        this.reconnectAttempts = 0;
        this.isFallbackMode = false;
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'session_ready') {
            console.log('[ClientLive] Gemini Live session is ready and listening');
            this.setState('listening');
          } else if (msg.type === 'audio' && msg.audio) {
            // Play received 24kHz audio chunk immediately
            this.audioStreamer.playAudioChunk(msg.audio);
          } else if (msg.type === 'interrupted') {
            console.log('[ClientLive] Interruption received from server: halting playback');
            this.audioStreamer.interrupt();
            this.setState('listening');
          } else if (msg.type === 'tool_call' && msg.toolCall) {
            // Handle Function Calling
            await this.handleToolCall(msg.toolCall);
          } else if (msg.type === 'error') {
            console.warn('[ClientLive] Server reported message:', msg.message);
            // Fallback to HTTP voice turn if needed
            if (this.state === 'connecting') {
              this.startHttpVoiceFallback();
            }
          } else if (msg.type === 'session_closed') {
            if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
              this.reconnect();
            } else {
              this.startHttpVoiceFallback();
            }
          }
        } catch (e: any) {
          console.error('[ClientLive] Error parsing server message:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[ClientLive] WebSocket connection notice, switching to HTTP voice fallback:', err);
        if (!this.isIntentionallyClosed) {
          this.startHttpVoiceFallback();
        }
      };

      this.ws.onclose = () => {
        console.log('[ClientLive] WebSocket closed');
        if (!this.isIntentionallyClosed && !this.isFallbackMode && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnect();
        } else if (!this.isFallbackMode && this.state !== 'error') {
          this.setState('disconnected');
        }
      };
    } catch (err: any) {
      console.warn('[ClientLive] Connection setup notice:', err);
      this.startHttpVoiceFallback();
    }
  }

  /**
   * HTTP Voice fallback when WebSocket is unavailable or restricted
   */
  public async startHttpVoiceFallback(promptText?: string) {
    this.isFallbackMode = true;
    this.setState('connecting');

    try {
      const defaultGreeting = promptText || 'नमस्ते, मैं AI Teacher हूँ। आपकी क्या मदद कर सकता हूँ?';
      const response = await fetch('/api/voice/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: defaultGreeting,
          history: this.conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Voice error: ${response.status}`);
      }

      const data = await response.json();
      this.setState('listening');

      if (data.audio) {
        this.audioStreamer.playAudioChunk(data.audio);
      }

      if (data.functionCalls && data.functionCalls.length > 0) {
        for (const fc of data.functionCalls) {
          await this.handleToolCall({ functionCalls: [fc] });
        }
      }

      // Record in conversation history
      this.conversationHistory.push(
        { role: 'user', parts: [{ text: defaultGreeting }] },
        { role: 'model', parts: [{ text: data.text || '' }] }
      );
    } catch (fallbackErr: any) {
      console.error('[ClientLive] HTTP Voice Fallback error:', fallbackErr);
      this.handleError('Unable to connect to AI Teacher. Please check your internet connection.');
    }
  }

  /**
   * Send text prompt to AI Teacher
   */
  public async sendUserPrompt(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'text_turn',
        text: text,
      }));
    } else {
      await this.startHttpVoiceFallback(text);
    }
  }

  private async reconnect() {
    this.reconnectAttempts++;
    console.log(`[ClientLive] Attempting auto-reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    this.setState('connecting');
    setTimeout(() => {
      if (!this.isIntentionallyClosed && this.state !== 'disconnected') {
        this.connect();
      }
    }, 1200);
  }

  /**
   * Handles Gemini function call requests (e.g. openWebsite)
   */
  private async handleToolCall(toolCall: any) {
    const functionCalls = toolCall.functionCalls || [];
    const functionResponses: any[] = [];

    for (const fc of functionCalls) {
      const callId = fc.id || `call_${Date.now()}`;
      const name = fc.name;
      const args = fc.args || {};

      console.log(`[ClientLive] Executing tool: ${name}`, args);

      // Notify UI of tool call event
      const event: ToolCallEvent = {
        id: callId,
        name,
        args,
        timestamp: Date.now(),
        status: 'executing',
      };
      if (this.onToolCallCb) {
        this.onToolCallCb(event);
      }

      let result: any = {};

      if (name === 'openWebsite') {
        const execRes = executeOpenWebsite(args);
        result = execRes;
        event.status = execRes.success ? 'completed' : 'failed';
        event.result = execRes.message;
      } else {
        result = { error: `Tool ${name} is not implemented` };
        event.status = 'failed';
        event.result = `Unknown tool: ${name}`;
      }

      if (this.onToolCallCb) {
        this.onToolCallCb({ ...event });
      }

      functionResponses.push({
        id: callId,
        name: name,
        response: result,
      });
    }

    // Send tool response back to Gemini if WebSocket is open
    if (this.ws && this.ws.readyState === WebSocket.OPEN && functionResponses.length > 0) {
      this.ws.send(JSON.stringify({
        type: 'tool_response',
        functionResponses,
      }));
    }
  }

  private handleError(message: string) {
    this.setState('error');
    if (this.onErrorCb) {
      this.onErrorCb(message);
    }
    this.audioStreamer.interrupt();
  }

  /**
   * Disconnect and release all live streams & audio resources
   */
  public disconnect() {
    this.isIntentionallyClosed = true;
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.audioStreamer.interrupt();
    this.audioStreamer.stopRecording();
    this.setState('disconnected');
  }

  public cleanup() {
    this.disconnect();
    this.audioStreamer.cleanup();
  }
}

