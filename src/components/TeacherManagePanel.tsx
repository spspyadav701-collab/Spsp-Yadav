import React, { useState, useRef } from 'react';
import { 
  Radio, 
  Upload, 
  Video, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Lock, 
  Key, 
  Play, 
  Square, 
  Users, 
  MessageSquare,
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import { AcademicVideo } from './AcademicVideoFeed';

interface TeacherManagePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoUploaded?: (video: AcademicVideo) => void;
}

/**
 * Isolated Teacher Management Panel & Broadcast Studio.
 * Allows verified educators to upload new academic videos (with simulated or Cloud Storage progress tracking)
 * and toggle WebRTC/Live streams with real-time class chat integration.
 */
export const TeacherManagePanel: React.FC<TeacherManagePanelProps> = ({
  isOpen,
  onClose,
  onVideoUploaded,
}) => {
  // Authentication state (Protected Teacher PIN: SP @9631)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Tab: 'upload' or 'livestream'
  const [activeTab, setActiveTab] = useState<'upload' | 'livestream'>('upload');

  // Video Upload State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Physics' | 'Mathematics' | 'Chemistry' | 'Computer Science' | 'General GK'>('Physics');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Stream Broadcast State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [streamTitle, setStreamTitle] = useState('Daily Live Doubt Clearing & Conceptual Problem Solving');
  const [viewerCount, setViewerCount] = useState(0);

  if (!isOpen) return null;

  // Handle PIN verification
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    // Teacher SP PIN verification
    if (pinInput.trim() === '9631' || pinInput.trim().toLowerCase() === 'sp @9631' || pinInput.trim().toLowerCase() === 'sp@9631') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Invalid Teacher PIN. Verification failed.');
    }
  };

  // Handle Video Upload Simulation / Cloud Dispatch
  const handleStartUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    // Simulate multi-stage chunked upload with progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadSuccess(true);

          const newVideo: AcademicVideo = {
            id: `vid-teacher-${Date.now()}`,
            title,
            description,
            category,
            duration: '10:00',
            views: 1,
            likes: 0,
            uploadedAt: 'Just now',
            teacherName: 'Teacher SP',
            teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            isVerifiedTeacher: true,
            thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
            videoUrl: URL.createObjectURL(selectedFile),
          };

          if (onVideoUploaded) {
            onVideoUploaded(newVideo);
          }

          // Reset Form
          setTitle('');
          setDescription('');
          setSelectedFile(null);
          return 100;
        }
        return prev + 15;
      });
    }, 200);
  };

  // Toggle Live Broadcast
  const handleToggleLiveStream = () => {
    if (isLiveActive) {
      setIsLiveActive(false);
      setViewerCount(0);
    } else {
      setIsLiveActive(true);
      setViewerCount(28); // Simulated active student listeners
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Teacher Control & Broadcast Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  Mithila Academy
                </span>
              </h2>
              <p className="text-xs text-slate-400">Manage academic video uploads & live broadcast streams</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!isAuthenticated ? (
            /* PIN Protection Form */
            <form onSubmit={handleVerifyPin} className="max-w-md mx-auto py-8 space-y-5 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Teacher Authentication Required</h3>
                <p className="text-xs text-slate-400 mt-1">Enter your secure 4-digit Teacher PIN to access the upload & broadcast studio.</p>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-medium text-slate-300">Teacher Security PIN</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="Enter PIN (e.g. 9631)"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                {authError && <p className="text-xs text-red-400 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" />{authError}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl text-sm hover:brightness-110 transition-all shadow-lg shadow-cyan-500/20"
              >
                Verify & Enter Studio
              </button>
            </form>
          ) : (
            /* Authenticated Teacher Workspace */
            <div className="space-y-6">
              {/* Studio Tabs */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'upload'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload New Video (Create)
                </button>
                <button
                  onClick={() => setActiveTab('livestream')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'livestream'
                      ? 'bg-rose-500 text-white font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Radio className="w-4 h-4" />
                  Live Class Broadcast (Live Dena)
                </button>
              </div>

              {/* Tab 1: Video Upload Portal */}
              {activeTab === 'upload' && (
                <form onSubmit={handleStartUpload} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Lesson Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Thermodynamics & Heat Engine Efficiency"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Academic Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Physics">Physics</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="General GK">General GK</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Select Video File (.mp4, .webm)</label>
                      <input
                        type="file"
                        accept="video/*"
                        ref={fileInputRef}
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-cyan-300 hover:file:bg-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Lesson Description & Syllabus Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Enter detailed topic outline, formulas covered, and student exercise references..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  {isUploading && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-cyan-300 flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Uploading & Transcoding Video Stream...
                        </span>
                        <span className="text-white font-mono">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>Video published successfully! Added to curriculum feed.</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile || !title.trim()}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'Processing Video...' : 'Publish Academic Video'}
                  </button>
                </form>
              )}

              {/* Tab 2: Live Stream Broadcast Studio */}
              {activeTab === 'livestream' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isLiveActive ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`} />
                        <span className="text-xs font-bold text-slate-200">
                          {isLiveActive ? 'LIVE BROADCASTING ACTIVE' : 'STREAM STANDBY'}
                        </span>
                      </div>
                      {isLiveActive && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/20 border border-rose-500/30 rounded-full text-rose-300 text-xs font-mono">
                          <Users className="w-3.5 h-3.5" />
                          {viewerCount} Students Watching
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1">Live Class Topic</label>
                      <input
                        type="text"
                        value={streamTitle}
                        onChange={(e) => setStreamTitle(e.target.value)}
                        disabled={isLiveActive}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 disabled:opacity-60"
                      />
                    </div>

                    <div className="aspect-video bg-black rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
                      {isLiveActive ? (
                        <div className="text-center space-y-2">
                          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto animate-pulse">
                            <Radio className="w-6 h-6" />
                          </div>
                          <p className="text-xs text-slate-300 font-medium">Broadcasting Camera & Microphone to Students</p>
                          <p className="text-[10px] text-slate-500 font-mono">WebRTC / Agora RTC Channel: mithila-room-sp</p>
                        </div>
                      ) : (
                        <div className="text-center text-slate-500 space-y-1">
                          <Video className="w-8 h-8 mx-auto stroke-1" />
                          <p className="text-xs">Camera preview will start when broadcast is launched</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleToggleLiveStream}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        isLiveActive
                          ? 'bg-slate-800 text-rose-400 hover:bg-rose-500/20 border border-rose-500/40'
                          : 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20'
                      }`}
                    >
                      {isLiveActive ? (
                        <>
                          <Square className="w-4 h-4 fill-rose-400" />
                          End Live Stream Broadcast
                        </>
                      ) : (
                        <>
                          <Radio className="w-4 h-4" />
                          Go Live Now (Live Dena)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
