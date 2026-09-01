import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface TeacherKnowledgeHistory {
  version: number;
  question: string;
  answer: string;
  explanation?: string;
  category?: string;
  keywords?: string[];
  source?: string;
  sourceUrl?: string;
  verificationDate?: string;
  confidence?: 'verified' | 'high' | 'provisional' | 'outdated';
  status?: 'active' | 'outdated' | 'under_review' | 'corrected';
  updatedAt: string;
  updatedBy: string;
  changeReason?: string;
}

export interface TeacherKnowledgeItem {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  category: string;
  keywords: string[];
  source: string;
  sourceUrl?: string;
  verificationDate: string;
  confidence: 'verified' | 'high' | 'provisional' | 'outdated';
  status: 'active' | 'outdated' | 'under_review' | 'corrected';
  isTimeSensitive: boolean;
  outdatedReason?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  isActive: boolean;
  history?: TeacherKnowledgeHistory[];
}

export interface StudentFeedbackLog {
  id: string;
  question: string;
  aiAnswer: string;
  studentComment: string;
  suggestedCorrection?: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  resolutionNote?: string;
}

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'teacher_knowledge.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'student_feedback_logs.json');

// Secret salt and session secret for cryptographic authentication
const PIN_SALT = 'SPA_TEACHER_ADMIN_SALT_v1_MITHILA_ACADEMY_SECURE';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Precomputed SHA-256 hashes for normalized PINs with PIN_SALT:
// "SP@9631" and "SP9631"
const EXPECTED_PIN_HASH_AT = crypto
  .createHash('sha256')
  .update(`${PIN_SALT}:SP@9631`)
  .digest('hex');

const EXPECTED_PIN_HASH_PLAIN = crypto
  .createHash('sha256')
  .update(`${PIN_SALT}:SP9631`)
  .digest('hex');

// In-memory active tokens mapping: token -> { expiresAt: number; user: string }
const activeSessions = new Map<string, { expiresAt: number; user: string }>();

