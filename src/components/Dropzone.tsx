import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Clipboard, Sparkles, FileImage } from 'lucide-react';
import { getSampleImages, processFileToImageItem } from '../utils/imageUtils';
import { ImageItem } from '../types';

interface DropzoneProps {
  onImagesAdded: (newImages: ImageItem[]) => void;
  hasImages: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onImagesAdded, hasImages }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      const processed = await Promise.all(validFiles.map(processFileToImageItem));
      onImagesAdded(processed);
    } catch (err) {
      console.error('Failed to process image files', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSampleSelect = async (sampleIndex: number) => {
    setIsLoading(true);
    try {
      const samples = getSampleImages();
      const sample = samples[sampleIndex];
      if (!sample) return;

      const res = await fetch(sample.dataUri);
      const blob = await res.blob();
      const file = new File([blob], sample.name, { type: sample.mimeType });
      const item = await processFileToImageItem(file);
      onImagesAdded([item]);
    } catch (e) {
      console.error('Error loading sample image', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        multiple
        accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.svg,.avif,.bmp"
        className="hidden"
        id="image-file-input"
      />

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        id="dropzone-container"
        className={`relative cursor-pointer transition-all duration-200 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.008]'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/70 dark:bg-slate-900/50'
        } ${hasImages ? 'py-5' : 'py-10'}`}
      >
        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 shadow-xs">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <UploadCloud className="w-6 h-6" />
          )}
        </div>

        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
          {isDragging ? 'Drop photo here to embed' : 'Drag & drop image here or click to browse'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 max-w-sm">
          Converts PNG, JPG, WebP, GIF, SVG into a standalone Base64 HTML file. Supports clipboard paste (Ctrl+V).
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs font-mono">
            <FileImage className="w-3.5 h-3.5 mr-1 text-slate-400" /> PNG / JPG / WEBP / SVG
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <Clipboard className="w-3.5 h-3.5 mr-1 text-slate-400" /> Ctrl+V Paste
          </span>
        </div>
      </div>

      {/* Instant Demo Samples */}
      <div className="mt-3 flex items-center justify-between px-1 text-xs">
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Demo Photos:
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSampleSelect(0);
            }}
            id="btn-sample-1000011307"
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors font-mono"
          >
            1000011307.jpg
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSampleSelect(2);
            }}
            id="btn-sample-artwork"
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Minimal Dark PNG
          </button>
        </div>
      </div>
    </div>
  );
};
