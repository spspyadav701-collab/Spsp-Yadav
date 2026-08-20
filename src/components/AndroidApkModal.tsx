import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  X, 
  Download, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Terminal, 
  Sparkles, 
  ExternalLink,
  Settings,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({ isOpen, onClose }) => {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(() => {
    return localStorage.getItem('ai_teacher_custom_server_url') || '';
  });
  const [isSavedServer, setIsSavedServer] = useState(false);

  if (!isOpen) return null;

  const handleCopyCmd = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleSaveServerUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customServerUrl.trim()) {
      localStorage.setItem('ai_teacher_custom_server_url', customServerUrl.trim());
    } else {
      localStorage.removeItem('ai_teacher_custom_server_url');
    }
    setIsSavedServer(true);
    setTimeout(() => setIsSavedServer(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl bg-slate-950 border border-emerald-500/50 shadow-2xl flex flex-col text-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-100">Android APK & Native App Center</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
                  v1.0 Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Package ID: <span className="text-slate-300 font-mono">com.mithilaacademy.spaai</span> • Native Fullscreen & Touch Ready
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs text-slate-300">
          {/* Main Download Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-900 to-cyan-950/40 border border-emerald-500/40 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Download Real Installable Debug APK</span>
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Compiled real native APK with audio streaming, microphone permissions, touch gestures, and Mithila Academy branding.
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                <a
                  href="/app-debug.apk"
                  download="app-debug.apk"
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download app-debug.apk</span>
                </a>

                <a
                  href="/AI_Teacher_Android_App.zip"
                  download="AI_Teacher_Android_App.zip"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Project (.zip)</span>
                </a>
              </div>
            </div>

            {/* Quick feature verification tags */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Microphone Permission</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Gemini Live Voice</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Touch Gesture Drag/Pinch</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>No Browser URL Bar</span>
              </div>
            </div>
          </div>

          {/* How to generate the final .apk in 1 step */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>How to Build the .apk from the Downloaded Package</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Option A: Android Studio */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Option A: Android Studio (1-Click)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">Easiest</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                  <li>Unzip <code className="text-slate-200">AI_Teacher_Android_App.zip</code></li>
                  <li>Open folder in <strong>Android Studio</strong></li>
                  <li>Click <strong>Build &gt; Build APK(s)</strong></li>
                  <li>Your installable <code className="text-emerald-300">app-debug.apk</code> is ready!</li>
                </ol>
              </div>

              {/* Option B: Terminal / Gradle */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Option B: Command Line (Gradle)</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCmd('./gradlew assembleDebug')}
                    className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-cyan-300 border border-slate-800 flex items-center justify-between">
                  <code>./gradlew assembleDebug</code>
                </div>
                <p className="text-[10px] text-slate-500">
                  Outputs to: <code className="text-slate-400">app/build/outputs/apk/debug/app-debug.apk</code>
                </p>
              </div>
            </div>
          </div>

          {/* Backend Live Voice Server URL Configuration */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-pink-400" />
                <span>Backend Voice Server Connection</span>
              </h4>
              {isSavedServer && (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Saved
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              When installed on a phone as a native APK, the app connects to the live cloud backend for Gemini Live voice processing. You can customize the server URL or leave blank to use the default.
            </p>

            <form onSubmit={handleSaveServerUrl} className="flex gap-2">
              <input
                type="text"
                placeholder="Default: https://ais-dev-3ovvzbwe3y2fxdwgd4xq7b-148475878375.asia-southeast1.run.app"
                value={customServerUrl}
                onChange={(e) => setCustomServerUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Save
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mithila Academy • AI Teacher Android App</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
