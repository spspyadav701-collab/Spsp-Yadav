import React from 'react';
import { 
  Sliders, 
  Eye, 
  Palette, 
  Maximize2, 
  Sparkles, 
  FileType, 
  SlidersHorizontal,
  Info,
  Check
} from 'lucide-react';
import { GeneratorSettings, BackgroundPreset, ShadowPreset, LayoutPreset, ImageItem } from '../types';

interface SettingsPanelProps {
  settings: GeneratorSettings;
  onChange: (updated: Partial<GeneratorSettings>) => void;
  activeImage: ImageItem | null;
  onOptimizeToggle?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onChange,
  activeImage,
}) => {
  const bgPresets: Array<{ id: BackgroundPreset; label: string; bgClass: string; isDark: boolean }> = [
    { id: 'black', label: 'Deep Black (#000)', bgClass: 'bg-black text-white border-zinc-700', isDark: true },
    { id: 'charcoal', label: 'Charcoal Slate', bgClass: 'bg-slate-900 text-white border-slate-700', isDark: true },
    { id: 'slate', label: 'Zinc Dark', bgClass: 'bg-zinc-800 text-white border-zinc-600', isDark: true },
    { id: 'white', label: 'Pure White', bgClass: 'bg-white text-slate-900 border-slate-300', isDark: false },
    { id: 'warm-light', label: 'Neutral Light', bgClass: 'bg-slate-100 text-slate-900 border-slate-300', isDark: false },
    { id: 'gradient-dark', label: 'Dark Radial', bgClass: 'bg-gradient-to-br from-slate-800 to-black text-white border-slate-700', isDark: true },
    { id: 'checkerboard', label: 'Transparency', bgClass: 'bg-zinc-800 text-white border-zinc-600', isDark: true },
    { id: 'custom', label: 'Custom Color', bgClass: 'bg-indigo-900 text-white border-indigo-600', isDark: true },
  ];

  const layoutPresets: Array<{ id: LayoutPreset; label: string; desc: string }> = [
    { id: 'viewport-center', label: 'Centered Viewport', desc: '100vh flex center (Default Python script style)' },
    { id: 'interactive-viewer', label: 'Interactive Viewer', desc: 'Click-to-zoom, responsive controls, toolbar' },
    { id: 'document-card', label: 'Document & Caption', desc: 'Centered card with title and subtitle metadata' },
    { id: 'minimal-raw', label: 'Minimal HTML', desc: 'Lightest pure markup without extra wrappers' },
  ];

  return (
    <div className="flex flex-col gap-6 text-sm text-slate-700 dark:text-slate-200">
      {/* 1. Document & File Settings */}
      <div className="bg-white dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-slate-100 font-semibold text-xs uppercase tracking-wider">
          <FileType className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Document & Metadata</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Page &lt;title&gt;
            </label>
            <input
              type="text"
              id="input-page-title"
              value={settings.pageTitle}
              onChange={(e) => onChange({ pageTitle: e.target.value })}
              placeholder="Embedded Image"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Output Filename (.html)
            </label>
            <input
              type="text"
              id="input-filename"
              value={settings.fileName}
              onChange={(e) => onChange({ fileName: e.target.value })}
              placeholder="embedded_photo.html"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* 2. Background Theme Presets */}
      <div className="bg-white dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-xs uppercase tracking-wider">
            <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Background Styling</span>
          </div>
          {settings.backgroundType === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.customBackgroundColor}
                onChange={(e) => onChange({ customBackgroundColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                title="Choose custom background color"
              />
              <span className="text-xs font-mono text-slate-500">{settings.customBackgroundColor}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {bgPresets.map((bg) => (
            <button
              key={bg.id}
              type="button"
              id={`bg-preset-${bg.id}`}
              onClick={() => onChange({ backgroundType: bg.id })}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                settings.backgroundType === bg.id
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              } ${bg.bgClass}`}
            >
              <span className="truncate">{bg.label}</span>
              {settings.backgroundType === bg.id && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-indigo-400" />}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Layout & Presentation Preset */}
      <div className="bg-white dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-slate-100 font-semibold text-xs uppercase tracking-wider">
          <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>HTML Layout & Presentation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {layoutPresets.map((l) => (
            <button
              key={l.id}
              type="button"
              id={`layout-preset-${l.id}`}
              onClick={() => onChange({ layout: l.id })}
              className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                settings.layout === l.id
                  ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-500/30'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full font-semibold text-xs mb-0.5">
                <span>{l.label}</span>
                {settings.layout === l.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{l.desc}</span>
            </button>
          ))}
        </div>

        {/* Detailed Image Dimensions & Styling Controls */}
        <div className="border-t border-slate-100 dark:border-slate-700/60 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Max Width</label>
            <select
              value={settings.maxWidth}
              onChange={(e) => onChange({ maxWidth: e.target.value })}
              id="select-max-width"
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="100%">100% (Responsive)</option>
              <option value="800px">800px (Medium)</option>
              <option value="1200px">1200px (Wide)</option>
              <option value="none">None (Natural Size)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Max Height</label>
            <select
              value={settings.maxHeight}
              onChange={(e) => onChange({ maxHeight: e.target.value })}
              id="select-max-height"
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="100vh">100vh (Fit Screen)</option>
              <option value="90vh">90vh (Padded)</option>
              <option value="auto">Auto (Scrollable)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Corner Radius</label>
            <select
              value={settings.borderRadius}
              onChange={(e) => onChange({ borderRadius: parseInt(e.target.value, 10) })}
              id="select-border-radius"
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value={0}>Square (0px)</option>
              <option value={8}>Rounded (8px)</option>
              <option value={16}>Smooth (16px)</option>
              <option value={24}>Curved (24px)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Interactive Embedded Capabilities */}
      <div className="bg-white dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-slate-100 font-semibold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Embedded HTML Features</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/60">
            <input
              type="checkbox"
              id="check-zoom-click"
              checked={settings.enableZoomOnClick}
              onChange={(e) => onChange({ enableZoomOnClick: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Click image to Zoom</span>
          </label>

          <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/60">
            <input
              type="checkbox"
              id="check-fullscreen-key"
              checked={settings.enableFullscreenKey}
              onChange={(e) => onChange({ enableFullscreenKey: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Press 'F' for Fullscreen</span>
          </label>

          <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/60">
            <input
              type="checkbox"
              id="check-download-btn"
              checked={settings.enableDownloadButton}
              onChange={(e) => onChange({ enableDownloadButton: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Include Download Button in HTML</span>
          </label>

          <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/60">
            <input
              type="checkbox"
              id="check-theme-toggle"
              checked={settings.enableThemeToggle}
              onChange={(e) => onChange({ enableThemeToggle: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Include Light/Dark Toggle</span>
          </label>
        </div>
      </div>
    </div>
  );
};
