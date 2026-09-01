import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Lock,
  Unlock,
  KeyRound,
  Search,
  Plus,
  Edit3,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  History,
  Tag,
  Folder,
  SlidersHorizontal,
  FileJson,
  Eye,
  EyeOff,
  Check,
  Zap,
  HelpCircle,
  Volume2,
  RefreshCw,
  Globe,
  ExternalLink,
  MessageSquareWarning,
  CheckCheck,
  ShieldCheck,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { TeacherKnowledgeItem, TeacherKnowledgeHistory, StudentFeedbackLog } from '../types/knowledge';

interface TeacherKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminToken: string | null;
  onAdminLoginSuccess: (token: string, adminName: string) => void;
  onAdminLogout: () => void;
  onKnowledgeUpdated?: () => void;
}

export function TeacherKnowledgeModal({
  isOpen,
  onClose,
  adminToken,
  onAdminLoginSuccess,
  onAdminLogout,
  onKnowledgeUpdated,
}: TeacherKnowledgeModalProps) {
  // Navigation tabs inside authenticated modal
  const [activeTab, setActiveTab] = useState<'knowledge' | 'live_gk' | 'feedback'>('knowledge');

  // Authentication State
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [adminName, setAdminName] = useState<string>('SP (Mithila Academy)');

  // Knowledge List State
  const [items, setItems] = useState<TeacherKnowledgeItem[]>([]);
  const [feedbackLogs, setFeedbackLogs] = useState<StudentFeedbackLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingGk, setIsRefreshingGk] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'outdated' | 'under_review'>('all');

  // Edit / Add Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TeacherKnowledgeItem | null>(null);
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const [formCategory, setFormCategory] = useState('Current Affairs');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [formKeywords, setFormKeywords] = useState('');
  const [formSource, setFormSource] = useState('PIB / Official Govt Portal');
  const [formSourceUrl, setFormSourceUrl] = useState('');
  const [formConfidence, setFormConfidence] = useState<'verified_official' | 'high' | 'medium' | 'unconfirmed'>('verified_official');
  const [formStatus, setFormStatus] = useState<'active' | 'outdated' | 'under_review'>('active');
  const [formIsTimeSensitive, setFormIsTimeSensitive] = useState(false);
  const [formOutdatedReason, setFormOutdatedReason] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTargetItem, setHistoryTargetItem] = useState<TeacherKnowledgeItem | null>(null);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFileContent, setImportFileContent] = useState<any | null>(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Test Live Search Simulator State
  const [testQuery, setTestQuery] = useState('');
  const [testSearchResults, setTestSearchResults] = useState<any[] | null>(null);
  const [liveSearchTestResult, setLiveSearchTestResult] = useState<any | null>(null);
  const [isTestingSearch, setIsTestingSearch] = useState(false);

  // Fetch knowledge items whenever modal opens and adminToken is available
  useEffect(() => {
    if (isOpen && adminToken) {
      fetchKnowledge();
      fetchFeedback();
    }
  }, [isOpen, adminToken]);

  // Clear feedback messages after 4 seconds
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  const fetchKnowledge = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/knowledge', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (res.status === 401) {
        onAdminLogout();
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch (err) {
      console.error('[KnowledgeModal] Error fetching knowledge items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      const res = await fetch('/api/knowledge/feedback', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setFeedbackLogs(data.logs);
      }
    } catch (err) {
      console.error('[KnowledgeModal] Error fetching student feedback:', err);
    }
  };

  // Handle PIN verification on backend
  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) {
      setAuthError('कृपया Admin PIN दर्ज करें');
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setAuthError(data.message || 'अमान्य PIN! Access denied.');
        setIsAuthenticating(false);
        return;
      }

      onAdminLoginSuccess(data.token, data.adminName || 'SP (Mithila Academy)');
      setAdminName(data.adminName || 'SP (Mithila Academy)');
      setPinInput('');
      setFeedbackMsg({ type: 'success', text: 'Teacher Knowledge Mode अनलॉक हो गया!' });
    } catch (err: any) {
      setAuthError('सर्वर से संपर्क करने में त्रुटि हुई।');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Trigger Live Current GK Auto-Refresh across official sources
  const handleRefreshCurrentGk = async () => {
    setIsRefreshingGk(true);
    try {
      const res = await fetch('/api/knowledge/refresh-gk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({
          type: 'success',
          text: `GK Auto-Refresh Complete! ${data.updatedCount} items updated, ${data.newCount} new items verified from official portals.`,
        });
        fetchKnowledge();
        if (onKnowledgeUpdated) onKnowledgeUpdated();
      } else {
        throw new Error(data.error || 'Refresh failed');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Refresh error: ${err.message}` });
    } finally {
      setIsRefreshingGk(false);
    }
  };

  // Resolve Student Feedback
  const handleResolveFeedback = async (id: string, action: 'resolved' | 'dismissed') => {
    try {
      const res = await fetch('/api/knowledge/feedback/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          id,
          resolutionNote: action === 'resolved' ? 'Reviewed and verified by Teacher SP' : 'Dismissed by Teacher SP',
          status: action,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: `Feedback ${action} successfully` });
        fetchFeedback();
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to update feedback status' });
    }
  };

  // Convert feedback item to Knowledge item
  const handleConvertFeedbackToKnowledge = (log: StudentFeedbackLog) => {
    setEditingItem(null);
    setFormQuestion(log.question);
    setFormAnswer(log.suggestedCorrection || log.aiAnswer || '');
    setFormExplanation(`Reviewed from student report: "${log.studentComment}"`);
    setFormCategory('Current Affairs');
    setFormKeywords(log.question.slice(0, 30));
    setFormSource('Student Feedback Verified by SP');
    setFormConfidence('verified_official');
    setFormStatus('active');
    setFormIsTimeSensitive(true);
    setFormIsActive(true);
    setShowEditModal(true);
  };

  // Open modal to add knowledge
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormQuestion('');
    setFormAnswer('');
    setFormExplanation('');
    setFormCategory('Current Affairs');
    setCustomCategoryInput('');
    setFormKeywords('');
    setFormSource('Official Govt Portal / PIB');
    setFormSourceUrl('');
    setFormConfidence('verified_official');
    setFormStatus('active');
    setFormIsTimeSensitive(false);
    setFormOutdatedReason('');
    setFormIsActive(true);
    setShowEditModal(true);
  };

  // Open modal to edit item
  const handleOpenEdit = (item: TeacherKnowledgeItem) => {
    setEditingItem(item);
    setFormQuestion(item.question);
    setFormAnswer(item.answer);
    setFormExplanation(item.explanation || '');
    setFormCategory(item.category || 'General');
    setCustomCategoryInput('');
    setFormKeywords((item.keywords || []).join(', '));
    setFormSource(item.source || 'Teacher SP Verified');
    setFormSourceUrl(item.sourceUrl || '');
    setFormConfidence(item.confidence || 'verified_official');
    setFormStatus(item.status || 'active');
    setFormIsTimeSensitive(!!item.isTimeSensitive);
    setFormOutdatedReason(item.outdatedReason || '');
    setFormIsActive(item.isActive !== false);
    setShowEditModal(true);
  };

  // Save Knowledge item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Question और Answer अनिवार्य हैं।' });
      return;
    }

    setIsSaving(true);
    const category = formCategory === 'Custom' ? (customCategoryInput.trim() || 'General') : formCategory;
    const keywords = formKeywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    try {
      const payload = {
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        explanation: formExplanation.trim(),
        category,
        keywords,
        source: formSource.trim(),
        sourceUrl: formSourceUrl.trim(),
        confidence: formConfidence,
        status: formStatus,
        isTimeSensitive: formIsTimeSensitive,
        outdatedReason: formOutdatedReason.trim(),
        isActive: formIsActive,
      };

      let res;
      if (editingItem) {
        res = await fetch(`/api/knowledge/${editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/knowledge/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save knowledge item');
      }

      setShowEditModal(false);
      setFeedbackMsg({
        type: 'success',
        text: editingItem ? 'Knowledge record updated!' : 'New authoritative Knowledge item added!',
      });
      fetchKnowledge();
      if (onKnowledgeUpdated) onKnowledgeUpdated();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error saving item' });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string, question: string) => {
    if (!window.confirm(`क्या आप वाकई इस ज्ञान को स्थायी रूप से हटाना चाहते हैं?\n"${question}"`)) {
      return;
    }

    try {
      const res = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Delete failed');
      }

      setFeedbackMsg({ type: 'success', text: 'ज्ञान रिकॉर्ड हमेशा के लिए हटा दिया गया।' });
      fetchKnowledge();
      if (onKnowledgeUpdated) onKnowledgeUpdated();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error deleting item' });
    }
  };

  // Mark item as outdated
  const handleMarkOutdated = async (item: TeacherKnowledgeItem) => {
    const reason = window.prompt('कारण बताएं (Reason for marking outdated):', 'Superseded by newer 2026 data');
    if (reason === null) return;

    try {
      const res = await fetch('/api/knowledge/outdated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ idOrTopic: item.id, reason }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: 'Marked as outdated. AI will perform live verification.' });
        fetchKnowledge();
        if (onKnowledgeUpdated) onKnowledgeUpdated();
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to update status' });
    }
  };

  // Toggle Active/Inactive
  const handleToggleActive = async (item: TeacherKnowledgeItem) => {
    try {
      const res = await fetch(`/api/knowledge/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          isActive: !item.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchKnowledge();
        if (onKnowledgeUpdated) onKnowledgeUpdated();
      }
    } catch (err) {
      console.error('Error toggling active status:', err);
    }
  };

  // Restore previous version
  const handleRestoreVersion = async (itemId: string, versionNumber: number) => {
    try {
      const res = await fetch(`/api/knowledge/${itemId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ version: versionNumber }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to restore version.');
      }
      setShowHistoryModal(false);
      setFeedbackMsg({ type: 'success', text: `Version v${versionNumber} को सफलतापूर्वक रीस्टोर कर दिया गया!` });
      fetchKnowledge();
      if (onKnowledgeUpdated) onKnowledgeUpdated();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  // Export Knowledge Backup
  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/knowledge/export', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teacher_knowledge_backup_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setFeedbackMsg({ type: 'success', text: 'Knowledge Base JSON बैकअप सफलतापूर्वक डाउनलोड हो गया।' });
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Backup export failed.' });
    }
  };

  // Reset Knowledge Base to Factory Seed
  const handleResetKnowledge = async () => {
    if (!window.confirm('क्या आप ज्ञान डेटाबेस को फ़ैक्टरी डिफ़ॉल्ट (Verified Seed) पर रीसेट करना चाहते हैं?\n(यह सभी कस्टम प्रविष्टियों को डिफ़ॉल्ट पर रीसेट कर देगा)')) {
      return;
    }

    try {
      const res = await fetch('/api/knowledge/reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Reset failed');
      }

      setFeedbackMsg({ type: 'success', text: 'डेटाबेस को फ़ैक्टरी डिफ़ॉल्ट ज्ञान पर सफलतापूर्वक रीसेट कर दिया गया।' });
      fetchKnowledge();
      if (onKnowledgeUpdated) onKnowledgeUpdated();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Reset failed' });
    }
  };

  // Handle JSON File selection for Import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setImportFileContent(parsed);
      } catch (parseErr) {
        setFeedbackMsg({ type: 'error', text: 'अमान्य JSON फ़ाइल प्रारूप।' });
        setImportFileContent(null);
      }
    };
    reader.readAsText(file);
  };

  // Execute Import
  const handleExecuteImport = async () => {
    if (!importFileContent) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/knowledge/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          data: importFileContent,
          mode: importMode,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Import failed');
      }
      setShowImportModal(false);
      setImportFileContent(null);
      setImportFileName(null);
      setFeedbackMsg({ type: 'success', text: data.message || 'Import successful!' });
      fetchKnowledge();
      if (onKnowledgeUpdated) onKnowledgeUpdated();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setIsImporting(false);
    }
  };

  // Run Test Search / Live Grounding Simulator
  const handleRunTestSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testQuery.trim()) return;

    setIsTestingSearch(true);
    setLiveSearchTestResult(null);
    try {
      // 1. Search local DB
      const res = await fetch('/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery, limit: 5 }),
      });
      const data = await res.json();
      if (data.success) {
        setTestSearchResults(data.results);
      }

      // 2. Test Live Web Grounding
      const liveRes = await fetch('/api/knowledge/live-search-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ query: testQuery }),
      });
      const liveData = await liveRes.json();
      if (liveData.success) {
        setLiveSearchTestResult(liveData.result);
      }
    } catch (err) {
      console.error('Test search failed:', err);
    } finally {
      setIsTestingSearch(false);
    }
  };

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return ['all', ...Array.from(set)];
  }, [items]);

  // Filtered items list
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (statusFilter !== 'all' && (item.status || 'active') !== statusFilter) {
        return false;
      }
      if (activeTab === 'live_gk' && !item.isTimeSensitive && item.category !== 'Current Affairs' && item.category !== 'General Knowledge') {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const inQ = item.question.toLowerCase().includes(q);
      const inA = item.answer.toLowerCase().includes(q);
      const inExp = (item.explanation || '').toLowerCase().includes(q);
      const inCat = item.category.toLowerCase().includes(q);
      const inSrc = (item.source || '').toLowerCase().includes(q);
      const inKw = (item.keywords || []).some((k) => k.toLowerCase().includes(q));
      return inQ || inA || inExp || inCat || inSrc || inKw;
    });
  }, [items, selectedCategory, statusFilter, activeTab, searchQuery]);

  const pendingFeedbackCount = useMemo(() => {
    return feedbackLogs.filter((l) => l.status === 'pending').length;
  }, [feedbackLogs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-5xl h-[92vh] max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-purple-950/40 flex flex-col overflow-hidden text-slate-100"
      >
        {/* Toast / Feedback Banner */}
        <AnimatePresence>
          {feedbackMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-950/95 border border-emerald-500/60 text-emerald-200'
                  : 'bg-rose-950/95 border border-rose-500/60 text-rose-200'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{feedbackMsg.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. LOCK SCREEN VIEW IF NOT AUTHENTICATED */}
        {!adminToken ? (
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-400 p-[1.5px] shadow-lg shadow-purple-500/20 mb-4">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Lock className="w-8 h-8 text-pink-400" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              Private Teacher Access
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
              Enter the secret Teacher PIN to unlock{' '}
              <span className="text-pink-400 font-semibold">Teacher Knowledge & Live GK Mode</span> and manage permanent verified memory.
            </p>

            <form onSubmit={handlePinSubmit} className="w-full space-y-4">
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter Secret PIN (e.g. SP 96 31)"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-700 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-center text-base tracking-widest font-mono text-white placeholder:text-slate-600 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {authError && (
                <p className="text-xs text-rose-400 flex items-center justify-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{authError}</span>
                </p>
              )}

              <div className="grid grid-cols-3 gap-1.5 pt-2">
                {['SP', '96', '31'].map((snippet) => (
                  <button
                    key={snippet}
                    type="button"
                    onClick={() => setPinInput((prev) => (prev ? `${prev} ${snippet}` : snippet))}
                    className="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-300 cursor-pointer"
                  >
                    + {snippet}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Unlock Memory</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* 2. AUTHENTICATED TEACHER & LIVE GK DASHBOARD */
          <>
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-950/70 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-400 p-[1.5px] shadow-md flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-pink-400" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      Teacher Knowledge & Verified Live GK
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Teacher Mode Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>Admin: <strong className="text-pink-300 font-medium">{adminName}</strong></span>
                    <span>•</span>
                    <span className="text-cyan-400">{items.length} Records</span>
                    <span>•</span>
                    <span className="text-amber-400">{items.filter((i) => i.isTimeSensitive).length} Live GK Items</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Auto Refresh GK Button */}
                <button
                  type="button"
                  onClick={handleRefreshCurrentGk}
                  disabled={isRefreshingGk}
                  title="Auto-refresh core Current GK from official government & news portals"
                  className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingGk ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isRefreshingGk ? 'Verifying...' : 'Refresh Current GK'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Record</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  title="Export Backup JSON"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  title="Import Backup JSON"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleResetKnowledge}
                  title="Reset to Factory Verified Knowledge"
                  className="p-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 hover:text-amber-100 border border-amber-500/40 text-xs transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={onAdminLogout}
                  title="Lock / Log Out"
                  className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lock</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="px-4 sm:px-6 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('knowledge')}
                  className={`py-2.5 px-3 border-b-2 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'knowledge'
                      ? 'border-pink-500 text-pink-400 bg-pink-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Permanent Knowledge</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">{items.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('live_gk')}
                  className={`py-2.5 px-3 border-b-2 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'live_gk'
                      ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Current GK & Office Holders</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    2026 Live
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('feedback')}
                  className={`py-2.5 px-3 border-b-2 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'feedback'
                      ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquareWarning className="w-3.5 h-3.5" />
                  <span>Student Error Reports</span>
                  {pendingFeedbackCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold animate-pulse">
                      {pendingFeedbackCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Status Filter Pills (Active/Outdated/Under Review) */}
              {activeTab !== 'feedback' && (
                <div className="hidden md:flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Status:</span>
                  {(['all', 'active', 'outdated', 'under_review'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                        statusFilter === st
                          ? 'bg-slate-700 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-toolbar: Search & Category Filters */}
            {activeTab !== 'feedback' && (
              <div className="px-4 sm:px-6 py-2 bg-slate-950/30 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search GK questions, answers, leaders, sources, or keywords..."
                    className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-pink-600 text-white shadow-sm'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat === 'all' ? 'All Categories' : cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB BODY 1 & 2: KNOWLEDGE & CURRENT GK LIST */}
            {activeTab !== 'feedback' ? (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {isLoading ? (
                  <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs">Loading Knowledge Base from disk...</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">No matching records found</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {searchQuery
                          ? 'No matches found. Try another query or click Refresh Current GK.'
                          : 'Click "Add Record" or use voice activation "SP @9631" to teach AI Teacher!'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAdd}
                      className="mt-2 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      + Create Knowledge Record
                    </button>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all ${
                        item.status === 'outdated'
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : item.status === 'under_review'
                          ? 'bg-blue-950/20 border-blue-500/30'
                          : item.isActive
                          ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700 shadow-md'
                          : 'bg-slate-950/30 border-slate-800/40 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-950/90 border border-purple-500/40 text-purple-300">
                            {item.category}
                          </span>

                          {item.isTimeSensitive && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
                              <Globe className="w-2.5 h-2.5" />
                              Time-Sensitive
                            </span>
                          )}

                          {item.status === 'outdated' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-950/90 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Outdated
                            </span>
                          )}

                          {item.status === 'under_review' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-950/90 border border-blue-500/40 text-blue-300">
                              Under Review
                            </span>
                          )}

                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50">
                            v{item.version}
                          </span>

                          {item.verificationDate && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              Verified: {item.verificationDate}
                            </span>
                          )}
                        </div>

                        {/* Item Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {item.history && item.history.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setHistoryTargetItem(item);
                                setShowHistoryModal(true);
                              }}
                              title="View Revision History & Revert"
                              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {item.status !== 'outdated' && (
                            <button
                              type="button"
                              onClick={() => handleMarkOutdated(item)}
                              title="Mark as outdated (Trigger live web verification for this topic)"
                              className="p-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900 border border-amber-500/30 text-amber-300 transition-colors cursor-pointer"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleActive(item)}
                            title={item.isActive ? 'Deactivate (Hide from AI)' : 'Activate (Use in AI answers)'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              item.isActive
                                ? 'bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300'
                                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Knowledge Item"
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id, item.question)}
                            title="Delete Permanently"
                            className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/30 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Question / Concept Title */}
                      <h3 className="text-sm font-bold text-slate-100 mb-1.5 flex items-start gap-1.5">
                        <Sparkles className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                        <span>{item.question}</span>
                      </h3>

                      {/* Authoritative Answer Box */}
                      <div className="p-3 rounded-lg bg-slate-900/90 border border-emerald-500/20 text-xs text-emerald-200/90 leading-relaxed my-2">
                        <span className="font-semibold text-emerald-400 block text-[10px] uppercase tracking-wider mb-0.5">
                          Verified Authoritative Answer:
                        </span>
                        <p>{item.answer}</p>
                      </div>

                      {/* Source & Verification Metadata */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[11px]">
                        <div className="flex items-center gap-2 text-slate-400">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            Source: <strong className="text-slate-200">{item.source || 'Teacher SP Verified'}</strong>
                          </span>
                          {item.sourceUrl && (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:underline flex items-center gap-0.5"
                            >
                              <span>Official Link</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>

                        {item.confidence && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            item.confidence === 'verified_official'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              : item.confidence === 'high'
                              ? 'bg-cyan-950 text-cyan-300'
                              : 'bg-amber-950 text-amber-300'
                          }`}>
                            {item.confidence.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Explanation if any */}
                      {item.explanation && (
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-2 pl-2 border-l-2 border-slate-700">
                          <strong className="text-slate-300">Context/Explanation: </strong>
                          {item.explanation}
                        </p>
                      )}

                      {/* Outdated reason if any */}
                      {item.outdatedReason && (
                        <p className="text-[11px] text-amber-300 leading-relaxed mt-1.5 pl-2 border-l-2 border-amber-500 bg-amber-950/30 p-1.5 rounded-r">
                          <strong>Outdated Note: </strong>
                          {item.outdatedReason}
                        </p>
                      )}

                      {/* Keywords chips */}
                      {item.keywords && item.keywords.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mt-2">
                          <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                          {item.keywords.map((kw, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* TAB BODY 3: STUDENT FEEDBACK & ERROR REPORTS */
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <MessageSquareWarning className="w-4 h-4 text-amber-400" />
                      <span>Student Reported Errors & Feedback Logs</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Review incorrect answer reports logged by students during voice or text sessions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchFeedback}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {feedbackLogs.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <CheckCheck className="w-10 h-10 text-emerald-400/80 mb-2" />
                    <p className="text-sm font-semibold text-slate-200">No error reports recorded</p>
                    <p className="text-xs text-slate-500">
                      When students flag an answer ("यह गलत उत्तर है"), it will automatically appear here for your review!
                    </p>
                  </div>
                ) : (
                  feedbackLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-xl border space-y-2.5 ${
                        log.status === 'pending'
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                          : 'bg-slate-950/50 border-slate-800 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              log.status === 'pending' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {log.status}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-100">
                            Question: <span className="text-pink-300">{log.question}</span>
                          </h4>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleConvertFeedbackToKnowledge(log)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Save as Correct Fact</span>
                          </button>

                          {log.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleResolveFeedback(log.id, 'resolved')}
                                className="p-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 cursor-pointer"
                                title="Mark Resolved"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResolveFeedback(log.id, 'dismissed')}
                                className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 cursor-pointer"
                                title="Dismiss"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {log.aiAnswer && (
                        <div className="p-2.5 rounded-lg bg-slate-900 text-xs text-rose-300/90 border border-rose-500/20">
                          <span className="font-semibold text-rose-400 block text-[10px] uppercase tracking-wider mb-0.5">
                            Reported AI Answer:
                          </span>
                          <p>{log.aiAnswer}</p>
                        </div>
                      )}

                      <div className="p-2.5 rounded-lg bg-slate-900 text-xs text-slate-200 border border-amber-500/20">
                        <span className="font-semibold text-amber-400 block text-[10px] uppercase tracking-wider mb-0.5">
                          Student Reason / Comment:
                        </span>
                        <p>{log.studentComment}</p>
                      </div>

                      {log.suggestedCorrection && (
                        <div className="p-2.5 rounded-lg bg-emerald-950/40 text-xs text-emerald-300 border border-emerald-500/30">
                          <span className="font-semibold text-emerald-400 block text-[10px] uppercase tracking-wider mb-0.5">
                            Student Suggested Correction:
                          </span>
                          <p>{log.suggestedCorrection}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Footer with Student Search Simulator & Live Grounding Tester */}
            <div className="px-4 sm:px-6 py-2.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <form onSubmit={handleRunTestSearch} className="flex items-center gap-2 flex-1 max-w-xl">
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="Test live search & fact retrieval (e.g. Current PM of UK, ISRO Chairman)..."
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs flex-1 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={isTestingSearch || !testQuery.trim()}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0"
                >
                  <Search className="w-3 h-3" />
                  <span>{isTestingSearch ? 'Verifying...' : 'Test Live Search'}</span>
                </button>
              </form>

              {liveSearchTestResult && (
                <div className="text-[11px] text-emerald-300 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Source: {liveSearchTestResult.source || 'Official verified'}</span>
                  <span className="text-slate-500">|</span>
                  <span>Confidence: {liveSearchTestResult.confidence}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* 3. ADD / EDIT KNOWLEDGE MODAL */}
        <AnimatePresence>
          {showEditModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-pink-400" />
                    <span>{editingItem ? 'Edit Teacher Knowledge & GK' : 'Add New Authoritative GK Record'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Question / Topic Title <span className="text-pink-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formQuestion}
                      onChange={(e) => setFormQuestion(e.target.value)}
                      placeholder="e.g. Current Chief Election Commissioner of India? / भारत के मुख्य चुनाव आयुक्त?"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-emerald-300 font-semibold mb-1">
                      Verified Authoritative Answer <span className="text-pink-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formAnswer}
                      onChange={(e) => setFormAnswer(e.target.value)}
                      placeholder="Enter verified answer that AI Teacher must strictly prioritize..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Primary Source Name
                      </label>
                      <input
                        type="text"
                        value={formSource}
                        onChange={(e) => setFormSource(e.target.value)}
                        placeholder="e.g. PIB / Election Commission of India / ISRO"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Source Official URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={formSourceUrl}
                        onChange={(e) => setFormSourceUrl(e.target.value)}
                        placeholder="e.g. https://eci.gov.in"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Category</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-pink-500"
                      >
                        <option value="Current Affairs">Current Affairs</option>
                        <option value="General Knowledge">General Knowledge</option>
                        <option value="Constitutional & Polity">Constitutional & Polity</option>
                        <option value="Sports">Sports</option>
                        <option value="Science & Technology">Science & Technology</option>
                        <option value="Physics">Physics</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Class Rules">Class Rules</option>
                        <option value="Custom">+ Custom Category</option>
                      </select>

                      {formCategory === 'Custom' && (
                        <input
                          type="text"
                          placeholder="Type custom category..."
                          value={customCategoryInput}
                          onChange={(e) => setCustomCategoryInput(e.target.value)}
                          className="mt-1.5 w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-pink-500"
                      >
                        <option value="active">Active (Verified)</option>
                        <option value="outdated">Outdated (Needs Update)</option>
                        <option value="under_review">Under Review</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Confidence</label>
                      <select
                        value={formConfidence}
                        onChange={(e) => setFormConfidence(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-pink-500"
                      >
                        <option value="verified_official">Official Verified</option>
                        <option value="high">High Confidence</option>
                        <option value="medium">Medium</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Detailed Explanation / Tenure / Context (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={formExplanation}
                      onChange={(e) => setFormExplanation(e.target.value)}
                      placeholder="Additional notes, tenure dates, or details..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Search Keywords / Synonyms (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formKeywords}
                      onChange={(e) => setFormKeywords(e.target.value)}
                      placeholder="e.g. CEC, Election Commission, चुनाव आयुक्त"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsTimeSensitive}
                        onChange={(e) => setFormIsTimeSensitive(e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-950 border-slate-700"
                      />
                      <span className="text-slate-300 font-medium">
                        Time-Sensitive (Can change over time — AI Teacher will check freshness)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 bg-slate-950 border-slate-700"
                      />
                      <span className="text-slate-300 font-medium">
                        Active (Include in AI Teacher live responses)
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Save to Permanent Database</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 4. REVISION HISTORY & VERSION RESTORE MODAL */}
        <AnimatePresence>
          {showHistoryModal && historyTargetItem && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-100 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-cyan-400" />
                    <span>Version History & Audit</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(false)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs space-y-3">
                  <p className="text-slate-400">
                    Showing all past versions for: <strong className="text-white">"{historyTargetItem.question}"</strong>
                  </p>

                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-300">
                      Current Version: v{historyTargetItem.version}
                    </span>
                    <p className="mt-1 font-medium">{historyTargetItem.answer}</p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Prior Revisions:
                    </h4>
                    {historyTargetItem.history && historyTargetItem.history.length > 0 ? (
                      historyTargetItem.history.map((rev) => (
                        <div
                          key={rev.version}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-400">
                                v{rev.version}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(rev.updatedAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-slate-300 leading-relaxed text-[11px]">{rev.answer}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRestoreVersion(historyTargetItem.id, rev.version)}
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[11px] font-semibold shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">No prior revisions recorded for this item.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 5. IMPORT BACKUP MODAL */}
        <AnimatePresence>
          {showImportModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-100"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-pink-400" />
                    <span>Import Knowledge Backup</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3.5 text-xs">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-pink-500/80 rounded-xl p-5 text-center cursor-pointer bg-slate-950/60 transition-colors"
                  >
                    <Upload className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-300">
                      {importFileName ? importFileName : 'Click to choose Knowledge Backup .json file'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Accepts standard JSON backup files</p>
                  </div>

                  {importFileContent && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Valid JSON backup detected</span>
                      </p>

                      <div className="space-y-1">
                        <label className="block text-slate-400 font-medium">Import Strategy:</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setImportMode('merge')}
                            className={`flex-1 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                              importMode === 'merge'
                                ? 'bg-pink-600 border-pink-500 text-white'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            Merge with Existing
                          </button>
                          <button
                            type="button"
                            onClick={() => setImportMode('overwrite')}
                            className={`flex-1 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                              importMode === 'overwrite'
                                ? 'bg-rose-600 border-rose-500 text-white'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            Overwrite All
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!importFileContent || isImporting}
                      onClick={handleExecuteImport}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isImporting ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Import Knowledge</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
