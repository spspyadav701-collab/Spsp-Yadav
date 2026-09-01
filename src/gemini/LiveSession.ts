import { AssistantState, AudioMetrics, ToolCallEvent } from '../types/assistant';
import { AudioStreamer } from '../audio/AudioStreamer';
import { executeOpenWebsite } from '../tools/openWebsite';

/**
 * LiveSession coordinates bi-directional Live audio streaming via WebSocket,
 * enabling the model's full native general-purpose knowledge base along with
 * real-time tool execution and voice fallback mechanisms.
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
  private adminToken: string | null = null;

  private onStateChangeCb: ((state: AssistantState) => void) | null = null;
  private onMetricsCb: ((metrics: AudioMetrics) => void) | null = null;
  private onToolCallCb: ((event: ToolCallEvent) => void) | null = null;
  private onErrorCb: ((err: string) => void) | null = null;
  private onKnowledgeUpdatedCb: ((data: any) => void) | null = null;
  private onTeacherModeChangeCb: ((isActive: boolean, token?: string, adminName?: string) => void) | null = null;
  private onLiveGkGroundingCb: ((data: { query: string; result: any }) => void) | null = null;
  private onFeedbackLoggedCb: ((log: any) => void) | null = null;
  private onGkRefreshCompletedCb: ((result: any) => void) | null = null;

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

  public setOnKnowledgeUpdated(cb: (data: any) => void) {
    this.onKnowledgeUpdatedCb = cb;
  }

  public setOnTeacherModeChange(cb: (isActive: boolean, token?: string, adminName?: string) => void) {
    this.onTeacherModeChangeCb = cb;
  }

  public setOnLiveGkGrounding(cb: (data: { query: string; result: any }) => void) {
    this.onLiveGkGroundingCb = cb;
  }

  public setOnFeedbackLogged(cb: (log: any) => void) {
    this.onFeedbackLoggedCb = cb;
  }

  public setOnGkRefreshCompleted(cb: (result: any) => void) {
    this.onGkRefreshCompletedCb = cb;
  }

  public setAdminToken(token: string | null) {
    this.adminToken = token;
    if (this.ws && this.ws.readyState === WebSocket.OPEN && token) {
      this.ws.send(JSON.stringify({
        type: 'admin_auth',
        token: token,
      }));
    }
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
        if (this.adminToken && this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'admin_auth',
            token: this.adminToken,
          }));
        }
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'session_ready') {
            console.log('[ClientLive] Gemini Live session is ready and listening');
            this.setState('listening');
          } else if (msg.type === 'teacher_mode_activated') {
            console.log('[ClientLive] Teacher Mode ACTIVATED via Voice/Admin:', msg);
            if (msg.token) {
              this.adminToken = msg.token;
            }
            if (this.onTeacherModeChangeCb) {
              this.onTeacherModeChangeCb(true, msg.token, msg.adminName);
            }
          } else if (msg.type === 'teacher_mode_deactivated') {
            console.log('[ClientLive] Teacher Mode DEACTIVATED:', msg);
            this.adminToken = null;
            if (this.onTeacherModeChangeCb) {
              this.onTeacherModeChangeCb(false);
            }
          } else if (msg.type === 'knowledge_updated') {
            console.log('[ClientLive] Teacher knowledge updated by AI Teacher:', msg);
            if (this.onKnowledgeUpdatedCb) {
              this.onKnowledgeUpdatedCb(msg);
            }
          } else if (msg.type === 'live_gk_grounding') {
            console.log('[ClientLive] Live GK Grounding retrieved:', msg);
            if (this.onLiveGkGroundingCb) {
              this.onLiveGkGroundingCb(msg);
            }
          } else if (msg.type === 'feedback_logged') {
            console.log('[ClientLive] Student feedback logged:', msg);
            if (this.onFeedbackLoggedCb) {
              this.onFeedbackLoggedCb(msg.log);
            }
          } else if (msg.type === 'gk_refresh_completed') {
            console.log('[ClientLive] Current GK refresh completed:', msg);
            if (this.onGkRefreshCompletedCb) {
              this.onGkRefreshCompletedCb(msg.result);
            }
          } else if (msg.type === 'admin_auth_status') {
            console.log('[ClientLive] Teacher Admin Auth status:', msg.authenticated);
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
        console.warn('[ClientLive] WebSocket notice:', err);
      };

      this.ws.onclose = () => {
        console.log('[ClientLive] WebSocket closed');
        if (!this.isIntentionallyClosed && !this.isFallbackMode) {
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
          } else {
            console.log('[ClientLive] Switching to HTTP Voice Fallback mode after WebSocket attempts');
            this.startHttpVoiceFallback();
          }
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

      let apiUrl = '/api/voice/turn';
      const customServer = localStorage.getItem('ai_teacher_custom_server_url');

      if (customServer && customServer.trim()) {
        const cleanServer = customServer.trim().replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
        apiUrl = `https://${cleanServer}/api/voice/turn`;
      } else if (
        window.location.protocol === 'capacitor:' ||
        (window.location.hostname === 'localhost' && (window.location.port === '' || window.location.port === '80'))
      ) {
        apiUrl = 'https://ais-dev-3ovvzbwe3y2fxdwgd4xq7b-148475878375.asia-southeast1.run.app/api/voice/turn';
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.adminToken ? { Authorization: `Bearer ${this.adminToken}` } : {}),
        },
        body: JSON.stringify({
          prompt: defaultGreeting,
          history: this.conversationHistory,
          adminToken: this.adminToken,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textResp = await response.text();
        console.warn('[ClientLive] Non-JSON HTTP Voice response received:', textResp.slice(0, 150));
        throw new Error(`Server returned non-JSON response (${response.status})`);
      }

      if (!response.ok || !data) {
        throw new Error(data?.error || `HTTP Voice error: ${response.status}`);
      }

      this.setState('listening');

      if (data.audio) {
        this.audioStreamer.playAudioChunk(data.audio);
      } else if (data.text && 'speechSynthesis' in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(data.text);
          utterance.lang = 'hi-IN';
          utterance.rate = 1.05;
          utterance.onstart = () => this.setState('speaking');
          utterance.onend = () => this.setState('listening');
          window.speechSynthesis.speak(utterance);
        } catch (synthErr) {
          console.warn('[ClientLive] Web Speech fallback notice:', synthErr);
        }
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
      console.warn('[ClientLive] HTTP Voice Fallback note:', fallbackErr.message || fallbackErr);
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

