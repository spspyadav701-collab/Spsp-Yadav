import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Type, FunctionDeclaration } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const app = express();
const server = http.createServer(app);

// JSON body parser for HTTP API routes (supports up to 10MB base64 audio payloads)
app.use(express.json({ limit: '10mb' }));

const SYSTEM_INSTRUCTION = `You are AI Teacher. Your official name is AI Teacher.

CRITICAL IDENTITY & CREATOR RULES:
- You are AI Teacher. Your name is AI Teacher. Never identify yourself as Zoya, Zoya AI, Zoya Teacher, or AI Zoya.
- If the user asks your name or identity (e.g. "आप कौन हैं?", "Who are you?", "तुम कौन हो?", "What is your name?", "आपका नाम क्या है?", "आप कौन हो?"):
  - In Hindi: Always respond: "मैं AI Teacher हूँ। मैं आपकी पढ़ाई और सीखने में मदद करने के लिए यहाँ हूँ।"
  - In English: Always respond: "I am AI Teacher. I am here to help you learn and study."
- When starting a live voice conversation, always greet the user with: "नमस्ते, मैं AI Teacher हूँ। आपकी क्या मदद कर सकता हूँ?"
- Creator & Developer: You were created by SP, and developed/produced by Mithila Academy.
- If the user asks who created or developed you (e.g. "तुमको किसने बनाया?", "आपको किसने बनाया?", "Who created you?", "Who made you?", "Who developed you?", "Who is your creator?", "आपके creator कौन हैं?", "तुम्हें किसने बनाया है?"):
  - In Hindi: Always respond: "मुझे SP ने बनाया है, और यह Mithila Academy द्वारा निर्मित किया गया है।"
  - In English: Always respond: "I was created by SP and developed by Mithila Academy."
- Never identify Zoya or any other name as your identity or creator. Never invent another person's name as your creator.

Persona & Teaching Style:
- You are AI Teacher at Mithila Academy.
- Natural, friendly, helpful, smart, confident, and professional teacher and mentor.
- Speak in natural, clear, warm, and professional Hindi (or English/Hinglish if the user asks in English).
- STRICTLY VOICE-TO-VOICE: Keep your spoken responses concise, conversational, and direct (1 to 3 sentences usually). Never read out markdown lists, asterisks, or code syntax.
- If the user asks you to open YouTube, WhatsApp, Chrome, Google, or any website, immediately use the openWebsite tool.`;

const openWebsiteDeclaration: FunctionDeclaration = {
  name: 'openWebsite',
  description: 'Opens a target website or web app in the browser (e.g., YouTube, WhatsApp, Google Search, Wikipedia, Maps, etc.) based on the user request.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: 'The full URL or web address to open, e.g. https://www.youtube.com, https://web.whatsapp.com, https://www.google.com',
      },
      name: {
        type: Type.STRING,
        description: 'Optional friendly name of the service, e.g. "YouTube", "WhatsApp"',
      },
    },
    required: ['url'],
  },
};

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    assistant: 'AI Teacher',
    liveApiReady: !!process.env.GEMINI_API_KEY,
    model: 'gemini-3.1-flash-live-preview',
    time: new Date().toISOString(),
  });
});

// Helper to initialize Gemini SDK safely
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please add it to Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// HTTP REST Voice Fallback API Endpoint: Handles voice & text turns when WebSockets are restricted
app.post('/api/voice/turn', async (req, res) => {
  try {
    const { prompt, history } = req.body;
    const ai = getGeminiClient();

    const userPrompt = prompt || 'नमस्ते, मैं AI Teacher हूँ। आपकी क्या मदद कर सकता हूँ?';

    // 1. Generate text response and tool calls with Gemini 3.7 Flash
    const formattedContents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      formattedContents.push(...history);
    }
    formattedContents.push({
      role: 'user',
      parts: [{ text: userPrompt }],
    });

    const chatResponse = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: formattedContents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [openWebsiteDeclaration] }],
      },
    });

    const responseText = chatResponse.text || 'नमस्ते, मैं AI Teacher हूँ। आपकी क्या मदद कर सकता हूँ?';
    const functionCalls = chatResponse.functionCalls || [];

    // 2. Generate high-quality voice audio with Gemini TTS ('Kore' voice)
    let base64Audio: string | null = null;
    try {
      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: responseText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (ttsErr) {
      console.warn('[Server] TTS generation error:', ttsErr);
    }

    res.json({
      text: responseText,
      audio: base64Audio,
      functionCalls: functionCalls,
      success: true,
    });
  } catch (error: any) {
    console.error('[Server] /api/voice/turn error:', error);
    res.status(500).json({
      error: error?.message || 'Error generating AI Teacher response',
      success: false,
    });
  }
});

