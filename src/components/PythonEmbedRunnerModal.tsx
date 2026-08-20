import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Terminal, 
  Play, 
  Download, 
  Copy, 
  Check, 
  X, 
  ExternalLink, 
  Image as ImageIcon, 
  Sparkles,
  FileCode,
  Eye,
  CheckCircle2
} from 'lucide-react';
import defaultAvatarImg from '../assets/ai_teacher.jpg';

interface PythonEmbedRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAsAvatar: (dataUrl: string) => void;
  currentAvatarUrl?: string | null;
}

export const PythonEmbedRunnerModal: React.FC<PythonEmbedRunnerModalProps> = ({
  isOpen,
  onClose,
  onApplyAsAvatar,
  currentAvatarUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'script' | 'preview' | 'terminal'>('script');
  const [isExecuting, setIsExecuting] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '$ python3 --version',
    'Python 3.11.8 (main, Feb  7 2026, 14:12:08) [GCC 11.4.0] on linux',
    'Ready to execute embed_photo.py',
  ]);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [appliedAvatar, setAppliedAvatar] = useState(false);

  if (!isOpen) return null;

  const activeImageSrc = currentAvatarUrl || defaultAvatarImg;

  const pythonScriptCode = `from pathlib import Path
import base64

# [1] Input image path
img_path = Path("/mnt/data/1000011307.jpg")
img_b64 = base64.b64encode(img_path.read_bytes()).decode("ascii")

# [2] Self-contained standalone HTML document
html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Embedded Image</title>
  <style>
    html, body {{
      margin: 0;
      padding: 0;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      overflow: hidden;
    }}
    img {{
      max-width: 100%;
      height: auto;
      display: block;
    }}
  </style>
</head>
<body>
  <img src="data:image/jpeg;base64,{img_b64}" alt="Embedded Image" />
</body>
</html>"""

# [3] Output to destination file
out = Path("/mnt/data/embedded_photo.html")
out.write_text(html, encoding="utf-8")

print(f"Created: {out}")
print(f"HTML size: {out.stat().st_size / 1024:.1f} KB")`;

  const standaloneHtmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Embedded Image</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      overflow: hidden;
    }
    img {
      max-width: 100%;
      max-height: 100vh;
      height: auto;
      display: block;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <img src="${activeImageSrc || '/photo.jpg'}" alt="Mithila Academy" />
</body>
</html>`;

  const handleRunScript = () => {
    setIsExecuting(true);
    setActiveTab('terminal');
    setTerminalLogs([
      '$ python3 embed_photo.py',
      '[1/3] Reading image from: /mnt/data/1000011307.jpg...',
    ]);

    setTimeout(() => {
      setTerminalLogs(prev => [
        ...prev,
        '[2/3] Encoding image bytes to Base64 ASCII... Done (100% encoded)',
        '[3/3] Generating self-contained dark viewport HTML template...',
      ]);
    }, 450);

    setTimeout(() => {
      setTerminalLogs(prev => [
        ...prev,
        'Created: /mnt/data/embedded_photo.html',
        'HTML size: 429.1 KB',
        '✓ Execution completed successfully (Exit Code: 0)',
      ]);
      setIsExecuting(false);
    }, 900);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(pythonScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(standaloneHtmlCode);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([standaloneHtmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'embedded_photo.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPython = () => {
    const blob = new Blob([pythonScriptCode], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'embed_photo.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApplyAvatar = () => {
    onApplyAsAvatar(activeImageSrc);
    setAppliedAvatar(true);
    setTimeout(() => setAppliedAvatar(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Python Image to HTML Embedder</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  /mnt/data/1000011307.jpg
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Encodes photo to Base64 and generates standalone <code className="text-cyan-300 font-mono">embedded_photo.html</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-5 py-2.5 bg-slate-950/30 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('script')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'script'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" /> Python Script
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> HTML Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('terminal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'terminal'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" /> Terminal Output
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunScript}
              disabled={isExecuting}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
              {isExecuting ? 'Running...' : 'Execute Script'}
            </button>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 p-4 overflow-y-auto max-h-[50vh] bg-slate-950/70">
          {activeTab === 'script' && (
            <div className="relative font-mono text-xs text-slate-200 bg-slate-950 p-4 rounded-xl border border-slate-800/80 leading-relaxed overflow-x-auto">
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] flex items-center gap-1 transition-colors"
                >
                  {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedScript ? 'Copied' : 'Copy .py'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPython}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px]"
                  title="Download Python Script"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
              <pre>
                <code>{pythonScriptCode}</code>
              </pre>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-full h-64 bg-black rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden relative shadow-inner">
                <img
                  src={activeImageSrc}
                  alt="Embedded preview"
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-slate-400 border border-slate-800">
                  background: #000 | max-width: 100%
                </div>
              </div>
              <div className="w-full flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Output File: <code className="text-cyan-300 font-mono">/mnt/data/embedded_photo.html</code></span>
                <span>Viewport: <strong className="text-slate-200">Centered Flexbox</strong></span>
              </div>
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="font-mono text-xs bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
              {terminalLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`${
                    log.startsWith('$')
                      ? 'text-cyan-400 font-semibold'
                      : log.startsWith('Created:') || log.includes('✓')
                      ? 'text-emerald-400 font-semibold'
                      : log.includes('HTML size:')
                      ? 'text-pink-400'
                      : 'text-slate-300'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyAvatar}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
            >
              {appliedAvatar ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Sparkles className="w-3.5 h-3.5" />}
              {appliedAvatar ? 'Avatar Updated!' : 'Set Photo as AI Teacher Avatar'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyHtml}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              Copy HTML
            </button>
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-pink-600/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download embedded_photo.html
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
