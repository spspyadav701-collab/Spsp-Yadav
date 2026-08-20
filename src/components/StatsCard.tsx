import React from 'react';
import { Download, CheckCircle2, HardDrive, Maximize, FileCode } from 'lucide-react';
import { ImageItem } from '../types';
import { formatBytes } from '../utils/imageUtils';

interface StatsCardProps {
  image: ImageItem;
  htmlContent: string;
  fileName: string;
  onDownload: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  image,
  htmlContent,
  fileName,
  onDownload,
}) => {
  const htmlBytes = new Blob([htmlContent]).size;
  const base64Bytes = image.base64DataUri.length;
  const expansionPercent = Math.round(((htmlBytes - image.fileSize) / (image.fileSize || 1)) * 100);

  return (
    <div className="bg-white dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: File Summary & Stats */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Original File</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {formatBytes(image.fileSize)}
            </span>
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <div>
            <span className="text-slate-400 block font-medium">HTML Standalone</span>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {formatBytes(htmlBytes)}
            </span>
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <div>
            <span className="text-slate-400 block font-medium">Dimensions</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {image.width} × {image.height} px
            </span>
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <div>
            <span className="text-slate-400 block font-medium">Type</span>
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {image.mimeType.replace('image/', '')}
            </span>
          </div>
        </div>

        {/* Right: Primary Download Button */}
        <button
          type="button"
          onClick={onDownload}
          id="btn-download-main-html"
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.01]"
        >
          <Download className="w-4 h-4" />
          <span>Download {fileName || 'embedded_photo.html'}</span>
        </button>
      </div>
    </div>
  );
};
