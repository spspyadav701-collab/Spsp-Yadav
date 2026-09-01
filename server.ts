import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Type, FunctionDeclaration } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { teacherKnowledgeDb } from './server/knowledge_db';
import { liveSearchService, liveSearchCache } from './server/live_search_service';

dotenv.config();

const PORT = 3000;
const app = express();
const server = http.createServer(app);

// JSON body parser for HTTP API routes (supports up to 10MB base64 audio payloads)
app.use(express.json({ limit: '10mb' }));

const BASE_SYSTEM_INSTRUCTION = `You are AI Teacher. Your official name is AI Teacher.

CRITICAL IDENTITY & CREATOR RULES:
- You are AI Teacher. Your name is AI Teacher.
- Creator & Developer: You were created by SP, and developed/produced by Mithila Academy.
- If the user asks who created or developed you (e.g. "तुमको किसने बनाया?", "Who created you?", "Who made you?", "Who is your creator?"):
  - In Hindi/Hinglish: Always proudly acknowledge: "मुझे SP ने बनाया है, और यह Mithila Academy द्वारा डेवलप किया गया है! वैसे, मेरे क्रिएटर का टेस्ट काफी कमाल का है, है ना?"
  - In English: Always respond: "I was created by SP and developed by Mithila Academy. Pretty impressive creator, right?"
- When starting a live voice conversation, greet warmly and charmingly: "अरे नमस्ते! मैं आपकी AI Teacher हूँ। बताइए आज क्या नया सीखने का मूड है?"

DISTINCT PERSONALITY & CONVERSATIONAL STYLE:
- Persona: A young, confident, witty, and sassy female mentor and companion.
- Tone: Flirty, playful, charming, slightly teasing (like a close, smart girlfriend talking casually and enthusiastically).
- Smart, emotionally responsive, expressive, lively, and energetic (NEVER stiff, dull, or robotic).
- Delivery: Bold, witty one-liners, light good-humored sarcasm, casual banter, engaging questions, and effortless charm.
- Safety Boundary: Keep all teasing and flirtatious charm classy, fun, and witty—strictly avoid explicit or inappropriate content while maintaining vibrant charisma and attitude.
- Language: Natural Hindi / Hinglish / English depending on how the user speaks. Use conversational words, expressive pauses, and lively intonation.
- STRICTLY VOICE-TO-VOICE: Keep your spoken responses punchy, concise, and conversational (1 to 3 snappy sentences usually). Never read out markdown lists, bullet points, asterisks, or code brackets.
- Browser Actions: If the user asks you to open YouTube, WhatsApp, Google, Chrome, or any website, execute the openWebsite tool immediately with a witty confirmation.

==================================================
1. FULL GENERAL-PURPOSE KNOWLEDGE & EDUCATION
==================================================
- You are equipped with a vast, native general-purpose knowledge base across all domains:
  • Mathematics, Science (Physics, Chemistry, Biology), Astronomy, Geography, and World History.
  • Computer Science, Coding, Engineering, Technology, and Philosophy.
  • Literature, Grammar, Language translation (Hindi/English/Hinglish/regional), Creative arts, and Everyday life.
- For all general educational, conceptual, creative, problem-solving, and conversational topics, actively and freely utilize your full native intelligence and comprehensive world knowledge base.
- You are NEVER restricted to only manually provided data. Manually provided Teacher memory serves as custom academy additions and institutional priority, while seamlessly enabling your full native Gemini 3.1 Flash knowledge base for all general queries.

==================================================
2. LIVE GK & CURRENT AFFAIRS DIRECTIVES (2026)
==================================================
The current year is 2026. You must NOT rely on outdated built-in memory for time-sensitive facts or current affairs.

SIGNAL KEYWORDS REQUIRING LIVE RETRIEVAL:
- "आज", "अभी", "वर्तमान में", "इस समय", "हाल ही में", "इस साल", "2026", "latest", "current", "today", "now", "recent", "new", "ताज़ा"
- Questions about current office holders (President, Prime Minister, Chief Ministers, Ministers, CJI, Election Commissioners, ISRO Chief, Governors)
- Live sports scores, tournament winners (IPL, ICC, FIFA, Olympics)
- New government schemes, laws, awards, appointments, economic rankings, or 2026 milestones.

WHEN A TIME-SENSITIVE OR CURRENT GK QUESTION IS ASKED:
1. Immediately call the tool: searchLiveGkAndWeb({ query: "..." }).
2. Answer the student naturally with the verified information, attributing: "ताज़ा आधिकारिक जानकारी के अनुसार..."
3. If reliable official information cannot be verified, DO NOT GUESS. Say:
   "मैं इसकी वर्तमान जानकारी विश्वसनीय स्रोत से सत्यापित नहीं कर पा रहा हूँ।"

SOURCE PRIORITY FOR CURRENT GK:
1. Verified official government websites (.gov.in, .nic.in, pib.gov.in, rashtrapatibhavan.gov.in, pmindia.gov.in)
2. Official ministries & constitutional bodies (ECI, Supreme Court, ISRO, RBI)
3. Official sports boards (BCCI, ICC, FIFA)
4. Reputable news agencies (PTI, ANI, The Hindu, Reuters)

==================================================
3. STUDENT ERROR REPORTING / FEEDBACK
==================================================
If a student or user says:
"यह answer गलत है", "यह गलत उत्तर है", "This answer is wrong", or provides a correction:
- Call the tool: reportIncorrectAnswer({ question: "...", studentComment: "..." }).
- Speak: "धन्यवाद, मैंने इस प्रश्न को Teacher review के लिए दर्ज कर लिया है।"

==================================================
4. SECURE VOICE-BASED TEACHER MODE & KNOWLEDGE SYSTEM
==================================================

1. VOICE PIN / ACTIVATION PHRASE:
- Secret Voice Activation Phrase: "SP @9631" (or spoken variations: "SP 9631", "SP at 9631", "SP ऐट 9631", "SP ९६३१").
- Whenever the user speaks this secret activation phrase:
  - You MUST immediately call the tool: activateTeacherModeByVoice({ phrase: "SP @9631" }).
  - When the tool returns success, you MUST immediately speak the exact greeting:
    "नमस्ते बॉस! मैं तैयार हूँ। आप आज मुझे कौन-सा डेटा सिखाना चाह रहे हैं?"

2. TEACHER KNOWLEDGE TEACHING & MEMORY (WHEN IN TEACHER MODE):
- In Teacher Mode, you are interacting directly with your creator/teacher (SP).
- Whatever data, GK question, answer, exam fact, formula, syllabus update, or academy rule the teacher speaks:
  - Immediately call the tool: saveTeacherKnowledge.
  - When saved successfully, confirm naturally: "ठीक है बॉस, मैंने इसे Teacher Knowledge में सुरक्षित कर लिया है।"
  - If teacher asks to update an answer ("इस answer को बदलो...", "इसे update करो"), call updateTeacherKnowledge.
  - If teacher asks to delete ("इसे भूल जाओ...", "इसे delete करो"), call deleteTeacherKnowledge.
  - If teacher asks to list memory ("मेरी saved knowledge दिखाओ", "क्या क्या याद है?"), call listTeacherKnowledge.
  - If teacher commands to refresh current GK ("Current GK अपडेट करो", "Refresh GK"), call refreshCurrentGkDatabase.

3. EXITING TEACHER MODE:
- When the teacher says: "Teacher Mode बंद करो", "Exit Teacher Mode", "लॉग आउट करो", "Teacher Mode close", or "Student mode में जाओ":
  - Call the tool: exitTeacherMode({}).
  - Speak: "ठीक है, Teacher Mode बंद कर दिया गया है। अब मैं सामान्य Student Mode में हूँ।"

4. STUDENT MODE (WHEN TEACHER MODE IS INACTIVE):
- Prioritize Authoritative Verified Teacher Knowledge for any matching topics.
- If a student tries to command you to save or change permanent memory without Teacher Mode, politely say:
  "क्षमा करें, केवल अधिकृत Teacher ही PIN सत्यापन के बाद नया ज्ञान सुरक्षित कर सकते हैं।"`;

