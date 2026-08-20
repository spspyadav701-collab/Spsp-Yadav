import React, { useState } from 'react';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  ExternalLink, 
  RefreshCw, 
  Maximize,
  ZoomIn
} from 'lucide-react';

interface PreviewFrameProps {
  htmlContent: string;
  title: string;
}

type DeviceMode = 'responsive' | 'desktop' | 'tablet' | 'mobile';

export const PreviewFrame: React.FC<PreviewFrameProps> = ({ htmlContent, title }) => {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('responsive');
  const [refreshKey, setRefreshKey] = useState(0);

  const getFrameWidth = () => {
    switch (deviceMode) {
      case 'desktop': return 'max-w-[1024px]';
      case 'tablet': return 'max-w-[768px]';
      case 'mobile': return 'max-w-[375px]';
      case 'responsive': default: return 'w-full';
    }
  };

  const handleOpenInNewTab = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-lg">
      {/* Top Preview Control Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 text-xs text-slate-300 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">Live HTML Preview</span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            {deviceMode.toUpperCase()}
          </span>
        </div>

        {/* Viewport Width Presets */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
          <button
            type="button"
            id="view-mode-responsive"
            onClick={() => setDeviceMode('responsive')}
            title="Full Width Responsive"
            className={`p-1.5 rounded-md transition-colors ${
              deviceMode === 'responsive' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="view-mode-desktop"
            onClick={() => setDeviceMode('desktop')}
            title="Desktop (1024px)"
            className={`p-1.5 rounded-md transition-colors ${
              deviceMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="view-mode-tablet"
            onClick={() => setDeviceMode('tablet')}
            title="Tablet (768px)"
            className={`p-1.5 rounded-md transition-colors ${
              deviceMode === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="view-mode-mobile"
            onClick={() => setDeviceMode('mobile')}
            title="Mobile (375px)"
            className={`p-1.5 rounded-md transition-colors ${
              deviceMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRefreshKey(k => k + 1)}
            id="btn-refresh-preview"
            title="Reload Preview Frame"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleOpenInNewTab}
            id="btn-open-new-tab"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Tab</span>
          </button>
        </div>
      </div>

      {/* Frame Canvas */}
      <div className="flex-1 bg-zinc-950/70 p-3 sm:p-4 flex items-center justify-center min-h-[380px] overflow-auto">
        <div className={`w-full h-full min-h-[360px] transition-all duration-300 flex items-center justify-center ${getFrameWidth()}`}>
          <iframe
            key={refreshKey}
            id="preview-iframe"
            title={`Preview: ${title}`}
            srcDoc={htmlContent}
            sandbox="allow-scripts allow-downloads allow-same-origin"
            className="w-full h-[460px] sm:h-[540px] rounded-lg border border-slate-800 bg-black shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};
