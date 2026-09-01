import React, { useState } from 'react';
import { 
  Tv, 
  Radio, 
  SlidersHorizontal, 
  X, 
  Sparkles, 
  Video, 
  Layers, 
  Upload, 
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { AcademicVideoFeed, DEFAULT_ACADEMIC_VIDEOS, AcademicVideo } from './AcademicVideoFeed';
import { TeacherManagePanel } from './TeacherManagePanel';

interface AcademicVideoCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskAiTeacher?: (topic: string) => void;
}

/**
 * Academic Video Hub & Video Streaming Modal Component.
 * Integrates:
 * 1. Categorized video streaming feed with YouTube-like layout.
 * 2. Secure offline caching & downloader button state.
 * 3. Quick entry gate to the Teacher Management & Broadcast Panel.
 */
export const AcademicVideoCenterModal: React.FC<AcademicVideoCenterModalProps> = ({
  isOpen,
  onClose,
  onAskAiTeacher,
}) => {
  const [videos, setVideos] = useState<AcademicVideo[]>(DEFAULT_ACADEMIC_VIDEOS);
  const [showManagePanel, setShowManagePanel] = useState(false);

  if (!isOpen) return null;

  const handleVideoUploaded = (newVideo: AcademicVideo) => {
    setVideos((prev) => [newVideo, ...prev]);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg flex items-center justify-center p-3 sm:p-6">
        <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-5xl h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          {/* Top Bar Navigation */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1.5px] shadow-lg shadow-cyan-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
                  <Tv className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Academic Video Stream & Learning Hub
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono">
                    Mithila Video Cloud
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Curated syllabus video lectures with encrypted offline caching & AI assistance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Restricted Teacher Studio Access Button */}
              <button
                onClick={() => setShowManagePanel(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Teacher Manage Panel</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Scrollable Video Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
            <AcademicVideoFeed
              videos={videos}
              onAskAiTeacher={(topic) => {
                onClose();
                if (onAskAiTeacher) {
                  onAskAiTeacher(topic);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Embedded Teacher Studio / Manage Panel */}
      <TeacherManagePanel
        isOpen={showManagePanel}
        onClose={() => setShowManagePanel(false)}
        onVideoUploaded={handleVideoUploaded}
      />
    </>
  );
};