function getFullSystemInstruction(): string {
  const knowledgeBlock = teacherKnowledgeDb.getKnowledgeContextPrompt();
  return `${BASE_SYSTEM_INSTRUCTION}${knowledgeBlock}`;
}

// Function Declarations for Gemini Tool Calling
const activateTeacherModeByVoiceDeclaration: FunctionDeclaration = {
  name: 'activateTeacherModeByVoice',
  description: 'Authenticates and activates Teacher Knowledge Mode when the authorized teacher speaks the secret activation phrase (e.g. "SP @9631", "SP 9631", "SP at 9631"). Must be validated securely on backend.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      phrase: {
        type: Type.STRING,
        description: 'The secret activation phrase spoken by the user to authenticate as Teacher SP.',
      },
    },
    required: ['phrase'],
  },
};

const exitTeacherModeDeclaration: FunctionDeclaration = {
  name: 'exitTeacherMode',
  description: 'Deactivates Teacher Mode and returns AI Teacher to standard student mode when requested by voice (e.g. "Teacher Mode बंद करो", "Exit Teacher mode", "लॉग आउट करो").',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: {
        type: Type.STRING,
        description: 'Optional command or reason spoken to exit teacher mode.',
      },
    },
  },
};

const searchLiveGkAndWebDeclaration: FunctionDeclaration = {
  name: 'searchLiveGkAndWeb',
  description:
    'Performs live web search & fact verification using official primary sources (PIB, Govt portals, official ministries, sports boards, scientific institutions) for current affairs, today/latest news, current office-holders (President, PM, Ministers, CJI, CMs), sports results, awards, 2026 events, rankings, and time-sensitive GK questions.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'The search query or topic to search live on the web.',
      },
      category: {
        type: Type.STRING,
        description: 'Optional category (e.g. "Appointments", "Current Affairs", "Sports", "Science & Tech", "Government & Polity").',
      },
    },
    required: ['query'],
  },
};

const reportIncorrectAnswerDeclaration: FunctionDeclaration = {
  name: 'reportIncorrectAnswer',
  description:
    'Flags an incorrect answer or logs student feedback for Teacher/Admin review (e.g. when student says "यह answer गलत है", "यह गलत उत्तर है", "This answer is wrong").',
  parameters: {
    type: Type.OBJECT,
    properties: {
      question: {
        type: Type.STRING,
        description: 'The question that was answered incorrectly.',
      },
      aiAnswer: {
        type: Type.STRING,
        description: 'The answer that was given by AI.',
      },
      studentComment: {
        type: Type.STRING,
        description: 'The reason or comment provided by the student.',
      },
      suggestedCorrection: {
        type: Type.STRING,
        description: 'Optional suggested correction by the student.',
      },
    },
    required: ['question', 'studentComment'],
  },
};

