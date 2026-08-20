import React, { useState } from 'react';
import { Copy, Check, Terminal, Code, FileText, Download, Play, RefreshCw, Zap } from 'lucide-react';
import { ImageItem, GeneratorSettings } from '../types';
import { generatePythonScript, generateNodeScript } from '../utils/htmlGenerator';
import { formatBytes } from '../utils/imageUtils';

interface CodeViewerProps {
  htmlContent: string;
  activeImage: ImageItem;
  settings: GeneratorSettings;
}

type CodeTab = 'python-runner' | 'html' | 'data-uri' | 'python-code' | 'node';

export const CodeViewer: React.FC<CodeViewerProps> = ({
  htmlContent,
  activeImage,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<CodeTab>('python-runner');
  const [copied, setCopied] = useState<string | null>(null);
  
  // Custom path variables for the Python Script
  const [inputPath, setInputPath] = useState<string>(
    activeImage.originalFileName === '1000011307.jpg' 
      ? '/mnt/data/1000011307.jpg' 
      : `/mnt/data/${activeImage.originalFileName}`
  );
  const [outputPath, setOutputPath] = useState<string>('/mnt/data/embedded_photo.html');

  // Terminal Runner State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [hasExecuted, setHasExecuted] = useState<boolean>(false);

  const pythonScript = generatePythonScript(inputPath, outputPath);
  const nodeScript = generateNodeScript(activeImage.originalFileName || 'photo.jpg', settings.fileName || 'embedded_photo.html');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadFile = (content: string, filename: string, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const executePythonSimulation = () => {
    setIsRunning(true);
    setHasExecuted(false);
    setTerminalLogs([`$ python3 embed_photo.py`]);

    const htmlBytes = new Blob([htmlContent]).size;
    const htmlKb = (htmlBytes / 1024).toFixed(1);

    setTimeout(() => {
      setTerminalLogs(prev => [
        ...prev,
        `[1/3] Reading image from: ${inputPath} (${formatBytes(activeImage.fileSize)})`,
      ]);
    }, 250);

    setTimeout(() => {
      setTerminalLogs(prev => [
        ...prev,
        `[2/3] Encoding image to Base64 ASCII... Done (${activeImage.rawBase64.length.toLocaleString()} characters)`,
      ]);
    }, 550);

    setTimeout(() => {
      setTerminalLogs(prev => [
        ...prev,
        `[3/3] Generating self-contained HTML document with dark viewport centering...`,
        `Created: ${outputPath}`,
        `HTML size: ${htmlKb} KB`,
        `✓ Process finished successfully (exit code 0).`,
      ]);
      setIsRunning(false);
      setHasExecuted(true);
    }, 900);
  };

  const getActiveCode = () => {
    switch (activeTab) {
      case 'html': return htmlContent;
      case 'data-uri': return activeImage.base64DataUri;
      case 'python-code':
      case 'python-runner':
        return pythonScript;
      case 'node': return nodeScript;
      default: return htmlContent;
    }
  };

  const activeCode = getActiveCode();

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-lg text-slate-200">
      {/* Code Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-950/90 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            id="tab-python-runner"
            onClick={() => setActiveTab('python-runner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'python-runner' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Python Script &amp; Runner</span>
          </button>

          <button
            type="button"
            id="tab-code-html"
            onClick={() => setActiveTab('html')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'html' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Generated HTML</span>
          </button>

          <button
            type="button"
            id="tab-code-datauri"
            onClick={() => setActiveTab('data-uri')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'data-uri' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Base64 Data URI</span>
          </button>

          <button
            type="button"
            id="tab-code-node"
            onClick={() => setActiveTab('node')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'node' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Node.js Script</span>
          </button>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'python-runner' && (
            <button
              type="button"
              id="btn-download-python-script"
              onClick={() => handleDownloadFile(pythonScript, 'embed_photo.py', 'text/x-python')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .py</span>
            </button>
          )}

          <button
            type="button"
            id="btn-copy-code"
            onClick={() => handleCopy(activeCode, activeTab)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            {copied === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="relative flex-1 bg-slate-950 p-4 font-mono text-xs overflow-auto max-h-[520px]">
        {activeTab === 'python-runner' ? (
          <div className="flex flex-col gap-4">
            {/* Customizable Path Controls */}
            <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Input Image Path (img_path)
                </label>
                <input
                  type="text"
                  id="input-python-img-path"
                  value={inputPath}
                  onChange={(e) => setInputPath(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs rounded-md border border-slate-700 bg-slate-950 text-slate-200 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Output HTML Path (out)
                </label>
                <input
                  type="text"
                  id="input-python-out-path"
                  value={outputPath}
                  onChange={(e) => setOutputPath(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs rounded-md border border-slate-700 bg-slate-950 text-slate-200 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Run Python Action Bar */}
            <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 font-sans">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-run-python-script"
                  onClick={executePythonSimulation}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {isRunning ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>Run Python Script</span>
                </button>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Simulate executing the exact Python code on your image
                </span>
              </div>

              {hasExecuted && (
                <button
                  type="button"
                  id="btn-terminal-download-html"
                  onClick={() => handleDownloadFile(htmlContent, 'embedded_photo.html', 'text/html')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Output HTML</span>
                </button>
              )}
            </div>

            {/* Interactive Terminal Output */}
            {terminalLogs.length > 0 && (
              <div className="bg-black/90 rounded-lg p-3.5 border border-slate-800 text-emerald-400 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between text-slate-500 text-[11px] pb-2 mb-2 border-b border-slate-800">
                  <span>Terminal Output · Python 3.x</span>
                  <span>exit: 0</span>
                </div>
                <div className="space-y-1">
                  {terminalLogs.map((log, index) => (
                    <div key={index} className={log.startsWith('$') ? 'text-indigo-300 font-bold' : (log.startsWith('Created:') || log.startsWith('HTML size:') ? 'text-amber-300 font-bold' : 'text-slate-300')}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Python Code Editor / Snippet */}
            <div>
              <div className="text-slate-400 text-xs font-medium font-sans mb-1.5">
                Exact Python Code:
              </div>
              <pre className="p-3.5 rounded-lg bg-black/60 border border-slate-800 text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
                {pythonScript}
              </pre>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'data-uri' && (
              <div className="mb-3 p-2 rounded bg-indigo-950/40 border border-indigo-800/50 text-[11px] text-indigo-200 flex items-center justify-between font-sans">
                <span>Direct inline Base64 Data URI for HTML or CSS</span>
                <span className="text-indigo-400 font-semibold">{formatBytes(activeImage.base64DataUri.length)}</span>
              </div>
            )}

            <pre className="text-slate-300 whitespace-pre-wrap break-all leading-relaxed select-all">
              {activeTab === 'data-uri' && activeCode.length > 5000 ? (
                <>
                  <span>{activeCode.slice(0, 1000)}</span>
                  <span className="text-slate-500 italic">
                    {`\n\n... [${(activeCode.length - 2000).toLocaleString()} characters truncated in view, click 'Copy Code' for full payload] ...\n\n`}
                  </span>
                  <span>{activeCode.slice(-1000)}</span>
                </>
              ) : (
                activeCode
              )}
            </pre>
          </>
        )}
      </div>
    </div>
  );
};