// Initial starter seed knowledge if DB does not exist yet (with verified 2026/current data and official sources)
const INITIAL_SEED_KNOWLEDGE: TeacherKnowledgeItem[] = [
  {
    id: 'know_seed_president_india',
    question: 'Who is the current President of India? / भारत के वर्तमान राष्ट्रपति कौन हैं?',
    answer: 'भारत की वर्तमान राष्ट्रपति श्रीमती द्रौपदी मुर्मू (Droupadi Murmu) हैं। वे भारत की 15वीं राष्ट्रपति तथा देश की पहली आदिवासी महिला राष्ट्रपति हैं।',
    explanation: 'श्रीमती द्रौपदी मुर्मू ने 25 जुलाई 2022 को पदभार ग्रहण किया था।',
    category: 'Appointments',
    keywords: ['president of india', 'राष्ट्रपति', 'द्रौपदी मुर्मू', 'droupadi murmu', 'current president', 'वर्तमान राष्ट्रपति'],
    source: 'President of India Official Secretariat / rashtrapatibhavan.gov.in',
    sourceUrl: 'https://rashtrapatibhavan.gov.in',
    verificationDate: new Date().toISOString(),
    confidence: 'verified',
    status: 'active',
    isTimeSensitive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SP @9631',
    version: 1,
    isActive: true,
    history: [],
  },
  {
    id: 'know_seed_pm_india',
    question: 'Who is the current Prime Minister of India? / भारत के वर्तमान प्रधानमंत्री कौन हैं?',
    answer: 'भारत के वर्तमान प्रधानमंत्री श्री नरेंद्र मोदी (Narendra Modi) हैं। वे 2014 से लगातार भारत के प्रधानमंत्री के रूप में सेवारत हैं।',
    explanation: 'श्री नरेंद्र मोदी भारत के 14वें प्रधानमंत्री हैं।',
    category: 'Appointments',
    keywords: ['prime minister', 'प्रधानमंत्री', 'नरेंद्र मोदी', 'narendra modi', 'current pm', 'वर्तमान प्रधानमंत्री'],
    source: 'Prime Minister Office (PMO India) / pmindia.gov.in',
    sourceUrl: 'https://www.pmindia.gov.in',
    verificationDate: new Date().toISOString(),
    confidence: 'verified',
    status: 'active',
    isTimeSensitive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SP @9631',
    version: 1,
    isActive: true,
    history: [],
  },
  {
    id: 'know_seed_education_minister',
    question: 'Who is the current Education Minister of India? / भारत के वर्तमान शिक्षा मंत्री कौन हैं?',
    answer: 'भारत के वर्तमान शिक्षा मंत्री श्री धर्मेंद्र प्रधान (Dharmendra Pradhan) हैं। वे केंद्रीय शिक्षा तथा कौशल विकास एवं उद्यमिता मंत्री हैं।',
    explanation: 'शिक्षा मंत्रालय भारत में राष्ट्रीय शिक्षा नीति (NEP) और स्कूली व उच्च शिक्षा के क्रियान्वयन का नेतृत्व करता है।',
    category: 'Appointments',
    keywords: ['education minister', 'शिक्षा मंत्री', 'dharmendra pradhan', 'धर्मेंद्र प्रधान', 'education'],
    source: 'Ministry of Education, Government of India / education.gov.in',
    sourceUrl: 'https://www.education.gov.in',
    verificationDate: new Date().toISOString(),
    confidence: 'verified',
    status: 'active',
    isTimeSensitive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SP @9631',
    version: 1,
    isActive: true,
    history: [],
  },
  {
    id: 'know_seed_isro_chief',
    question: 'Who is the current Chairman of ISRO? / इसरो (ISRO) के वर्तमान अध्यक्ष कौन हैं?',
    answer: 'भारतीय अंतरिक्ष अनुसंधान संगठन (ISRO) के वर्तमान अध्यक्ष श्री एस. सोमनाथ (S. Somanath) हैं। वे अंतरिक्ष विभाग के सचिव भी हैं।',
    explanation: 'उनके नेतृत्व में चंद्रयान-3 और आदित्य-L1 जैसी ऐतिहासिक अंतरिक्ष उपलब्धियां हासिल हुईं।',
    category: 'Science & Tech',
    keywords: ['isro', 'isro chairman', 'इसरो अध्यक्ष', 's somanath', 'एस सोमनाथ', 'space'],
    source: 'Indian Space Research Organisation (ISRO) / isro.gov.in',
    sourceUrl: 'https://www.isro.gov.in',
    verificationDate: new Date().toISOString(),
    confidence: 'verified',
    status: 'active',
    isTimeSensitive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SP @9631',
    version: 1,
    isActive: true,
    history: [],
  },
  {
    id: 'know_seed_physics_c',
    question: 'What is the speed of light in vacuum? / प्रकाश की गति कितनी है?',
    answer: 'प्रकाश की गति निर्वात (vacuum) में लगभग 299,792,458 मीटर प्रति सेकंड (या लगभग 3 × 10⁸ m/s) होती है।',
    explanation: 'यह भौतिकी का एक मूलभूत नियतांक (fundamental constant) है जिसे c से दर्शाया जाता है।',
    category: 'Physics',
    keywords: ['speed of light', 'प्रकाश की गति', 'vacuum', 'physics', 'c', 'light'],
    source: 'NIST Standard Reference Data / Physical Constants',
    sourceUrl: 'https://physics.nist.gov/constants',
    verificationDate: new Date().toISOString(),
    confidence: 'verified',
    status: 'active',
    isTimeSensitive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SP @9631',
    version: 1,
    isActive: true,
    history: [],
  },
  {
    id: 'know_seed_academy_rules',
    question: 'What is the core learning rule of Mithila Academy? / हमारी कक्षा का मुख्य नियम क्या है?',
    answer: 'Mithila Academy का मुख्य नियम है: "प्रतिदिन निरंतर अभ्यास, गहरे संकल्पनाओं (concepts) की समझ और नियमित प्रश्न पूछना।"',
    explanation: 'Teacher SP द्वारा निर्धारित दिशा-निर्देश के अनुसार अनुशासन और निरंतरता ही सफलता की कुंजी है।',
    category: 'Class Rules',
    keywords: ['rule', 'class rule', 'academy rule', 'नियम', 'mithila academy', 'discipline'],
    source: 'Mithila Academy Official Academic Charter (SP)',
    sourceUrl: '',
    verificationDate: new Date().toISOString(),
    confidence: 'verified',
    status: 'active',
    isTimeSensitive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SP @9631',
    version: 1,
    isActive: true,
    history: [],
  },
  {
    id: 'know_seed_math_pythagoras',
    question: 'What is the Pythagorean Theorem? / पाइथागोरस प्रमेय क्या है?',
    answer: 'पाइथागोरस प्रमेय के अनुसार किसी समकोण त्रिभुज (Right-Angled Triangle) में कर्ण का वर्ग अन्य दो भुजाओं के वर्गों के योग के बराबर होता है: a² + b² = c²।',
    explanation: 'जहाँ a और b लंब व आधार हैं, और c समकोण के सामने वाली सबसे लंबी भुजा (कर्ण/Hypotenuse) है।',
    category: 'Mathematics',
    keywords: ['pythagoras', 'theorem', 'पाइथागोरस', 'triangle', 'a2+b2=c2', 'math'],
    source: 'NCERT Standard Mathematics Curriculum',
    sourceUrl: 'https://ncert.nic.in',
    verificationDate: new Date().toISOString(),
    confidence: 'verified',
    status: 'active',
    isTimeSensitive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SP @9631',
    version: 1,
    isActive: true,
    history: [],
  },
];