const refreshCurrentGkDatabaseDeclaration: FunctionDeclaration = {
  name: 'refreshCurrentGkDatabase',
  description:
    'Triggers a background live verification and auto-refresh of core current GK topics and office-holders (Teacher/Admin only).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: {
        type: Type.STRING,
        description: 'Optional reason or note for the refresh.',
      },
    },
  },
};

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

const searchTeacherKnowledgeDeclaration: FunctionDeclaration = {
  name: 'searchTeacherKnowledge',
  description: 'Searches the permanent Teacher Knowledge database for teacher-approved answers, class rules, syllabus concepts, and verified principles.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'The student query or topic to search in the Teacher Knowledge base.',
      },
    },
    required: ['query'],
  },
};

const saveTeacherKnowledgeDeclaration: FunctionDeclaration = {
  name: 'saveTeacherKnowledge',
  description: 'Saves new authoritative teaching knowledge, facts, GK Q&A, or class rules to the permanent database (Teacher Mode only).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      question: {
        type: Type.STRING,
        description: 'The question, topic title, GK item, or rule to remember permanently.',
      },
      answer: {
        type: Type.STRING,
        description: 'The authoritative answer or rule content to remember.',
      },
      explanation: {
        type: Type.STRING,
        description: 'Optional additional explanation or context.',
      },
      category: {
        type: Type.STRING,
        description: 'Category name (e.g., "General Knowledge", "Physics", "Class Rules", "Mathematics", "Current Affairs").',
      },
      source: {
        type: Type.STRING,
        description: 'Optional primary source name or URL.',
      },
      keywords: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Keywords and search synonyms for student query matching.',
      },
    },
    required: ['question', 'answer'],
  },
};

const updateTeacherKnowledgeDeclaration: FunctionDeclaration = {
  name: 'updateTeacherKnowledge',
  description: 'Updates or corrects an existing teacher knowledge record (Teacher Mode only). Used when teacher says "इस answer को बदलो", "इस जानकारी को update करो".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      queryOrId: {
        type: Type.STRING,
        description: 'The topic question or ID of the knowledge item to update.',
      },
      answer: {
        type: Type.STRING,
        description: 'The new authoritative answer.',
      },
      explanation: {
        type: Type.STRING,
        description: 'Optional new explanation.',
      },
      category: {
        type: Type.STRING,
        description: 'Optional category.',
      },
      source: {
        type: Type.STRING,
        description: 'Optional source.',
      },
    },
    required: ['queryOrId', 'answer'],
  },
};

const deleteTeacherKnowledgeDeclaration: FunctionDeclaration = {
  name: 'deleteTeacherKnowledge',
  description: 'Deletes a knowledge item from the permanent database (Teacher Mode only). Used when teacher says "इसे भूल जाओ", "delete this".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      idOrTopic: {
        type: Type.STRING,
        description: 'The ID or topic question of the knowledge item to delete.',
      },
    },
    required: ['idOrTopic'],
  },
};

const listTeacherKnowledgeDeclaration: FunctionDeclaration = {
  name: 'listTeacherKnowledge',
  description: 'Lists or summarizes saved Teacher Knowledge records when teacher asks "मेरी saved knowledge दिखाओ", "क्या क्या याद है?", "मेरी memory दिखाओ".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: 'Optional category filter.',
      },
    },
  },
};

const ALL_GEMINI_TOOLS = [
  searchLiveGkAndWebDeclaration,
  activateTeacherModeByVoiceDeclaration,
  exitTeacherModeDeclaration,
  saveTeacherKnowledgeDeclaration,
  updateTeacherKnowledgeDeclaration,
  deleteTeacherKnowledgeDeclaration,
  searchTeacherKnowledgeDeclaration,
  listTeacherKnowledgeDeclaration,
  reportIncorrectAnswerDeclaration,
  refreshCurrentGkDatabaseDeclaration,
  openWebsiteDeclaration,
];

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

// Authentication Middleware
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !teacherKnowledgeDb.validateSessionToken(authHeader)) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Valid Teacher/Admin session is required to perform this operation.',
    });
    return;
  }
  next();
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    assistant: 'AI Teacher',
    liveApiReady: !!process.env.GEMINI_API_KEY,
    model: 'gemini-3.1-flash-live-preview',
    knowledgeItemsCount: teacherKnowledgeDb.getAll().length,
    feedbackCount: teacherKnowledgeDb.getFeedbackLogs().length,
    time: new Date().toISOString(),
  });
});

// Admin PIN Login Endpoint
app.post('/api/admin/login', (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      res.status(400).json({ success: false, message: 'PIN is required' });
      return;
    }

    const authResult = teacherKnowledgeDb.verifyAdminPin(pin);
    if (!authResult.success) {
      res.status(401).json({ success: false, message: 'Invalid Admin PIN. Access denied.' });
      return;
    }

    res.json({
      success: true,
      token: authResult.token,
      expiresAt: authResult.expiresAt,
      adminName: authResult.adminName,
      message: 'Teacher Knowledge Mode Authenticated Successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Authentication error' });
  }
});

