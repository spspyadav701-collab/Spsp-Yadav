import { ImageItem } from '../types';

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function extractRawBase64(dataUri: string): { mimeType: string; rawBase64: string } {
  const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return {
      mimeType: matches[1],
      rawBase64: matches[2],
    };
  }
  return {
    mimeType: 'image/jpeg',
    rawBase64: dataUri.replace(/^data:[^;]+;base64,/, ''),
  };
}

export function getImageDimensions(dataUri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
    };
    img.src = dataUri;
  });
}

export async function processFileToImageItem(file: File): Promise<ImageItem> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUri = e.target?.result as string;
      const { mimeType, rawBase64 } = extractRawBase64(dataUri);
      const dimensions = await getImageDimensions(dataUri);
      
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      resolve({
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: cleanName,
        originalFileName: file.name,
        fileSize: file.size,
        mimeType: file.type || mimeType || 'image/jpeg',
        width: dimensions.width,
        height: dimensions.height,
        base64DataUri: dataUri,
        rawBase64: rawBase64,
        customTitle: cleanName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function optimizeImage(
  dataUri: string,
  quality = 0.85,
  maxDim = 1920,
  targetFormat: 'original' | 'image/jpeg' | 'image/webp' | 'image/png' = 'original'
): Promise<{ optimizedUri: string; rawBase64: string; size: number; width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;
      
      if (maxDim > 0 && (width > maxDim || height > maxDim)) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          optimizedUri: dataUri,
          rawBase64: extractRawBase64(dataUri).rawBase64,
          size: Math.round(dataUri.length * 0.75),
          width: img.width,
          height: img.height,
        });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      let mime = targetFormat === 'original' ? extractRawBase64(dataUri).mimeType : targetFormat;
      if (mime === 'image/svg+xml') {
        mime = 'image/png';
      }

      const optimizedUri = canvas.toDataURL(mime, quality);
      const { rawBase64 } = extractRawBase64(optimizedUri);
      const approxBytes = Math.round((rawBase64.length * 3) / 4);

      resolve({
        optimizedUri,
        rawBase64,
        size: approxBytes,
        width,
        height,
      });
    };
    img.onerror = () => {
      resolve({
        optimizedUri: dataUri,
        rawBase64: extractRawBase64(dataUri).rawBase64,
        size: Math.round(dataUri.length * 0.75),
        width: 0,
        height: 0,
      });
    };
    img.src = dataUri;
  });
}

/**
 * Creates high-quality demo sample images as embedded Data URIs
 */
export function getSampleImages(): Array<{ name: string; description: string; dataUri: string; mimeType: string }> {
  // Sample 1: Mountain Sunset Landscape Canvas
  const canvas1 = document.createElement('canvas');
  canvas1.width = 1200;
  canvas1.height = 800;
  const ctx1 = canvas1.getContext('2d')!;
  if (ctx1) {
    // Sky gradient
    const sky = ctx1.createLinearGradient(0, 0, 0, 500);
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(0.3, '#312e81');
    sky.addColorStop(0.6, '#db2777');
    sky.addColorStop(0.85, '#fb923c');
    sky.addColorStop(1, '#fef08a');
    ctx1.fillStyle = sky;
    ctx1.fillRect(0, 0, 1200, 800);

    // Glowing sun
    ctx1.beginPath();
    ctx1.arc(600, 480, 85, 0, Math.PI * 2);
    ctx1.fillStyle = '#fffbeb';
    ctx1.shadowColor = '#fde047';
    ctx1.shadowBlur = 40;
    ctx1.fill();
    ctx1.shadowBlur = 0;

    // Distant mountain
    ctx1.beginPath();
    ctx1.moveTo(0, 800);
    ctx1.lineTo(200, 420);
    ctx1.lineTo(450, 600);
    ctx1.lineTo(750, 390);
    ctx1.lineTo(1050, 560);
    ctx1.lineTo(1200, 480);
    ctx1.lineTo(1200, 800);
    ctx1.closePath();
    ctx1.fillStyle = '#4c1d95';
    ctx1.fill();

    // Foreground mountain
    ctx1.beginPath();
    ctx1.moveTo(0, 800);
    ctx1.lineTo(100, 520);
    ctx1.lineTo(380, 720);
    ctx1.lineTo(600, 510);
    ctx1.lineTo(880, 690);
    ctx1.lineTo(1200, 530);
    ctx1.lineTo(1200, 800);
    ctx1.closePath();
    ctx1.fillStyle = '#1e1b4b';
    ctx1.fill();

    // Foreground lake reflection
    const lake = ctx1.createLinearGradient(0, 600, 0, 800);
    lake.addColorStop(0, 'rgba(15, 23, 42, 0.9)');
    lake.addColorStop(1, 'rgba(2, 6, 23, 0.98)');
    ctx1.fillStyle = lake;
    ctx1.fillRect(0, 620, 1200, 180);

    // Lake shimmer
    ctx1.fillStyle = 'rgba(251, 146, 60, 0.25)';
    ctx1.fillRect(520, 620, 160, 180);
  }

  // Sample 2: Futuristic Minimal Geometric Cyber Artwork
  const canvas2 = document.createElement('canvas');
  canvas2.width = 1000;
  canvas2.height = 1000;
  const ctx2 = canvas2.getContext('2d')!;
  if (ctx2) {
    ctx2.fillStyle = '#09090b';
    ctx2.fillRect(0, 0, 1000, 1000);

    // Outer circle
    const grad = ctx2.createLinearGradient(100, 100, 900, 900);
    grad.addColorStop(0, '#06b6d4');
    grad.addColorStop(0.5, '#3b82f6');
    grad.addColorStop(1, '#8b5cf6');

    ctx2.lineWidth = 14;
    ctx2.strokeStyle = grad;
    ctx2.beginPath();
    ctx2.arc(500, 500, 320, 0, Math.PI * 2);
    ctx2.stroke();

    // Inner glowing geometric patterns
    ctx2.fillStyle = '#18181b';
    ctx2.beginPath();
    ctx2.arc(500, 500, 240, 0, Math.PI * 2);
    ctx2.fill();

    ctx2.fillStyle = '#fafafa';
    ctx2.font = 'bold 36px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillText('EMBEDDED IMAGE', 500, 480);
    
    ctx2.font = '18px monospace';
    ctx2.fillStyle = '#a1a1aa';
    ctx2.fillText('BASE64 STANDALONE HTML', 500, 530);
  }

  return [
    {
      name: '1000011307.jpg',
      description: 'Default Photo 1000011307.jpg (1200x800)',
      dataUri: canvas1.toDataURL('image/jpeg', 0.92),
      mimeType: 'image/jpeg',
    },
    {
      name: 'sunset-landscape.jpg',
      description: 'Scenic Alpine Sunset (1200x800)',
      dataUri: canvas1.toDataURL('image/jpeg', 0.92),
      mimeType: 'image/jpeg',
    },
    {
      name: 'geometric-artwork.png',
      description: 'Minimal Dark Artwork (1000x1000)',
      dataUri: canvas2.toDataURL('image/png'),
      mimeType: 'image/png',
    },
  ];
}