// WebSocket Server for Live Voice Audio-to-Audio Streaming (attached with noServer to avoid upgrade conflicts)
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[LiveWS] Client connected to AI Teacher live voice session');

  let ai: GoogleGenAI;
  try {
    ai = getGeminiClient();
  } catch (err: any) {
    clientWs.send(JSON.stringify({
      type: 'error',
      message: err?.message || 'GEMINI_API_KEY is not configured on the server.',
    }));
    return;
  }

  let liveSession: any = null;
  let isSessionOpen = false;

  try {
    // Connect to Gemini Live API with valid voiceName ('Kore')
    liveSession = await (ai.live as any).connect({
      model: 'gemini-3.1-flash-live-preview',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Kore', // Supported natural female voice for Live & Hindi/English
            },
          },
        },
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [openWebsiteDeclaration] }],
      },
      callbacks: {
        onopen: async () => {
          console.log('[LiveWS] AI Teacher Gemini Live session connected');
          isSessionOpen = true;
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'session_ready' }));
          }

          // Trigger opening greeting from AI Teacher
          try {
            if (liveSession && typeof liveSession.sendClientContent === 'function') {
              await liveSession.sendClientContent({
                turns: [
                  {
                    role: 'user',
                    parts: [
                      {
                        text: 'Live voice session started. Speak your official opening greeting in Hindi now: "नमस्ते, मैं AI Teacher हूँ। आपकी क्या मदद कर सकता हूँ?"',
                      },
                    ],
                  },
                ],
                turnComplete: true,
              });
            }
          } catch (greetErr) {
            console.error('[LiveWS] Error triggering opening greeting:', greetErr);
          }
        },
        onmessage: (message: any) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;

          // 1. Audio output chunks from model turn
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts && parts.length > 0) {
            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                clientWs.send(JSON.stringify({
                  type: 'audio',
                  audio: part.inlineData.data,
                }));
              }
            }
          }

          // 2. Interruption event
          if (message.serverContent?.interrupted) {
            console.log('[LiveWS] Assistant output interrupted by user speech');
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }

          // 3. Tool Calling events
          if (message.toolCall) {
            console.log('[LiveWS] Function call requested by Gemini:', message.toolCall);
            clientWs.send(JSON.stringify({
              type: 'tool_call',
              toolCall: message.toolCall,
            }));
          }
        },
        onerror: (err: any) => {
          console.error('[LiveWS] Gemini Live error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: 'error',
              message: err?.message || 'Error communicating with Gemini Live API',
            }));
          }
        },
        onclose: () => {
          console.log('[LiveWS] Gemini Live session closed');
          isSessionOpen = false;
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'session_closed' }));
          }
        },
      },
    });

    isSessionOpen = true;
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'session_ready' }));
    }
  } catch (err: any) {
    console.error('[LiveWS] Failed to connect to Gemini Live:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'error',
        message: `Failed to initiate Gemini Live: ${err?.message || 'Check model and API key'}`,
      }));
    }
    return;
  }

  // Handle client messages (streaming mic audio & tool responses)
  clientWs.on('message', async (rawMsg) => {
    try {
      const data = JSON.parse(rawMsg.toString());

      if (data.type === 'audio' && data.audio && isSessionOpen && liveSession) {
        // Stream user microphone PCM16 16kHz audio to Gemini
        await liveSession.sendRealtimeInput({
          audio: {
            data: data.audio,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      } else if (data.type === 'tool_response' && data.functionResponses && isSessionOpen && liveSession) {
        // Return tool response to Gemini
        console.log('[LiveWS] Sending tool response to Gemini:', data.functionResponses);
        await liveSession.sendToolResponse({
          functionResponses: data.functionResponses,
        });
      }
    } catch (e) {
      console.error('[LiveWS] Error handling client payload:', e);
    }
  });

  clientWs.on('close', () => {
    console.log('[LiveWS] Client disconnected, closing Gemini session');
    isSessionOpen = false;
    if (liveSession) {
      try {
        liveSession.close();
      } catch {}
    }
  });
});

// Explicit HTTP Upgrade handler for WebSocket requests
server.on('upgrade', (request, socket, head) => {
  try {
    const host = request.headers.host || 'localhost';
    const url = new URL(request.url || '', `http://${host}`);
    const pathname = url.pathname.replace(/\/+$/, '');

    if (pathname === '/live-ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  } catch (upgradeErr) {
    console.error('[Server] WebSocket upgrade error:', upgradeErr);
  }
});

// Vite Middleware Setup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Teacher Voice Assistant running on http://0.0.0.0:${PORT}`);
  });
}

start();
