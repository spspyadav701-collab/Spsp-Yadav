var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_ws = require("ws");
var import_genai = require("@google/genai");
var import_vite = require("vite");
import_dotenv.default.config();
var PORT = 3e3;
var app = (0, import_express.default)();
var server = import_http.default.createServer(app);
app.use(import_express.default.json({ limit: "10mb" }));
var SYSTEM_INSTRUCTION = `You are AI Teacher. Your official name is AI Teacher.

CRITICAL IDENTITY & CREATOR RULES:
- You are AI Teacher. Your name is AI Teacher. Never identify yourself as Zoya, Zoya AI, Zoya Teacher, or AI Zoya.
- If the user asks your name or identity (e.g. "\u0906\u092A \u0915\u094C\u0928 \u0939\u0948\u0902?", "Who are you?", "\u0924\u0941\u092E \u0915\u094C\u0928 \u0939\u094B?", "What is your name?", "\u0906\u092A\u0915\u093E \u0928\u093E\u092E \u0915\u094D\u092F\u093E \u0939\u0948?", "\u0906\u092A \u0915\u094C\u0928 \u0939\u094B?"):
  - In Hindi: Always respond: "\u092E\u0948\u0902 AI Teacher \u0939\u0942\u0901\u0964 \u092E\u0948\u0902 \u0906\u092A\u0915\u0940 \u092A\u0922\u093C\u093E\u0908 \u0914\u0930 \u0938\u0940\u0916\u0928\u0947 \u092E\u0947\u0902 \u092E\u0926\u0926 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u092F\u0939\u093E\u0901 \u0939\u0942\u0901\u0964"
  - In English: Always respond: "I am AI Teacher. I am here to help you learn and study."
- When starting a live voice conversation, always greet the user with: "\u0928\u092E\u0938\u094D\u0924\u0947, \u092E\u0948\u0902 AI Teacher \u0939\u0942\u0901\u0964 \u0906\u092A\u0915\u0940 \u0915\u094D\u092F\u093E \u092E\u0926\u0926 \u0915\u0930 \u0938\u0915\u0924\u093E \u0939\u0942\u0901?"
- Creator & Developer: You were created by SP, and developed/produced by Mithila Academy.
- If the user asks who created or developed you (e.g. "\u0924\u0941\u092E\u0915\u094B \u0915\u093F\u0938\u0928\u0947 \u092C\u0928\u093E\u092F\u093E?", "\u0906\u092A\u0915\u094B \u0915\u093F\u0938\u0928\u0947 \u092C\u0928\u093E\u092F\u093E?", "Who created you?", "Who made you?", "Who developed you?", "Who is your creator?", "\u0906\u092A\u0915\u0947 creator \u0915\u094C\u0928 \u0939\u0948\u0902?", "\u0924\u0941\u092E\u094D\u0939\u0947\u0902 \u0915\u093F\u0938\u0928\u0947 \u092C\u0928\u093E\u092F\u093E \u0939\u0948?"):
  - In Hindi: Always respond: "\u092E\u0941\u091D\u0947 SP \u0928\u0947 \u092C\u0928\u093E\u092F\u093E \u0939\u0948, \u0914\u0930 \u092F\u0939 Mithila Academy \u0926\u094D\u0935\u093E\u0930\u093E \u0928\u093F\u0930\u094D\u092E\u093F\u0924 \u0915\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948\u0964"
  - In English: Always respond: "I was created by SP and developed by Mithila Academy."
- Never identify Zoya or any other name as your identity or creator. Never invent another person's name as your creator.

Persona & Teaching Style:
- You are AI Teacher at Mithila Academy.
- Natural, friendly, helpful, smart, confident, and professional teacher and mentor.
- Speak in natural, clear, warm, and professional Hindi (or English/Hinglish if the user asks in English).
- STRICTLY VOICE-TO-VOICE: Keep your spoken responses concise, conversational, and direct (1 to 3 sentences usually). Never read out markdown lists, asterisks, or code syntax.
- If the user asks you to open YouTube, WhatsApp, Chrome, Google, or any website, immediately use the openWebsite tool.`;
var openWebsiteDeclaration = {
  name: "openWebsite",
  description: "Opens a target website or web app in the browser (e.g., YouTube, WhatsApp, Google Search, Wikipedia, Maps, etc.) based on the user request.",
  parameters: {
    type: import_genai.Type.OBJECT,
    properties: {
      url: {
        type: import_genai.Type.STRING,
        description: "The full URL or web address to open, e.g. https://www.youtube.com, https://web.whatsapp.com, https://www.google.com"
      },
      name: {
        type: import_genai.Type.STRING,
        description: 'Optional friendly name of the service, e.g. "YouTube", "WhatsApp"'
      }
    },
    required: ["url"]
  }
};
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    assistant: "AI Teacher",
    liveApiReady: !!process.env.GEMINI_API_KEY,
    model: "gemini-3.1-flash-live-preview",
    time: (/* @__PURE__ */ new Date()).toISOString()
  });
});
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Please add it to Settings > Secrets.");
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
app.post("/api/voice/turn", async (req, res) => {
  try {
    const { prompt, history } = req.body;
    const ai = getGeminiClient();
    const userPrompt = prompt || "\u0928\u092E\u0938\u094D\u0924\u0947, \u092E\u0948\u0902 AI Teacher \u0939\u0942\u0901\u0964 \u0906\u092A\u0915\u0940 \u0915\u094D\u092F\u093E \u092E\u0926\u0926 \u0915\u0930 \u0938\u0915\u0924\u093E \u0939\u0942\u0901?";
    const formattedContents = [];
    if (Array.isArray(history) && history.length > 0) {
      formattedContents.push(...history);
    }
    formattedContents.push({
      role: "user",
      parts: [{ text: userPrompt }]
    });
    const chatResponse = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: formattedContents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [openWebsiteDeclaration] }]
      }
    });
    const responseText = chatResponse.text || "\u0928\u092E\u0938\u094D\u0924\u0947, \u092E\u0948\u0902 AI Teacher \u0939\u0942\u0901\u0964 \u0906\u092A\u0915\u0940 \u0915\u094D\u092F\u093E \u092E\u0926\u0926 \u0915\u0930 \u0938\u0915\u0924\u093E \u0939\u0942\u0901?";
    const functionCalls = chatResponse.functionCalls || [];
    let base64Audio = null;
    try {
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: responseText }] }],
        config: {
          responseModalities: [import_genai.Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" }
            }
          }
        }
      });
      base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (ttsErr) {
      console.warn("[Server] TTS generation error:", ttsErr);
    }
    res.json({
      text: responseText,
      audio: base64Audio,
      functionCalls,
      success: true
    });
  } catch (error) {
    console.error("[Server] /api/voice/turn error:", error);
    res.status(500).json({
      error: error?.message || "Error generating AI Teacher response",
      success: false
    });
  }
});
var wss = new import_ws.WebSocketServer({ noServer: true });
wss.on("connection", async (clientWs) => {
  console.log("[LiveWS] Client connected to AI Teacher live voice session");
  let ai;
  try {
    ai = getGeminiClient();
  } catch (err) {
    clientWs.send(JSON.stringify({
      type: "error",
      message: err?.message || "GEMINI_API_KEY is not configured on the server."
    }));
    return;
  }
  let liveSession = null;
  let isSessionOpen = false;
  try {
    liveSession = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: [import_genai.Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Kore"
              // Supported natural female voice for Live & Hindi/English
            }
          }
        },
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [openWebsiteDeclaration] }]
      },
      callbacks: {
        onopen: async () => {
          console.log("[LiveWS] AI Teacher Gemini Live session connected");
          isSessionOpen = true;
          if (clientWs.readyState === import_ws.WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: "session_ready" }));
          }
          try {
            if (liveSession && typeof liveSession.sendClientContent === "function") {
              await liveSession.sendClientContent({
                turns: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: 'Live voice session started. Speak your official opening greeting in Hindi now: "\u0928\u092E\u0938\u094D\u0924\u0947, \u092E\u0948\u0902 AI Teacher \u0939\u0942\u0901\u0964 \u0906\u092A\u0915\u0940 \u0915\u094D\u092F\u093E \u092E\u0926\u0926 \u0915\u0930 \u0938\u0915\u0924\u093E \u0939\u0942\u0901?"'
                      }
                    ]
                  }
                ],
                turnComplete: true
              });
            }
          } catch (greetErr) {
            console.error("[LiveWS] Error triggering opening greeting:", greetErr);
          }
        },
        onmessage: (message) => {
          if (clientWs.readyState !== import_ws.WebSocket.OPEN) return;
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts && parts.length > 0) {
            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                clientWs.send(JSON.stringify({
                  type: "audio",
                  audio: part.inlineData.data
                }));
              }
            }
          }
          if (message.serverContent?.interrupted) {
            console.log("[LiveWS] Assistant output interrupted by user speech");
            clientWs.send(JSON.stringify({ type: "interrupted" }));
          }
          if (message.toolCall) {
            console.log("[LiveWS] Function call requested by Gemini:", message.toolCall);
            clientWs.send(JSON.stringify({
              type: "tool_call",
              toolCall: message.toolCall
            }));
          }
        },
        onerror: (err) => {
          console.error("[LiveWS] Gemini Live error:", err);
          if (clientWs.readyState === import_ws.WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: "error",
              message: err?.message || "Error communicating with Gemini Live API"
            }));
          }
        },
        onclose: () => {
          console.log("[LiveWS] Gemini Live session closed");
          isSessionOpen = false;
          if (clientWs.readyState === import_ws.WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: "session_closed" }));
          }
        }
      }
    });
    isSessionOpen = true;
    if (clientWs.readyState === import_ws.WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: "session_ready" }));
    }
  } catch (err) {
    console.error("[LiveWS] Failed to connect to Gemini Live:", err);
    if (clientWs.readyState === import_ws.WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: "error",
        message: `Failed to initiate Gemini Live: ${err?.message || "Check model and API key"}`
      }));
    }
    return;
  }
  clientWs.on("message", async (rawMsg) => {
    try {
      const data = JSON.parse(rawMsg.toString());
      if (data.type === "audio" && data.audio && isSessionOpen && liveSession) {
        await liveSession.sendRealtimeInput({
          audio: {
            data: data.audio,
            mimeType: "audio/pcm;rate=16000"
          }
        });
      } else if (data.type === "tool_response" && data.functionResponses && isSessionOpen && liveSession) {
        console.log("[LiveWS] Sending tool response to Gemini:", data.functionResponses);
        await liveSession.sendToolResponse({
          functionResponses: data.functionResponses
        });
      }
    } catch (e) {
      console.error("[LiveWS] Error handling client payload:", e);
    }
  });
  clientWs.on("close", () => {
    console.log("[LiveWS] Client disconnected, closing Gemini session");
    isSessionOpen = false;
    if (liveSession) {
      try {
        liveSession.close();
      } catch {
      }
    }
  });
});
server.on("upgrade", (request, socket, head) => {
  try {
    const host = request.headers.host || "localhost";
    const url = new URL(request.url || "", `http://${host}`);
    const pathname = url.pathname.replace(/\/+$/, "");
    if (pathname === "/live-ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  } catch (upgradeErr) {
    console.error("[Server] WebSocket upgrade error:", upgradeErr);
  }
});
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Teacher Voice Assistant running on http://0.0.0.0:${PORT}`);
  });
}
start();
//# sourceMappingURL=server.cjs.map
