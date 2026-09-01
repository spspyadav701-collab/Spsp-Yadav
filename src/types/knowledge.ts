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

export interface KnowledgeSearchMatch {
  item: TeacherKnowledgeItem;
  score: number;
  matchedFields: string[];
}

export interface KnowledgeExportData {
  exportedAt: string;
  version: string;
  system: string;
  author: string;
  totalItems: number;
  knowledge: TeacherKnowledgeItem[];
  feedbackLogs?: StudentFeedbackLog[];
}

export interface AdminAuthResponse {
  success: boolean;
  token?: string;
  expiresAt?: number;
  adminName?: string;
  message?: string;
}

export interface LiveGkRefreshResponse {
  success: boolean;
  updatedCount: number;
  newCount: number;
  timestamp: string;
  details: { topic: string; status: 'updated' | 'unchanged' | 'new' | 'failed'; answer?: string; source?: string }[];
}