class TeacherKnowledgeDatabase {
  private items: TeacherKnowledgeItem[] = [];
  private feedbackLogs: StudentFeedbackLog[] = [];
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize items with new fields if missing
          this.items = parsed.map((item) => ({
            ...item,
            source: item.source || 'Teacher SP Verified',
            verificationDate: item.verificationDate || item.updatedAt || new Date().toISOString(),
            confidence: item.confidence || 'verified',
            status: item.status || (item.isActive ? 'active' : 'outdated'),
            isTimeSensitive: item.isTimeSensitive !== undefined ? item.isTimeSensitive : false,
          }));
          this.isLoaded = true;
          console.log(`[KnowledgeDB] Loaded ${this.items.length} knowledge items from disk.`);
        } else {
          this.items = INITIAL_SEED_KNOWLEDGE;
          this.saveToDisk();
          this.isLoaded = true;
        }
      } else {
        this.items = INITIAL_SEED_KNOWLEDGE;
        this.saveToDisk();
        this.isLoaded = true;
        console.log(`[KnowledgeDB] Initialized database with ${this.items.length} seed items.`);
      }

      // Load feedback logs
      if (fs.existsSync(FEEDBACK_FILE)) {
        try {
          const rawFeedback = fs.readFileSync(FEEDBACK_FILE, 'utf-8');
          const parsed = JSON.parse(rawFeedback);
          if (Array.isArray(parsed)) {
            this.feedbackLogs = parsed;
          }
        } catch {
          this.feedbackLogs = [];
        }
      }
    } catch (err) {
      console.error('[KnowledgeDB] Error initializing knowledge database:', err);
      this.items = INITIAL_SEED_KNOWLEDGE;
      this.isLoaded = true;
    }
  }

  private saveToDisk(): boolean {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.items, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
      return true;
    } catch (err) {
      console.error('[KnowledgeDB] Error saving knowledge database to disk:', err);
      return false;
    }
  }

  private saveFeedbackToDisk(): boolean {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${FEEDBACK_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.feedbackLogs, null, 2), 'utf-8');
      fs.renameSync(tmpFile, FEEDBACK_FILE);
      return true;
    } catch (err) {
      console.error('[KnowledgeDB] Error saving feedback logs to disk:', err);
      return false;
    }
  }

  // --- Authentication & Security Methods ---

  private normalizePinOrPhrase(raw: string): string[] {
    if (!raw || typeof raw !== 'string') return [];
    let s = raw.toLowerCase().trim();

    // Convert Hindi numerals: ०-९ to 0-9
    const hindiDigits: Record<string, string> = {
      '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
      '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
    };
    for (const [h, d] of Object.entries(hindiDigits)) {
      s = s.split(h).join(d);
    }

    // Convert spoken voice phrases and Hindi phonetic words
    s = s
      .replace(/at\s*the\s*rate/g, '@')
      .replace(/at\s*rate/g, '@')
      .replace(/ऐट\s*द\s*रेट/g, '@')
      .replace(/ऐट\s*रेट/g, '@')
      .replace(/ऐट/g, '@')
      .replace(/एट/g, '@')
      .replace(/रेट/g, '@')
      .replace(/एस\s*पी/g, 'sp')
      .replace(/ninety[\s-]*six[\s-]*thirty[\s-]*one/g, '9631')
      .replace(/nine[\s-]*six[\s-]*three[\s-]*one/g, '9631')
      .replace(/नौ[\s]*छह[\s]*तीन[\s]*एक/g, '9631')
      .replace(/छियानवे[\s]*इकतीस/g, '9631')
      .replace(/छियान्वे[\s]*इकतीस/g, '9631')
      .replace(/९६३१/g, '9631');

    // Candidate 1: clean with '@' preserved
    const candidateAt = s.replace(/[^a-z0-9@]/g, '').toUpperCase();
    // Candidate 2: clean purely alphanumeric (no '@')
    const candidatePlain = s.replace(/[^a-z0-9]/g, '').toUpperCase();

    return Array.from(new Set([candidateAt, candidatePlain])).filter(Boolean);
  }

  public verifyAdminPin(rawPin: string): { success: boolean; token?: string; expiresAt?: number; adminName?: string } {
    if (!rawPin || typeof rawPin !== 'string') {
      return { success: false };
    }

    const candidates = this.normalizePinOrPhrase(rawPin);
    let isMatch = false;

    for (const candidate of candidates) {
      const hash = crypto.createHash('sha256').update(`${PIN_SALT}:${candidate}`).digest('hex');
      if (
        crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(EXPECTED_PIN_HASH_AT)) ||
        crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(EXPECTED_PIN_HASH_PLAIN))
      ) {
        isMatch = true;
        break;
      }
    }

    if (!isMatch) {
      return { success: false };
    }

    const token = `tk_${crypto.randomBytes(24).toString('hex')}`;
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours validity

    activeSessions.set(token, {
      expiresAt,
      user: 'SP @9631',
    });

    return {
      success: true,
      token,
      expiresAt,
      adminName: 'SP @9631',
    };
  }

  public verifyVoiceActivationPhrase(rawPhrase: string): { success: boolean; token?: string; expiresAt?: number; adminName?: string } {
    return this.verifyAdminPin(rawPhrase);
  }

  public validateSessionToken(token?: string): boolean {
    if (!token || typeof token !== 'string') return false;
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    const session = activeSessions.get(cleanToken);
    if (!session) return false;

    if (Date.now() > session.expiresAt) {
      activeSessions.delete(cleanToken);
      return false;
    }
    return true;
  }

  public invalidateSession(token?: string): boolean {
    if (!token) return false;
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    return activeSessions.delete(cleanToken);
  }

  // --- CRUD Operations ---

  public getAll(includeInactive = true): TeacherKnowledgeItem[] {
    if (includeInactive) {
      return [...this.items];
    }
    return this.items.filter((i) => i.isActive && i.status !== 'outdated');
  }

  public getById(id: string): TeacherKnowledgeItem | undefined {
    return this.items.find((i) => i.id === id);
  }

  public search(query: string, limit = 5): { item: TeacherKnowledgeItem; score: number; matchedFields: string[] }[] {
    if (!query || !query.trim()) {
      return this.items
        .filter((i) => i.isActive)
        .slice(0, limit)
        .map((item) => ({ item, score: 1.0, matchedFields: ['all'] }));
    }

    const cleanQuery = query.toLowerCase().trim();
    const queryTokens = cleanQuery.split(/[\s,?.!-]+/).filter((t) => t.length > 1);

    const scored: { item: TeacherKnowledgeItem; score: number; matchedFields: string[] }[] = [];

    for (const item of this.items) {
      if (!item.isActive && item.status !== 'active') continue;

      let score = 0;
      const matchedFields: string[] = [];

      const qLower = item.question.toLowerCase();
      const aLower = item.answer.toLowerCase();
      const expLower = (item.explanation || '').toLowerCase();
      const catLower = item.category.toLowerCase();
      const kwLower = item.keywords.map((k) => k.toLowerCase());

      // 1. Exact or near phrase match in Question (Highest weight)
      if (qLower.includes(cleanQuery)) {
        score += 12.0;
        matchedFields.push('question_exact');
      } else if (cleanQuery.includes(qLower) && qLower.length > 5) {
        score += 10.0;
        matchedFields.push('question_contained');
      }

      // 2. Keyword exact matches
      for (const kw of kwLower) {
        if (cleanQuery.includes(kw) || kw.includes(cleanQuery)) {
          score += 7.0;
          if (!matchedFields.includes('keywords')) matchedFields.push('keywords');
        }
      }

      // 3. Category match
      if (cleanQuery.includes(catLower)) {
        score += 4.0;
        matchedFields.push('category');
      }

      // 4. Token matches in Question, Answer, and Explanation
      for (const token of queryTokens) {
        if (qLower.includes(token)) {
          score += 3.0;
          if (!matchedFields.includes('question_token')) matchedFields.push('question_token');
        }
        if (kwLower.some((k) => k.includes(token))) {
          score += 2.5;
          if (!matchedFields.includes('keywords')) matchedFields.push('keywords');
        }
        if (aLower.includes(token)) {
          score += 1.5;
          if (!matchedFields.includes('answer')) matchedFields.push('answer');
        }
        if (expLower.includes(token)) {
          score += 0.5;
          if (!matchedFields.includes('explanation')) matchedFields.push('explanation');
        }
      }

      // Boost for verified current facts
      if (item.confidence === 'verified') score += 2.0;
      if (item.isTimeSensitive) score += 1.5;

      if (score > 0) {
        scored.push({ item, score, matchedFields });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  public add(data: {
    question: string;
    answer: string;
    explanation?: string;
    category?: string;
    keywords?: string[];
    source?: string;
    sourceUrl?: string;
    verificationDate?: string;
    confidence?: 'verified' | 'high' | 'provisional' | 'outdated';
    status?: 'active' | 'outdated' | 'under_review' | 'corrected';
    isTimeSensitive?: boolean;
  }, author = 'SP @9631'): { success: boolean; item?: TeacherKnowledgeItem; error?: string } {
    if (!data.question || !data.question.trim()) {
      return { success: false, error: 'Question / topic is required' };
    }
    if (!data.answer || !data.answer.trim()) {
      return { success: false, error: 'Authoritative answer is required' };
    }

    const now = new Date().toISOString();
    const newItem: TeacherKnowledgeItem = {
      id: `know_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      question: data.question.trim(),
      answer: data.answer.trim(),
      explanation: data.explanation?.trim() || '',
      category: data.category?.trim() || 'General Knowledge',
      keywords: Array.isArray(data.keywords)
        ? data.keywords.map((k) => k.trim()).filter(Boolean)
        : [],
      source: data.source?.trim() || 'Teacher SP Verified',
      sourceUrl: data.sourceUrl?.trim() || '',
      verificationDate: data.verificationDate || now,
      confidence: data.confidence || 'verified',
      status: data.status || 'active',
      isTimeSensitive: data.isTimeSensitive !== undefined ? data.isTimeSensitive : false,
      createdAt: now,
      updatedAt: now,
      createdBy: author,
      version: 1,
      isActive: true,
      history: [],
    };

    this.items.unshift(newItem);
    const saved = this.saveToDisk();
    if (!saved) {
      this.items.shift();
      return { success: false, error: 'Failed to write knowledge item to persistent database.' };
    }

    return { success: true, item: newItem };
  }

  public update(
    id: string,
    data: {
      question?: string;
      answer?: string;
      explanation?: string;
      category?: string;
      keywords?: string[];
      source?: string;
      sourceUrl?: string;
      verificationDate?: string;
      confidence?: 'verified' | 'high' | 'provisional' | 'outdated';
      status?: 'active' | 'outdated' | 'under_review' | 'corrected';
      isTimeSensitive?: boolean;
      outdatedReason?: string;
      isActive?: boolean;
      changeReason?: string;
    },
    author = 'SP @9631'
  ): { success: boolean; item?: TeacherKnowledgeItem; error?: string } {
    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) {
      return { success: false, error: `Knowledge item with id '${id}' not found.` };
    }

    const current = this.items[index];

    // Archive previous version into history
    const historyEntry: TeacherKnowledgeHistory = {
      version: current.version,
      question: current.question,
      answer: current.answer,
      explanation: current.explanation,
      category: current.category,
      keywords: [...current.keywords],
      source: current.source,
      sourceUrl: current.sourceUrl,
      verificationDate: current.verificationDate,
      confidence: current.confidence,
      status: current.status,
      updatedAt: current.updatedAt,
      updatedBy: current.createdBy,
      changeReason: data.changeReason || (data.outdatedReason ? `Outdated: ${data.outdatedReason}` : 'Update/Correction'),
    };

    const history = Array.isArray(current.history) ? [...current.history, historyEntry] : [historyEntry];

    const updatedItem: TeacherKnowledgeItem = {
      ...current,
      question: data.question !== undefined ? data.question.trim() : current.question,
      answer: data.answer !== undefined ? data.answer.trim() : current.answer,
      explanation: data.explanation !== undefined ? data.explanation.trim() : current.explanation,
      category: data.category !== undefined ? data.category.trim() : current.category,
      keywords: Array.isArray(data.keywords)
        ? data.keywords.map((k) => k.trim()).filter(Boolean)
        : current.keywords,
      source: data.source !== undefined ? data.source.trim() : current.source,
      sourceUrl: data.sourceUrl !== undefined ? data.sourceUrl.trim() : current.sourceUrl,
      verificationDate: data.verificationDate !== undefined ? data.verificationDate : current.verificationDate,
      confidence: data.confidence !== undefined ? data.confidence : current.confidence,
      status: data.status !== undefined ? data.status : current.status,
      isTimeSensitive: data.isTimeSensitive !== undefined ? data.isTimeSensitive : current.isTimeSensitive,
      outdatedReason: data.outdatedReason !== undefined ? data.outdatedReason : current.outdatedReason,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : current.isActive,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
      createdBy: author,
      history,
    };

    const oldItem = this.items[index];
    this.items[index] = updatedItem;

    const saved = this.saveToDisk();
    if (!saved) {
      this.items[index] = oldItem;
      return { success: false, error: 'Database write failed during update.' };
    }

    return { success: true, item: updatedItem };
  }

  public updateByTopicOrId(
    queryOrId: string,
    data: {
      question?: string;
      answer?: string;
      explanation?: string;
      category?: string;
      keywords?: string[];
      source?: string;
      sourceUrl?: string;
      verificationDate?: string;
      confidence?: 'verified' | 'high' | 'provisional' | 'outdated';
      status?: 'active' | 'outdated' | 'under_review' | 'corrected';
      isTimeSensitive?: boolean;
      changeReason?: string;
    },
    author = 'SP @9631'
  ): { success: boolean; item?: TeacherKnowledgeItem; error?: string } {
    if (!queryOrId) return { success: false, error: 'Query or ID is required' };
    
    let target = this.getById(queryOrId);
    if (!target) {
      const searchResults = this.search(queryOrId, 1);
      if (searchResults.length > 0) {
        target = searchResults[0].item;
      }
    }

    if (!target) {
      return { success: false, error: `No matching knowledge found for "${queryOrId}".` };
    }

    return this.update(target.id, data, author);
  }

  public markAsOutdated(idOrTopic: string, reason: string, author = 'SP @9631'): { success: boolean; item?: TeacherKnowledgeItem; error?: string } {
    let target = this.getById(idOrTopic);
    if (!target) {
      const searchResults = this.search(idOrTopic, 1);
      if (searchResults.length > 0) target = searchResults[0].item;
    }
    if (!target) return { success: false, error: 'Knowledge record not found' };

    return this.update(target.id, {
      status: 'outdated',
      confidence: 'outdated',
      isActive: false,
      outdatedReason: reason,
      changeReason: `Marked as outdated: ${reason}`,
    }, author);
  }

  public delete(id: string): { success: boolean; error?: string } {
    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) {
      return { success: false, error: `Knowledge item with id '${id}' not found.` };
    }

    const removed = this.items.splice(index, 1)[0];
    const saved = this.saveToDisk();
    if (!saved) {
      this.items.splice(index, 0, removed);
      return { success: false, error: 'Failed to delete knowledge item from database.' };
    }

    return { success: true };
  }

  public deleteByTopicOrId(queryOrId: string): { success: boolean; error?: string } {
    if (!queryOrId) return { success: false, error: 'Query or ID is required' };
    let target = this.getById(queryOrId);
    if (!target) {
      const searchResults = this.search(queryOrId, 1);
      if (searchResults.length > 0) {
        target = searchResults[0].item;
      }
    }
    if (!target) {
      return { success: false, error: `No matching knowledge item found for "${queryOrId}".` };
    }
    return this.delete(target.id);
  }

  public toggleActive(id: string, isActive: boolean): { success: boolean; item?: TeacherKnowledgeItem; error?: string } {
    return this.update(id, { isActive });
  }

  public restoreVersion(id: string, targetVersion: number): { success: boolean; item?: TeacherKnowledgeItem; error?: string } {
    const item = this.getById(id);
    if (!item) return { success: false, error: 'Item not found' };

    const targetHistory = item.history?.find((h) => h.version === targetVersion);
    if (!targetHistory) {
      return { success: false, error: `Version ${targetVersion} not found in history.` };
    }

    return this.update(id, {
      question: targetHistory.question,
      answer: targetHistory.answer,
      explanation: targetHistory.explanation,
      category: targetHistory.category,
      keywords: targetHistory.keywords,
      source: targetHistory.source,
      sourceUrl: targetHistory.sourceUrl,
      verificationDate: targetHistory.verificationDate,
      confidence: targetHistory.confidence,
      status: targetHistory.status,
      changeReason: `Restored to version ${targetVersion}`,
    });
  }

  // --- Student Feedback & Review Management ---

  public addStudentFeedback(data: {
    question: string;
    aiAnswer: string;
    studentComment: string;
    suggestedCorrection?: string;
  }): { success: boolean; log?: StudentFeedbackLog } {
    const newLog: StudentFeedbackLog = {
      id: `fb_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      question: data.question.trim(),
      aiAnswer: data.aiAnswer.trim(),
      studentComment: data.studentComment.trim(),
      suggestedCorrection: data.suggestedCorrection?.trim() || '',
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    this.feedbackLogs.unshift(newLog);
    this.saveFeedbackToDisk();
    return { success: true, log: newLog };
  }

  public getFeedbackLogs(): StudentFeedbackLog[] {
    return [...this.feedbackLogs];
  }

  public resolveFeedbackLog(id: string, resolutionNote: string, status: 'resolved' | 'dismissed' = 'resolved'): { success: boolean } {
    const log = this.feedbackLogs.find((l) => l.id === id);
    if (!log) return { success: false };
    log.status = status;
    log.resolutionNote = resolutionNote;
    this.saveFeedbackToDisk();
    return { success: true };
  }

  // --- Reset to Factory Seed Knowledge ---

  public resetToDefault(): { success: boolean; count: number; error?: string } {
    this.items = [...INITIAL_SEED_KNOWLEDGE];
    const saved = this.saveToDisk();
    if (!saved) {
      return { success: false, count: 0, error: 'Failed to reset knowledge base on disk.' };
    }
    return { success: true, count: this.items.length };
  }

  // --- Export & Import ---

  public exportBackup(): {
    exportedAt: string;
    version: string;
    system: string;
    author: string;
    totalItems: number;
    knowledge: TeacherKnowledgeItem[];
    feedbackLogs: StudentFeedbackLog[];
  } {
    return {
      exportedAt: new Date().toISOString(),
      version: '2.0',
      system: 'SPA AI Teacher Live GK & Knowledge Base',
      author: 'SP (Mithila Academy)',
      totalItems: this.items.length,
      knowledge: this.items,
      feedbackLogs: this.feedbackLogs,
    };
  }

  public importBackup(data: any, mode: 'merge' | 'overwrite' = 'merge'): { success: boolean; count: number; error?: string } {
    let listToImport: TeacherKnowledgeItem[] = [];

    if (Array.isArray(data)) {
      listToImport = data;
    } else if (data && Array.isArray(data.knowledge)) {
      listToImport = data.knowledge;
    } else {
      return { success: false, count: 0, error: 'Invalid backup file format. Expected JSON array or object with knowledge property.' };
    }

    const validItems: TeacherKnowledgeItem[] = [];
    for (const raw of listToImport) {
      if (raw && typeof raw.question === 'string' && typeof raw.answer === 'string') {
        validItems.push({
          id: raw.id || `know_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
          question: raw.question.trim(),
          answer: raw.answer.trim(),
          explanation: raw.explanation || '',
          category: raw.category || 'General Knowledge',
          keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
          source: raw.source || 'Imported Knowledge',
          sourceUrl: raw.sourceUrl || '',
          verificationDate: raw.verificationDate || new Date().toISOString(),
          confidence: raw.confidence || 'verified',
          status: raw.status || 'active',
          isTimeSensitive: Boolean(raw.isTimeSensitive),
          createdAt: raw.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: raw.createdBy || 'SP (Mithila Academy)',
          version: typeof raw.version === 'number' ? raw.version : 1,
          isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : true,
          history: Array.isArray(raw.history) ? raw.history : [],
        });
      }
    }

    if (validItems.length === 0) {
      return { success: false, count: 0, error: 'No valid knowledge items found in import payload.' };
    }

    const previous = [...this.items];

    if (mode === 'overwrite') {
      this.items = validItems;
    } else {
      for (const item of validItems) {
        const existingIdx = this.items.findIndex((i) => i.id === item.id);
        if (existingIdx >= 0) {
          this.items[existingIdx] = item;
        } else {
          this.items.unshift(item);
        }
      }
    }

    const saved = this.saveToDisk();
    if (!saved) {
      this.items = previous;
      return { success: false, count: 0, error: 'Failed to write imported knowledge to disk.' };
    }

    return { success: true, count: validItems.length };
  }

  // Returns formatted system prompt block of all active teacher knowledge for Gemini context
  public getKnowledgeContextPrompt(): string {
    const active = this.items.filter((i) => i.isActive && i.status === 'active');
    if (active.length === 0) {
      return '';
    }

    const formattedList = active
      .map(
        (k, idx) =>
          `[Item ${idx + 1}] ID: "${k.id}" | Category: "${k.category}" | Status: ${k.confidence.toUpperCase()}\n` +
          `• Topic/Question: "${k.question}"\n` +
          `• Verified Answer: "${k.answer}"` +
          (k.explanation ? `\n• Explanation: "${k.explanation}"` : '') +
          `\n• Official Source: "${k.source}"` +
          (k.verificationDate ? ` (Verified: ${k.verificationDate.split('T')[0]})` : '') +
          (k.keywords && k.keywords.length > 0 ? `\n• Keywords: ${k.keywords.join(', ')}` : '')
      )
      .join('\n\n');

    return (
      `\n\n=================================================================\n` +
      `AUTHORITATIVE TEACHER KNOWLEDGE & VERIFIED GK BASE (SP • MITHILA ACADEMY • 2026)\n` +
      `=================================================================\n` +
      `The following verified entries have been registered and validated by Teacher SP & official primary sources.\n\n` +
      `PRIORITY DIRECTIVES:\n` +
      `1. Whenever a student or user asks about any of the specific verified topics below:\n` +
      `   - Prioritize and use this Verified Teacher Knowledge as the primary authoritative answer.\n` +
      `2. For all general education, academic subjects (Math, Science, History, Coding, Literature), language skills, and conversational questions outside this specific list:\n` +
      `   - Fully utilize your native general-purpose intelligence and comprehensive knowledge base.\n` +
      `3. For live 2026/current data not present in this list (e.g. today's match scores, new appointments, latest rankings):\n` +
      `   - Use the 'searchLiveGkAndWeb' tool to retrieve and verify live primary sources.\n\n` +
      `ACTIVE VERIFIED KNOWLEDGE RECORDS:\n${formattedList}\n` +
      `=================================================================\n`
    );
  }
}

export const teacherKnowledgeDb = new TeacherKnowledgeDatabase();
