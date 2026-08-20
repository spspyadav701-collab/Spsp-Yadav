import React, { useState } from 'react';
import { Layers, Trash2, DownloadCloud, FileCode2, Check } from 'lucide-react';
import JSZip from 'jszip';
import { ImageItem, GeneratorSettings } from '../types';
import { generateEmbeddedHtml } from '../utils/htmlGenerator';
import { formatBytes } from '../utils/imageUtils';

interface BatchManagerProps {
  images: ImageItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  settings: GeneratorSettings;
}

export const BatchManager: React.FC<BatchManagerProps> = ({
  images,
  activeId,
  onSelect,
  onRemove,
  settings,
}) => {
  const [isZipping, setIsZipping] = useState(false);

  if (images.length <= 1) return null;

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('embedded_html_photos');

      for (const img of images) {
        const html = generateEmbeddedHtml(img, {
          ...settings,
          pageTitle: img.customTitle || img.name,
        });
        folder?.file(`${img.name}.html`, html);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'embedded_photos_bundle.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-xs uppercase tracking-wider">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Uploaded Image Queue ({images.length})</span>
        </div>

        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={isZipping}
          id="btn-download-zip"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
        >
          {isZipping ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <DownloadCloud className="w-3.5 h-3.5" />
          )}
          <span>Download All (.zip)</span>
        </button>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1">
        {images.map((img) => {
          const isSelected = img.id === activeId;
          return (
            <div
              key={img.id}
              onClick={() => onSelect(img.id)}
              className={`group relative flex-shrink-0 w-36 rounded-lg border p-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30'
              }`}
            >
              <div className="w-full h-20 bg-slate-950 rounded overflow-hidden flex items-center justify-center mb-1.5">
                <img
                  src={img.base64DataUri}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate w-24">
                  {img.originalFileName}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(img.id);
                  }}
                  title="Remove image"
                  className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                <span>{formatBytes(img.fileSize)}</span>
                {isSelected && <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Active</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