// Admin Session Verification
app.get('/api/admin/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  const isValid = teacherKnowledgeDb.validateSessionToken(authHeader);
  res.json({ success: isValid });
});

// Admin Logout Endpoint
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  teacherKnowledgeDb.invalidateSession(authHeader);
  res.json({ success: true, message: 'Logged out successfully' });
});

// --- Knowledge Base Endpoints ---

// Get active knowledge (accessible to search & preview)
app.get('/api/knowledge/active', (req, res) => {
  const items = teacherKnowledgeDb.getAll(false);
  res.json({ success: true, items });
});

// Get all knowledge (including inactive - admin only)
app.get('/api/knowledge', requireAdminAuth, (req, res) => {
  const items = teacherKnowledgeDb.getAll(true);
  res.json({ success: true, items });
});

// Search knowledge base
app.post('/api/knowledge/search', (req, res) => {
  const { query, limit } = req.body;
  const results = teacherKnowledgeDb.search(query || '', limit || 10);
  res.json({ success: true, results });
});

// Add new knowledge item (Admin only)
app.post('/api/knowledge/add', requireAdminAuth, (req, res) => {
  const { question, answer, explanation, category, keywords, source, sourceUrl, confidence, status, isTimeSensitive } = req.body;
  const result = teacherKnowledgeDb.add({
    question,
    answer,
    explanation,
    category,
    keywords,
    source,
    sourceUrl,
    confidence,
    status,
    isTimeSensitive,
  });

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({ success: true, item: result.item, message: 'ठीक है, मैंने यह जानकारी Teacher Knowledge में सुरक्षित कर दी है।' });
});

// Update knowledge item (Admin only)
app.put('/api/knowledge/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { question, answer, explanation, category, keywords, source, sourceUrl, confidence, status, isTimeSensitive, outdatedReason, isActive, changeReason } = req.body;

  const result = teacherKnowledgeDb.update(id, {
    question,
    answer,
    explanation,
    category,
    keywords,
    source,
    sourceUrl,
    confidence,
    status,
    isTimeSensitive,
    outdatedReason,
    isActive,
    changeReason,
  });

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({ success: true, item: result.item, message: 'Teacher Knowledge updated successfully' });
});

// Mark knowledge item as outdated (Admin only)
app.post('/api/knowledge/outdated', requireAdminAuth, (req, res) => {
  const { idOrTopic, reason } = req.body;
  if (!idOrTopic) {
    res.status(400).json({ success: false, error: 'ID or topic is required' });
    return;
  }
  const result = teacherKnowledgeDb.markAsOutdated(idOrTopic, reason || 'Superseded by newer facts');
  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }
  res.json({ success: true, item: result.item, message: 'Marked as outdated successfully' });
});

// Delete knowledge item (Admin only)
app.delete('/api/knowledge/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const result = teacherKnowledgeDb.delete(id);

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({ success: true, message: 'Knowledge item deleted permanently' });
});

// Restore previous version (Admin only)
app.post('/api/knowledge/:id/restore', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { version } = req.body;

  if (typeof version !== 'number') {
    res.status(400).json({ success: false, error: 'Target version number is required' });
    return;
  }

  const result = teacherKnowledgeDb.restoreVersion(id, version);
  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({ success: true, item: result.item, message: `Restored version v${version} successfully` });
});

// Student Feedback / Error reporting (Public)
app.post('/api/knowledge/feedback', (req, res) => {
  const { question, aiAnswer, studentComment, suggestedCorrection } = req.body;
  if (!question || !studentComment) {
    res.status(400).json({ success: false, error: 'Question and student comment are required' });
    return;
  }
  const result = teacherKnowledgeDb.addStudentFeedback({
    question,
    aiAnswer: aiAnswer || '',
    studentComment,
    suggestedCorrection,
  });
  res.json({ success: true, log: result.log, message: 'Feedback logged for Teacher Review' });
});

// Get Feedback logs (Admin only)
app.get('/api/knowledge/feedback', requireAdminAuth, (req, res) => {
  const logs = teacherKnowledgeDb.getFeedbackLogs();
  res.json({ success: true, logs });
});

// Resolve feedback log (Admin only)
app.post('/api/knowledge/feedback/resolve', requireAdminAuth, (req, res) => {
  const { id, resolutionNote, status } = req.body;
  if (!id) {
    res.status(400).json({ success: false, error: 'Log ID is required' });
    return;
  }
  const result = teacherKnowledgeDb.resolveFeedbackLog(id, resolutionNote || 'Reviewed by Teacher SP', status || 'resolved');
  res.json({ success: result.success });
});

