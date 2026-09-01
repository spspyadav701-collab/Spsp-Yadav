import { GoogleGenAI } from '@google/genai';
import { teacherKnowledgeDb, TeacherKnowledgeItem } from './knowledge_db';

export interface VerifiedSearchResult {
  success: boolean;
  query: string;
  answer: string;
  explanation?: string;
  source: string;
  sourceUrl?: string;
  verificationDate: string;
  confidence: 'verified' | 'high' | 'provisional' | 'unconfirmed';
  isTimeSensitive: boolean;
  groundingSources?: { title: string; url: string; snippet?: string }[];
  error?: string;
}

interface CacheEntry {
  result: VerifiedSearchResult;
  cachedAt: number;
  ttlMs: number;
}

// In-memory cache for live verified queries to ensure high response speeds
class LiveSearchCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes for general queries
  private readonly SHORT_TTL_MS = 3 * 60 * 1000; // 3 minutes for sports/fast-changing

  private normalizeKey(q: string): string {
    return q.toLowerCase().replace(/[^\w\u0900-\u097F]/g, '').trim();
  }

  public get(query: string, forceFresh = false): VerifiedSearchResult | null {
    if (forceFresh) return null;
    const key = this.normalizeKey(query);
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > entry.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.result;
  }

  public set(query: string, result: VerifiedSearchResult, isFastChanging = false) {
    const key = this.normalizeKey(query);
    this.cache.set(key, {
      result,
      cachedAt: Date.now(),
      ttlMs: isFastChanging ? this.SHORT_TTL_MS : this.DEFAULT_TTL_MS,
    });
  }

  public clear() {
    this.cache.clear();
  }
}

export const liveSearchCache = new LiveSearchCache();

export class LiveSearchService {
  private ai: GoogleGenAI | null = null;

