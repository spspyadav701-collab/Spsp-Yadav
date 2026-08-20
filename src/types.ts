export interface ImageItem {
  id: string;
  name: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  base64DataUri: string; // "data:image/jpeg;base64,..."
  rawBase64: string;
  optimizedBase64DataUri?: string;
  optimizedFileSize?: number;
  customTitle?: string;
  customCaption?: string;
}

export type LayoutPreset = 'viewport-center' | 'document-card' | 'interactive-viewer' | 'minimal-raw' | 'responsive-hero';

export type BackgroundPreset = 'black' | 'charcoal' | 'slate' | 'white' | 'warm-light' | 'checkerboard' | 'gradient-dark' | 'gradient-light' | 'custom';

export type ShadowPreset = 'none' | 'subtle' | 'elevated' | 'glow' | 'border-only';

export interface GeneratorSettings {
  // Page info
  pageTitle: string;
  metaDescription: string;
  fileName: string;
  
  // Layout & Styling
  layout: LayoutPreset;
  backgroundType: BackgroundPreset;
  customBackgroundColor: string;
  customGradient: string;
  maxWidth: string; // e.g. "100%", "800px", "1200px", "none"
  maxHeight: string; // e.g. "100vh", "90vh", "auto"
  objectFit: 'contain' | 'cover' | 'scale-down' | 'none';
  borderRadius: number; // in px
  shadow: ShadowPreset;
  borderWidth: number; // in px
  borderColor: string;
  padding: number; // in px
  
  // Captions & Metadata
  includeCaption: boolean;
  captionText: string;
  captionColor: string;
  showDimensionsBadge: boolean;
  
  // Interactive features embedded inside the standalone HTML
  enableZoomOnClick: boolean;
  enableFullscreenKey: boolean;
  enableDownloadButton: boolean;
  enableThemeToggle: boolean;
  
  // Optimization
  enableOptimization: boolean;
  quality: number; // 0.1 to 1.0
  maxDimension: number; // e.g., 1920, 2560, 0 for original
  outputFormat: 'original' | 'image/jpeg' | 'image/webp' | 'image/png';
}

export const DEFAULT_SETTINGS: GeneratorSettings = {
  pageTitle: 'Embedded Photo',
  metaDescription: 'Standalone image embedded in HTML with Base64 data',
  fileName: 'embedded_photo.html',
  layout: 'viewport-center',
  backgroundType: 'black',
  customBackgroundColor: '#000000',
  customGradient: 'radial-gradient(circle, #1e293b 0%, #020617 100%)',
  maxWidth: '100%',
  maxHeight: '100vh',
  objectFit: 'contain',
  borderRadius: 0,
  shadow: 'none',
  borderWidth: 0,
  borderColor: '#334155',
  padding: 0,
  includeCaption: false,
  captionText: '',
  captionColor: '#94a3b8',
  showDimensionsBadge: false,
  enableZoomOnClick: true,
  enableFullscreenKey: true,
  enableDownloadButton: false,
  enableThemeToggle: false,
  enableOptimization: false,
  quality: 0.9,
  maxDimension: 1920,
  outputFormat: 'original',
};