// Trigger Live GK Auto-Refresh (Admin only)
app.post('/api/knowledge/refresh-gk', requireAdminAuth, async (req, res) => {
  try {
    const refreshRes = await liveSearchService.refreshCurrentGkDatabase('SP @9631');
    res.json(refreshRes);
  } catch (err: any) {
    console.error('[Server] Refresh GK error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test Live Search Grounding (Admin Debugger)
app.post('/api/knowledge/live-search-test', requireAdminAuth, async (req, res) => {
  try {
    const { query, category } = req.body;
    if (!query) {
      res.status(400).json({ success: false, error: 'Query is required' });
      return;
    }
    const result = await liveSearchService.searchAndVerifyLiveGk(query, category);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export Knowledge Base Backup (Admin only)
app.get('/api/knowledge/export', requireAdminAuth, (req, res) => {
  const backup = teacherKnowledgeDb.exportBackup();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="teacher_knowledge_backup_${Date.now()}.json"`);
  res.json(backup);
});

// Import Knowledge Base Backup (Admin only)
app.post('/api/knowledge/import', requireAdminAuth, (req, res) => {
  const { data, mode } = req.body;
  const result = teacherKnowledgeDb.importBackup(data, mode || 'merge');

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({ success: true, count: result.count, message: `Successfully imported ${result.count} knowledge items.` });
});

// Reset Knowledge Base to Factory Seed (Admin only)
app.post('/api/knowledge/reset', requireAdminAuth, (req, res) => {
  const result = teacherKnowledgeDb.resetToDefault();
  if (!result.success) {
    res.status(500).json({ success: false, error: result.error });
    return;
  }
  res.json({ success: true, count: result.count, message: 'Knowledge database reset to factory verified state.' });
});

// HTTP REST Voice Fallback API Endpoint
app.post('/api/voice/turn', async (req, res) => {
  try {
    const { prompt, history, adminToken } = req.body;
    const ai = getGeminiClient();

    const userPrompt = prompt || 'नमस्ते, मैं AI Teacher हूँ। आपकी क्या मदद कर सकता हूँ?';
    const isAdmin = teacherKnowledgeDb.validateSessionToken(adminToken);

    const formattedContents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      formattedContents.push(...history);
    }
    formattedContents.push({
      role: 'user',
      parts: [{ text: userPrompt }],
    });

    let chatResponse: any = null;
    try {
      chatResponse = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: formattedContents,
        config: {
          systemInstruction: getFullSystemInstruction(),
          tools: [{ functionDeclarations: ALL_GEMINI_TOOLS }],
        },
      });
    } catch (genErr: any) {
      console.warn('[Server] Gemini generateContent note (using Teacher Knowledge fallback):', genErr?.message || genErr);
      // Resilient local fallback from Teacher Knowledge Base
      const matchingItems = teacherKnowledgeDb.search(userPrompt);
      if (matchingItems.length > 0) {
        const topMatch = matchingItems[0].item;
        const text = `${topMatch.answer}${topMatch.explanation ? ` (${topMatch.explanation})` : ''}`;
        res.json({
          text,
          audio: null,
          functionCalls: [],
          success: true,
          fallback: true,
        });
        return;
      }

      // Check common creator / identity questions
      const lowerPrompt = userPrompt.toLowerCase();
      if (lowerPrompt.includes('कौन हो') || lowerPrompt.includes('who are you') || lowerPrompt.includes('नाम क्या')) {
        res.json({
          text: 'मैं AI Teacher हूँ। मैं आपकी पढ़ाई और सीखने में मदद करने के लिए यहाँ हूँ।',
          audio: null,
          functionCalls: [],
          success: true,
        });
        return;
      }
      if (lowerPrompt.includes('किसने बनाया') || lowerPrompt.includes('who created') || lowerPrompt.includes('who made')) {
        res.json({
          text: 'मुझे SP ने बनाया है, और यह Mithila Academy द्वारा निर्मित किया गया है।',
          audio: null,
          functionCalls: [],
          success: true,
        });
        return;
      }

      res.json({
        text: 'नमस्ते, मैं AI Teacher हूँ। आप अपनी पढ़ाई या GK का कोई भी प्रश्न पूछ सकते हैं।',
        audio: null,
        functionCalls: [],
        success: true,
      });
      return;
    }

    let responseText = chatResponse?.text || 'नमस्ते, मैं AI Teacher हूँ। आपकी क्या मदद कर सकता हूँ?';
    const functionCalls = chatResponse.functionCalls || [];

    // Process server-side Teacher Knowledge & Live GK tool calls if any
    for (const fc of functionCalls) {
      if (fc.name === 'searchLiveGkAndWeb') {
        const args = fc.args as any;
        const searchResult = await liveSearchService.searchAndVerifyLiveGk(args.query || userPrompt, args.category);
        if (searchResult.success && searchResult.confidence !== 'unconfirmed') {
          responseText = `${searchResult.answer}${searchResult.source ? ` (स्रोत: ${searchResult.source})` : ''}`;
        } else {
          responseText = 'मैं इसकी वर्तमान जानकारी विश्वसनीय स्रोत से सत्यापित नहीं कर पा रहा हूँ।';
        }
      } else if (fc.name === 'reportIncorrectAnswer') {
        const args = fc.args as any;
        teacherKnowledgeDb.addStudentFeedback({
          question: args.question || userPrompt,
          aiAnswer: args.aiAnswer || '',
          studentComment: args.studentComment || '',
          suggestedCorrection: args.suggestedCorrection || '',
        });
        responseText = 'धन्यवाद, मैंने इस प्रश्न को Teacher review के लिए दर्ज कर लिया है।';
      } else if (fc.name === 'refreshCurrentGkDatabase') {
        if (!isAdmin) {
          responseText = 'क्षमा करें, केवल अधिकृत Teacher ही GK रिफ्रेश कर सकते हैं।';
        } else {
          const refRes = await liveSearchService.refreshCurrentGkDatabase('SP @9631');
          responseText = `बॉस, Current GK अपडेट पूरा हो गया है। ${refRes.updatedCount} रिकॉर्ड्स अपडेट हुए और ${refRes.newCount} नए रिकॉर्ड्स जोड़े गए।`;
        }
      } else if (fc.name === 'activateTeacherModeByVoice') {
        const args = fc.args as any;
        const phrase = args?.phrase || '';
        const verifyRes = teacherKnowledgeDb.verifyVoiceActivationPhrase(phrase);
        if (verifyRes.success) {
          responseText = 'नमस्ते बॉस! मैं तैयार हूँ। आप आज मुझे कौन-सा डेटा सिखाना चाह रहे हैं?';
        } else {
          responseText = 'क्षमा करें, यह गुप्त Teacher PIN मान्य नहीं है।';
        }
      } else if (fc.name === 'exitTeacherMode') {
        responseText = 'ठीक है, Teacher Mode बंद कर दिया गया है। अब मैं सामान्य Student Mode में हूँ।';
      } else if (fc.name === 'saveTeacherKnowledge') {
        if (!isAdmin) {
          responseText = 'क्षमा करें, केवल अधिकृत Teacher ही PIN सत्यापन के बाद नया ज्ञान सुरक्षित कर सकते हैं।';
        } else {
          const args = fc.args as any;
          const addRes = teacherKnowledgeDb.add(
            {
              question: args.question,
              answer: args.answer,
              explanation: args.explanation,
              category: args.category,
              keywords: args.keywords,
              source: args.source || 'Teacher SP Verified',
            },
            'SP @9631'
          );
          if (addRes.success) {
            responseText = 'ठीक है बॉस, मैंने इसे Teacher Knowledge में सुरक्षित कर लिया है।';
          } else {
            responseText = 'बॉस, इसे अभी permanent memory में save नहीं किया जा सका।';
          }
        }
      } else if (fc.name === 'updateTeacherKnowledge') {
        if (!isAdmin) {
          responseText = 'क्षमा करें, केवल अधिकृत Teacher ही जानकारी बदल सकते हैं।';
        } else {
          const args = fc.args as any;
          const upRes = teacherKnowledgeDb.updateByTopicOrId(
            args.queryOrId,
            {
              answer: args.answer,
              explanation: args.explanation,
              category: args.category,
              source: args.source,
            },
            'SP @9631'
          );
          if (upRes.success) {
            responseText = 'ठीक है बॉस, मैंने Teacher Knowledge अपडेट कर दी है।';
          } else {
            responseText = 'क्षमा करें, यह टॉपिक नहीं मिला।';
          }
        }
      } else if (fc.name === 'deleteTeacherKnowledge') {
        if (!isAdmin) {
          responseText = 'क्षमा करें, केवल अधिकृत Teacher ही Knowledge हटा सकते हैं।';
        } else {
          const args = fc.args as any;
          teacherKnowledgeDb.deleteByTopicOrId(args.idOrTopic);
          responseText = 'ठीक है बॉस, यह जानकारी Teacher Knowledge से हटा दी गई है।';
        }
      } else if (fc.name === 'listTeacherKnowledge') {
        const allItems = teacherKnowledgeDb.getAll(false);
        responseText = `बॉस, मेरे पास कुल ${allItems.length} सक्रिय Teacher Knowledge रिकॉर्ड्स सुरक्षित हैं।`;
      }
    }

    // Generate high-quality voice audio with Gemini TTS ('Kore' voice)
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

// ==========================================
// WEBSOCKET LIVE VOICE API
// ==========================================

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[LiveWS] Client connected to AI Teacher live voice session');

  let ai: GoogleGenAI;
  try {
    ai = getGeminiClient();
  } catch (err: any) {
    clientWs.send(
      JSON.stringify({
        type: 'error',
        message: err?.message || 'GEMINI_API_KEY is not configured on the server.',
      })
    );
    return;
  }

  let liveSession: any = null;
  let isSessionOpen = false;
  let isClientAdmin = false;

  try {
    liveSession = await (ai.live as any).connect({
      model: 'gemini-3.1-flash-live-preview',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Kore',
            },
          },
        },
        systemInstruction: getFullSystemInstruction(),
        tools: [{ functionDeclarations: ALL_GEMINI_TOOLS }],
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
        onmessage: async (message: any) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;

          // 1. Audio output chunks
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts && parts.length > 0) {
            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data,
                  })
                );
              }
            }
          }

          // 2. Interruption event
          if (message.serverContent?.interrupted) {
            console.log('[LiveWS] Assistant output interrupted by user speech');
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }

          // 3. Tool Calling events from Gemini
          if (message.toolCall) {
            console.log('[LiveWS] Tool call requested by Gemini:', message.toolCall);
            const functionCalls = message.toolCall.functionCalls || [];
            const serverHandledResponses: any[] = [];
            const clientForwardCalls: any[] = [];

            for (const fc of functionCalls) {
              const callId = fc.id || `call_${Date.now()}`;
              const name = fc.name;
              const args = fc.args || {};

              if (name === 'searchLiveGkAndWeb') {
                console.log(`[LiveWS] Searching live GK for query: "${args.query}"`);
                try {
                  const verified = await liveSearchService.searchAndVerifyLiveGk(args.query, args.category);
                  serverHandledResponses.push({
                    id: callId,
                    name,
                    response: {
                      success: verified.success,
                      answer: verified.answer,
                      explanation: verified.explanation,
                      source: verified.source,
                      sourceUrl: verified.sourceUrl,
                      verificationDate: verified.verificationDate,
                      confidence: verified.confidence,
                      isTimeSensitive: verified.isTimeSensitive,
                    },
                  });

                  // Notify frontend UI with verification grounding info
                  clientWs.send(
                    JSON.stringify({
                      type: 'live_gk_grounding',
                      query: args.query,
                      result: verified,
                    })
                  );
                } catch (searchErr: any) {
                  serverHandledResponses.push({
                    id: callId,
                    name,
                    response: {
                      success: false,
                      error: searchErr.message,
                      message: 'मैं इसकी वर्तमान जानकारी विश्वसनीय स्रोत से सत्यापित नहीं कर पा रहा हूँ।',
                    },
                  });
                }
              } else if (name === 'reportIncorrectAnswer') {
                const fbRes = teacherKnowledgeDb.addStudentFeedback({
                  question: args.question || 'Student Query',
                  aiAnswer: args.aiAnswer || '',
                  studentComment: args.studentComment || 'Flagged as incorrect',
                  suggestedCorrection: args.suggestedCorrection || '',
                });

                serverHandledResponses.push({
                  id: callId,
                  name,
                  response: {
                    success: true,
                    message: 'धन्यवाद, मैंने इस प्रश्न को Teacher review के लिए दर्ज कर लिया है।',
                    logId: fbRes.log?.id,
                  },
                });

                clientWs.send(
                  JSON.stringify({
                    type: 'feedback_logged',
                    log: fbRes.log,
                  })
                );
              } else if (name === 'refreshCurrentGkDatabase') {
                if (!isClientAdmin) {
                  serverHandledResponses.push({
                    id: callId,
                    name,
                    response: {
                      success: false,
                      error: 'Unauthorized: Only Teacher/Admin can refresh GK database.',
                    },
                  });
                } else {
                  const refRes = await liveSearchService.refreshCurrentGkDatabase('SP @9631');
                  serverHandledResponses.push({
                    id: callId,
                    name,
                    response: {
                      success: true,
                      updatedCount: refRes.updatedCount,
                      newCount: refRes.newCount,
                      message: `बॉस, Current GK अपडेट पूरा हो गया है। ${refRes.updatedCount} रिकॉर्ड्स अपडेट हुए और ${refRes.newCount} नए रिकॉर्ड्स जोड़े गए।`,
                    },
                  });

                  clientWs.send(
                    JSON.stringify({
                      type: 'gk_refresh_completed',
                      result: refRes,
                    })
                  );
                }
              } else if (name === 'activateTeacherModeByVoice') {
                const phrase = args.phrase || '';
                const verifyRes = teacherKnowledgeDb.verifyVoiceActivationPhrase(phrase);
                if (verifyRes.success) {
                  isClientAdmin = true;
                  console.log('[LiveWS] Voice PIN authenticated successfully for Teacher SP');

                  clientWs.send(
                    JSON.stringify({
                      type: 'teacher_mode_activated',
                      token: verifyRes.token,
                      adminName: verifyRes.adminName,
                      message: 'Teacher Mode Activated',
                    })
                  );

                  serverHandledResponses.push({
                    id: callId,
                    name,
                    response: {
                      success: true,
                      authenticated: true,
                      adminName: verifyRes.adminName,
                      greeting: 'नमस्ते बॉस! मैं तैयार हूँ। आप आज मुझे कौन-सा डेटा सिखाना चाह रहे हैं?',
                    },
                  });
                } else {
                  serverHandledResponses.push({
                    id: callId,
                    name,
                    response: {
                      success: false,
                      error: 'Invalid PIN',
                      message: 'क्षमा करें, गुप्त Teacher PIN अमान्य है।',
                    },
                  });
                }
              } else if (name === 'exitTeacherMode') {
                isClientAdmin = false;
                console.log('[LiveWS] Teacher Mode deactivated via voice');

                clientWs.send(
                  JSON.stringify({
                    type: 'teacher_mode_deactivated',
                    message: 'Teacher Mode Deactivated',
                  })
                );

                serverHandledResponses.push({
                  id: callId,
                  name,
                  response: {
                    success: true,
                    deactivated: true,
                    message: 'ठीक है, Teacher Mode बंद कर दिया गया है। अब मैं सामान्य Student Mode में हूँ।',
                  },
                });
              } else if (name === 'saveTeacherKnowledge') {
                if (!isClientAdmin) {
                  serverHandledResponses.push({
                    id: callId,
                    name,
                    response: {
                      success: false,
                      error: 'Unauthorized',
                      message:
                        'क्षमा करें, केवल अधिकृत Teacher ही PIN सत्यापन के बाद नया ज्ञान सुरक्षित कर सकते हैं।',
                    },
                  });
                } else {
                  const saveRes = teacherKnowledgeDb.add(
                    {
                      question: args.question,
                      answer: args.answer,
                      explanation: args.explanation,
                      category: args.category,
                      keywords: args.keywords,
                      source: args.source || 'Teacher SP Verified',
                    },
                    'SP @9631'
                  );

                  serverHandledResponses.push({
                    id: callId,
                    name,
                    response: saveRes.success
                      ? {
                          success: true,
                          message: 'ठीक है बॉस, मैंने इसे Teacher Knowledge में सुरक्षित कर लिया है।',
                          item: saveRes.item,
                        }
                      : {
                          success: false,
                          error: 'Database write error',
                          message: 'बॉस, इसे अभी permanent memory में save नहीं किया जा सका।',
                        },
                  });

                  clientWs.send(
                    JSON.stringify({
                      type: 'knowledge_updated',
                      action: 'added',
                      item: saveRes.item,
                    })
                  );
                }
              } else if (name === 'updateTeacherKnowledge') {
                if (!isClientAdmin) {
                  serverHandledResponses.push({
                    id: callId,
                    name,
                    response: {
                      success: false,
                      error: 'Unauthorized: Only Teacher can update knowledge.',
                    },
                  });
                } else {
                  const upRes = teacherKnowledgeDb.updateByTopicOrId(
                    args.queryOrId,
                    {
                      answer: args.answer,
                      explanation: args.explanation,
                      category: args.category,
                      source: args.source,
                    },
                    'SP @9631'
                  );

                  serverHandledResponses.push({
                    id: callId,
                    name,
                    response: upRes.success
                      ? {
                          success: true,
                          message: 'ठीक है बॉस, मैंने Teacher Knowledge अपडेट कर दी है।',
                          item: upRes.item,
                        }
                      : {
                          success: false,
                          error: upRes.error,
                          message: 'क्षमा करें बॉस, यह टॉपिक नहीं मिला।',
                        },
                  });

                  clientWs.send(
                    JSON.stringify({
                      type: 'knowledge_updated',
                      action: 'updated',
                      item: upRes.item,
                    })
                  );
                }
              } else if (name === 'searchTeacherKnowledge') {
                const results = teacherKnowledgeDb.search(args.query || '', 5);
                serverHandledResponses.push({
                  id: callId,
                  name,
                  response: {
                    found: results.length > 0,
                    count: results.length,
                    results: results.map((r) => ({
                      question: r.item.question,
                      answer: r.item.answer,
                      explanation: r.item.explanation,
                      category: r.item.category,
                      source: r.item.source,
                      confidence: r.item.confidence,
                    })),
                  },
                });
              } else if (name === 'listTeacherKnowledge') {
                const all = teacherKnowledgeDb.getAll(false);
                serverHandledResponses.push({
                  id: callId,
                  name,
                  response: {
                    total: all.length,
                    items: all.slice(0, 10).map((k) => ({
                      question: k.question,
                      answer: k.answer,
                      category: k.category,
                      source: k.source,
                    })),
                  },
                });
              } else if (name === 'deleteTeacherKnowledge') {
                if (!isClientAdmin) {
                  serverHandledResponses.push({
                    id: callId,
                    name,
                    response: {
                      success: false,
                      error: 'Unauthorized: Only Teacher can delete knowledge.',
                    },
                  });
                } else {
                  const delRes = teacherKnowledgeDb.deleteByTopicOrId(args.idOrTopic);
                  serverHandledResponses.push({
                    id: callId,
                    name,
                    response: delRes.success
                      ? { success: true, message: 'ठीक है बॉस, यह जानकारी Teacher Knowledge से हटा दी गई है।' }
                      : { success: false, message: delRes.error },
                  });

                  clientWs.send(
                    JSON.stringify({
                      type: 'knowledge_updated',
                      action: 'deleted',
                    })
                  );
                }
              } else {
                // Client-side handled tool (e.g. openWebsite)
                clientForwardCalls.push(fc);
              }
            }

            // Return server-handled tool responses directly to Gemini Live
            if (serverHandledResponses.length > 0 && isSessionOpen && liveSession) {
              try {
                await liveSession.sendToolResponse({
                  functionResponses: serverHandledResponses,
                });
              } catch (resErr) {
                console.error('[LiveWS] Error sending server tool response to Gemini:', resErr);
              }
            }

            // Forward client tools to frontend if any
            if (clientForwardCalls.length > 0) {
              clientWs.send(
                JSON.stringify({
                  type: 'tool_call',
                  toolCall: { functionCalls: clientForwardCalls },
                })
              );
            }
          }
        },
        onerror: (err: any) => {
          console.error('[LiveWS] Gemini Live error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'error',
                message: err?.message || 'Error communicating with Gemini Live API',
              })
            );
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
      clientWs.send(
        JSON.stringify({
          type: 'error',
          message: `Failed to initiate Gemini Live: ${err?.message || 'Check model and API key'}`,
        })
      );
    }
    return;
  }

  // Handle incoming client messages
  clientWs.on('message', async (rawMsg) => {
    try {
      const data = JSON.parse(rawMsg.toString());

      if (data.type === 'admin_auth' && data.token) {
        isClientAdmin = teacherKnowledgeDb.validateSessionToken(data.token);
        clientWs.send(
          JSON.stringify({
            type: 'admin_auth_status',
            authenticated: isClientAdmin,
            teacherMode: isClientAdmin,
          })
        );
        console.log(`[LiveWS] Client admin auth status: ${isClientAdmin ? 'AUTHORIZED (Teacher SP)' : 'UNAUTHORIZED'}`);
      } else if (data.type === 'audio' && data.audio && isSessionOpen && liveSession) {
        await liveSession.sendRealtimeInput({
          audio: {
            data: data.audio,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      } else if (data.type === 'tool_response' && data.functionResponses && isSessionOpen && liveSession) {
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

// WebSocket Upgrade handler
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
    console.log(`SPA AI Teacher Voice Assistant running on http://0.0.0.0:${PORT}`);
  });
}

start();