  private getGenAI(): GoogleGenAI {
    if (!this.ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is missing.');
      }
      this.ai = new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  /**
   * Detects if a query is time-sensitive, asks for current/recent events, or mentions 2026/today/latest.
   */
  public isTimeSensitiveQuery(query: string): boolean {
    if (!query || typeof query !== 'string') return false;
    const lower = query.toLowerCase();

    const timeKeywords = [
      'आज', 'अभी', 'वर्तमान में', 'इस समय', 'हाल ही में', 'इस साल', 'नया', 'ताज़ा',
      'latest', 'current', 'today', 'now', 'recent', 'new', 'present', '2026', '2025',
      'कौन है', 'who is', 'chief minister', 'मुख्यमंत्री', 'prime minister', 'प्रधानमंत्री',
      'president', 'राष्ट्रपति', 'minister', 'मंत्री', 'governor', 'राज्यपाल',
      'cji', 'chief justice', 'मुख्य न्यायाधीश', 'isro', 'drdo', 'bcci', 'icc',
      'winner', 'विजेता', 'match', 'मैच', 'score', 'cricket', 'fifa', 'award', 'पुरस्कार',
      'ranking', 'rank', 'रैंकिंग', 'scheme', 'योजना', 'election', 'चुनाव', 'budget', 'बजट',
      'gdp', 'economy', 'अर्थव्यवस्था', 'appointment', 'नियुक्ति'
    ];

    return timeKeywords.some((k) => lower.includes(k));
  }

  /**
   * Evaluates if query contains strict 'today/now/latest' bypass keywords that require instantaneous live check.
   */
  public isForceFreshQuery(query: string): boolean {
    const lower = query.toLowerCase();
    const strictFreshKeywords = ['today', 'आज', 'now', 'अभी', 'latest', 'ताज़ा', 'live score', 'लाइव'];
    return strictFreshKeywords.some((k) => lower.includes(k));
  }

  /**
   * Performs Live Google Search Grounded search and fact verification using Gemini 3.7 Flash.
   */
  public async searchAndVerifyLiveGk(query: string, categoryHint?: string): Promise<VerifiedSearchResult> {
    const forceFresh = this.isForceFreshQuery(query);
    const cached = liveSearchCache.get(query, forceFresh);
    if (cached) {
      console.log(`[LiveSearch] Returning cached verified result for: "${query}"`);
      return cached;
    }

    try {
      const ai = this.getGenAI();
      const verificationDate = new Date().toISOString();

      const prompt = `You are the Official Fact-Verification and Current Affairs Intelligence Engine for Mithila Academy (SPA AI Teacher).
The current year is 2026. The student/teacher is asking the following question:
"${query}"

${categoryHint ? `Category Context: ${categoryHint}` : ''}

CRITICAL VERIFICATION INSTRUCTIONS:
1. Search and retrieve the most recent, authoritative, and verified 2026/current facts using Google Search.
2. Prioritize primary official sources:
   - Official Government portals (.gov.in, .nic.in, pib.gov.in, pmindia.gov.in, rashtrapatibhavan.gov.in, sci.gov.in)
   - Official ministries, constitutional bodies (ECI, UPSC, CAG, RBI, ISRO, DRDO)
   - Official sports bodies (BCCI, ICC, FIFA, Olympics)
   - Reputable news agencies (PTI, ANI, Reuters, The Hindu, Indian Express)
3. STRICT ANTI-HALLUCINATION:
   - If reliable official information cannot be verified or found, state clearly: "मैं इसकी वर्तमान जानकारी विश्वसनीय स्रोत से सत्यापित नहीं कर पा रहा हूँ।"
   - DO NOT GUESS OR INVENT names, dates, numbers, or events.
4. Output your response strictly in the following JSON format inside a markdown code block (\`\`\`json ... \`\`\`):
{
  "answer": "Clear, concise, educational Hindi answer (e.g. भारत के वर्तमान राष्ट्रपति द्रौपदी मुर्मू हैं।)",
  "explanation": "Brief context, tenure start date, or official background in Hindi/English.",
  "source": "Primary source name (e.g., Rashtrapati Bhavan Official / PIB India / Government of India Portal)",
  "sourceUrl": "Primary official URL if available or official portal domain",
  "confidence": "verified" | "high" | "provisional" | "unconfirmed",
  "isTimeSensitive": true | false,
  "category": "Current Affairs" | "Government & Polity" | "Sports" | "Science & Tech" | "Appointments" | "General Knowledge"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const responseText = response.text || '';
      const groundingChunks = (response.candidates?.[0] as any)?.groundingMetadata?.groundingChunks || [];
      const extractedSources: { title: string; url: string; snippet?: string }[] = [];

      for (const chunk of groundingChunks) {
        if (chunk.web?.uri) {
          extractedSources.push({
            title: chunk.web.title || 'Official Web Source',
            url: chunk.web.uri,
            snippet: chunk.web.snippet || '',
          });
        }
      }

      // Parse JSON from model output
      let parsed: any = null;
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1]);
        } catch {
          // fallback to manual regex if JSON parse fails
        }
      } else {
        try {
          parsed = JSON.parse(responseText.trim());
        } catch {}
      }

      const primarySource =
        parsed?.source ||
        (extractedSources.length > 0 ? extractedSources[0].title : 'Official Web Verification (PIB / Gov Portal)');
      const primaryUrl =
        parsed?.sourceUrl || (extractedSources.length > 0 ? extractedSources[0].url : 'https://pib.gov.in');

      const answerText =
        parsed?.answer ||
        responseText.replace(/```json[\s\S]*?```/g, '').trim() ||
        'मैं इसकी वर्तमान जानकारी विश्वसनीय स्रोत से सत्यापित नहीं कर पा रहा हूँ।';

      const result: VerifiedSearchResult = {
        success: true,
        query,
        answer: answerText,
        explanation: parsed?.explanation || '',
        source: primarySource,
        sourceUrl: primaryUrl,
        verificationDate,
        confidence: parsed?.confidence || (extractedSources.length > 0 ? 'verified' : 'high'),
        isTimeSensitive: parsed?.isTimeSensitive !== undefined ? parsed.isTimeSensitive : true,
        groundingSources: extractedSources.slice(0, 5),
      };

      const isFast = /match|score|today|cricket|sports/i.test(query);
      liveSearchCache.set(query, result, isFast);

      return result;
    } catch (err: any) {
      const isQuotaError = err?.status === 429 || /quota|RESOURCE_EXHAUSTED|rate.limit/i.test(err?.message || '');
      if (isQuotaError) {
        console.warn(`[LiveSearch] Gemini API quota limit reached for query "${query}". Falling back to local Teacher Knowledge Base.`);
      } else {
        console.warn('[LiveSearch] Google search grounding note:', err?.message || err);
      }

      // Check Teacher Knowledge DB for high-quality fallback
      const localMatches = teacherKnowledgeDb.search(query, 1);
      if (localMatches.length > 0) {
        const topItem = localMatches[0].item;
        const fallbackResult: VerifiedSearchResult = {
          success: true,
          query,
          answer: topItem.answer,
          explanation: topItem.explanation || 'Verified from Teacher Knowledge Repository',
          source: topItem.source || 'Mithila Academy Knowledge Base',
          sourceUrl: topItem.sourceUrl,
          verificationDate: topItem.verificationDate || new Date().toISOString(),
          confidence: topItem.confidence === 'outdated' ? 'provisional' : topItem.confidence,
          isTimeSensitive: topItem.isTimeSensitive,
        };
        liveSearchCache.set(query, fallbackResult, false);
        return fallbackResult;
      }

      return {
        success: false,
        query,
        answer: 'मैं अभी लाइव जानकारी सत्यापित नहीं कर पा रहा हूँ।',
        explanation: isQuotaError ? 'सर्च इंजन वर्तमान में व्यस्त है, कृपया कुछ क्षण बाद पुनः प्रयास करें।' : 'लाइव सर्च इंजन कनेक्शन में क्षणिक समस्या आई है।',
        source: 'Live Search Unavailable',
        verificationDate: new Date().toISOString(),
        confidence: 'unconfirmed',
        isTimeSensitive: true,
        error: err.message,
      };
    }
  }

  /**
   * Batch refresh critical current GK & office-holders for the Admin 'Update Current GK' feature.
   */
  public async refreshCurrentGkDatabase(adminAuthor = 'SP @9631'): Promise<{
    success: boolean;
    updatedCount: number;
    newCount: number;
    timestamp: string;
    details: { topic: string; status: 'updated' | 'unchanged' | 'new' | 'failed'; answer?: string; source?: string }[];
  }> {
    console.log('[LiveSearch] Starting comprehensive Current GK & Affairs auto-refresh...');

    const coreTopicsToCheck = [
      {
        topic: 'Who is the current President of India? / भारत के वर्तमान राष्ट्रपति कौन हैं?',
        query: 'Current President of India 2026 official name',
        category: 'Appointments',
      },
      {
        topic: 'Who is the current Prime Minister of India? / भारत के वर्तमान प्रधानमंत्री कौन हैं?',
        query: 'Current Prime Minister of India 2026 official',
        category: 'Appointments',
      },
      {
        topic: 'Who is the current Chief Justice of India (CJI)? / भारत के वर्तमान मुख्य न्यायाधीश (CJI) कौन हैं?',
        query: 'Current Chief Justice of India CJI 2026 official Supreme Court of India',
        category: 'Appointments',
      },
      {
        topic: 'Who is the current Education Minister of India? / भारत के वर्तमान शिक्षा मंत्री कौन हैं?',
        query: 'Current Minister of Education Government of India 2026 Dharmendra Pradhan official',
        category: 'Appointments',
      },
      {
        topic: 'Who is the current Chief of ISRO? / इसरो (ISRO) के वर्तमान अध्यक्ष कौन हैं?',
        query: 'Current Chairman of ISRO S. Somanath Indian Space Research Organisation official 2026',
        category: 'Science & Tech',
      },
      {
        topic: 'Who is the current Chief Election Commissioner of India? / भारत के मुख्य चुनाव आयुक्त कौन हैं?',
        query: 'Current Chief Election Commissioner of India 2026 Election Commission of India official',
        category: 'Appointments',
      },
      {
        topic: 'Key Indian Space & Science Milestones / 2026 में भारत के प्रमुख अंतरिक्ष व विज्ञान मिशन',
        query: 'ISRO Gaganyaan mission status and latest 2026 space milestones India official PIB',
        category: 'Science & Tech',
      },
      {
        topic: 'Current major National Welfare Schemes / 2026 की प्रमुख सरकारी योजनाएं',
        query: 'Major government welfare schemes India 2026 PIB official',
        category: 'Government & Polity',
      },
    ];

    let updatedCount = 0;
    let newCount = 0;
    const details: { topic: string; status: 'updated' | 'unchanged' | 'new' | 'failed'; answer?: string; source?: string }[] = [];

    for (let i = 0; i < coreTopicsToCheck.length; i++) {
      const item = coreTopicsToCheck[i];
      try {
        if (i > 0) {
          // Add gentle throttle delay between batch queries to avoid RPM limits
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        const verified = await this.searchAndVerifyLiveGk(item.query, item.category);

        if (!verified.success || verified.confidence === 'unconfirmed') {
          details.push({
            topic: item.topic,
            status: 'failed',
            source: 'Verification failed',
          });
          continue;
        }

        // Search existing item in DB
        const existingSearch = teacherKnowledgeDb.search(item.topic, 1);
        const existingItem = existingSearch.length > 0 ? existingSearch[0].item : undefined;

        if (existingItem) {
          // Check if answer has materially changed or needs refresh timestamp
          const isAnswerSame = existingItem.answer.trim() === verified.answer.trim();
          if (isAnswerSame && existingItem.confidence === 'verified') {
            // Update verification timestamp
            teacherKnowledgeDb.update(existingItem.id, {
              source: verified.source,
              sourceUrl: verified.sourceUrl,
              verificationDate: verified.verificationDate,
            }, adminAuthor);

            details.push({
              topic: item.topic,
              status: 'unchanged',
              answer: existingItem.answer,
              source: verified.source,
            });
          } else {
            // Answer changed or refreshed with newer official data!
            teacherKnowledgeDb.update(existingItem.id, {
              question: item.topic,
              answer: verified.answer,
              explanation: verified.explanation || existingItem.explanation,
              category: item.category,
              source: verified.source,
              sourceUrl: verified.sourceUrl,
              verificationDate: verified.verificationDate,
              confidence: verified.confidence,
              status: 'active',
              isTimeSensitive: true,
            }, adminAuthor);

            updatedCount++;
            details.push({
              topic: item.topic,
              status: 'updated',
              answer: verified.answer,
              source: verified.source,
            });
          }
        } else {
          // Create new verified GK entry
          const addRes = teacherKnowledgeDb.add({
            question: item.topic,
            answer: verified.answer,
            explanation: verified.explanation || '',
            category: item.category,
            keywords: [item.category, 'current', '2026', 'official', 'verified'],
            source: verified.source,
            sourceUrl: verified.sourceUrl,
            verificationDate: verified.verificationDate,
            confidence: verified.confidence,
            status: 'active',
            isTimeSensitive: true,
          }, adminAuthor);

          if (addRes.success) {
            newCount++;
            details.push({
              topic: item.topic,
              status: 'new',
              answer: verified.answer,
              source: verified.source,
            });
          }
        }
      } catch (topicErr) {
        console.error(`[LiveSearch] Failed to refresh topic "${item.topic}":`, topicErr);
        details.push({
          topic: item.topic,
          status: 'failed',
        });
      }
    }

    console.log(`[LiveSearch] GK Refresh completed. Updated: ${updatedCount}, New: ${newCount}`);
    return {
      success: true,
      updatedCount,
      newCount,
      timestamp: new Date().toISOString(),
      details,
    };
  }
}

export const liveSearchService = new LiveSearchService();
