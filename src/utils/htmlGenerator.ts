import { GeneratorSettings, ImageItem } from '../types';

export function generateEmbeddedHtml(image: ImageItem, settings: GeneratorSettings): string {
  const activeDataUri = (settings.enableOptimization && image.optimizedBase64DataUri)
    ? image.optimizedBase64DataUri
    : image.base64DataUri;

  const title = settings.pageTitle || image.customTitle || image.name || 'Embedded Photo';
  const metaDesc = settings.metaDescription || `Embedded image of ${image.originalFileName}`;
  
  // Resolve Background CSS
  let bgCss = '#000000';
  let isDark = true;
  switch (settings.backgroundType) {
    case 'black':
      bgCss = '#000000';
      isDark = true;
      break;
    case 'charcoal':
      bgCss = '#0f172a';
      isDark = true;
      break;
    case 'slate':
      bgCss = '#18181b';
      isDark = true;
      break;
    case 'white':
      bgCss = '#ffffff';
      isDark = false;
      break;
    case 'warm-light':
      bgCss = '#f8fafc';
      isDark = false;
      break;
    case 'checkerboard':
      bgCss = `repeating-conic-gradient(#27272a 0% 25%, #18181b 0% 50%) 50% / 20px 20px`;
      isDark = true;
      break;
    case 'gradient-dark':
      bgCss = 'radial-gradient(ellipse at center, #1e293b 0%, #090d16 100%)';
      isDark = true;
      break;
    case 'gradient-light':
      bgCss = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
      isDark = false;
      break;
    case 'custom':
      bgCss = settings.customBackgroundColor || '#000000';
      isDark = true;
      break;
  }

  // Resolve Shadow CSS
  let shadowCss = 'none';
  if (settings.shadow === 'subtle') shadowCss = '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)';
  else if (settings.shadow === 'elevated') shadowCss = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
  else if (settings.shadow === 'glow') shadowCss = isDark ? '0 0 50px rgba(59, 130, 246, 0.3)' : '0 10px 30px rgba(0, 0, 0, 0.15)';

  // Border CSS
  const borderCss = settings.borderWidth > 0 ? `${settings.borderWidth}px solid ${settings.borderColor}` : 'none';
  const radiusCss = settings.borderRadius > 0 ? `${settings.borderRadius}px` : '0px';

  // Specific layout structures
  if (settings.layout === 'minimal-raw') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      background: ${bgCss};
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    img {
      max-width: ${settings.maxWidth};
      max-height: ${settings.maxHeight};
      height: auto;
      display: block;
      object-fit: ${settings.objectFit};
      border-radius: ${radiusCss};
      box-shadow: ${shadowCss};
      border: ${borderCss};
    }
  </style>
</head>
<body>
  <img src="${activeDataUri}" alt="${escapeHtml(title)}">
</body>
</html>`;
  }

  // Interactive viewer or standard centered layout
  const captionHtml = settings.includeCaption && (settings.captionText || image.customCaption)
    ? `<div class="caption">${escapeHtml(settings.captionText || image.customCaption || '')}</div>`
    : '';

  const badgeHtml = settings.showDimensionsBadge
    ? `<div class="badge">${image.width} × ${image.height} px · ${image.mimeType.replace('image/', '').toUpperCase()}</div>`
    : '';

  const toolbarHtml = (settings.enableDownloadButton || settings.enableThemeToggle) ? `
    <div class="toolbar" id="toolbar">
      ${settings.enableThemeToggle ? `<button id="btnTheme" title="Toggle Light/Dark Background" onclick="toggleTheme()">🌓</button>` : ''}
      ${settings.enableDownloadButton ? `<a id="btnDownload" href="${activeDataUri}" download="${image.originalFileName || 'photo.jpg'}" title="Download Original Image">⬇ Save</a>` : ''}
    </div>
  ` : '';

  const interactiveScripts = `
  <script>
    ${settings.enableZoomOnClick ? `
      let isZoomed = false;
      const img = document.getElementById('main-photo');
      if (img) {
        img.addEventListener('click', function(e) {
          isZoomed = !isZoomed;
          if (isZoomed) {
            img.classList.add('zoomed');
            document.body.classList.add('overflow-auto');
          } else {
            img.classList.remove('zoomed');
            document.body.classList.remove('overflow-auto');
          }
        });
      }
    ` : ''}

    ${settings.enableFullscreenKey ? `
      document.addEventListener('keydown', function(e) {
        if (e.key === 'f' || e.key === 'F') {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {});
          } else {
            document.exitFullscreen().catch(err => {});
          }
        }
      });
    ` : ''}

    ${settings.enableThemeToggle ? `
      let themeState = 'custom';
      function toggleTheme() {
        const body = document.body;
        if (body.classList.contains('light-mode')) {
          body.classList.remove('light-mode');
          body.classList.add('dark-mode');
        } else if (body.classList.contains('dark-mode')) {
          body.classList.remove('dark-mode');
        } else {
          body.classList.add('light-mode');
        }
      }
    ` : ''}
  </script>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(metaDesc)}">
  <title>${escapeHtml(title)}</title>
  <style>
    *, *::before, *::after {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    :root {
      --bg-color: ${bgCss};
      --text-color: ${isDark ? '#f1f5f9' : '#0f172a'};
      --sub-color: ${isDark ? '#94a3b8' : '#64748b'};
    }
    html, body {
      width: 100%;
      min-height: 100vh;
      background: var(--bg-color);
      color: var(--text-color);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: ${settings.padding}px;
      transition: background 0.25s ease;
    }
    body.light-mode {
      background: #ffffff !important;
      color: #0f172a !important;
    }
    body.dark-mode {
      background: #000000 !important;
      color: #f1f5f9 !important;
    }
    body.overflow-auto {
      overflow: auto;
    }
    .wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      max-width: 100%;
      position: relative;
    }
    .img-container {
      position: relative;
      display: inline-block;
      max-width: 100%;
    }
    img {
      max-width: ${settings.maxWidth};
      max-height: ${settings.maxHeight};
      width: auto;
      height: auto;
      display: block;
      margin: 0 auto;
      object-fit: ${settings.objectFit};
      border-radius: ${radiusCss};
      box-shadow: ${shadowCss};
      border: ${borderCss};
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
      ${settings.enableZoomOnClick ? 'cursor: zoom-in;' : ''}
    }
    ${settings.enableZoomOnClick ? `
    img.zoomed {
      max-width: none !important;
      max-height: none !important;
      cursor: zoom-out !important;
      transform: scale(1.5);
      z-index: 100;
    }
    ` : ''}
    .caption {
      margin-top: 14px;
      font-size: 14px;
      color: ${settings.captionColor || 'var(--sub-color)'};
      text-align: center;
      max-width: 600px;
      line-height: 1.5;
    }
    .badge {
      margin-top: 10px;
      display: inline-block;
      font-size: 12px;
      font-family: monospace;
      padding: 4px 10px;
      background: rgba(125, 125, 125, 0.15);
      border: 1px solid rgba(125, 125, 125, 0.2);
      border-radius: 9999px;
      color: var(--sub-color);
    }
    .toolbar {
      position: fixed;
      top: 16px;
      right: 16px;
      display: flex;
      gap: 8px;
      z-index: 999;
    }
    .toolbar button, .toolbar a {
      background: rgba(20, 20, 25, 0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.18);
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 6px;
      text-decoration: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease, transform 0.1s ease;
    }
    .toolbar button:hover, .toolbar a:hover {
      background: rgba(45, 45, 55, 0.9);
      transform: translateY(-1px);
    }
  </style>
</head>
<body>
  ${toolbarHtml}
  <div class="wrapper">
    <div class="img-container">
      <img id="main-photo" src="${activeDataUri}" alt="${escapeHtml(title)}" loading="eager" />
    </div>
    ${captionHtml}
    ${badgeHtml}
  </div>
  ${interactiveScripts}
</body>
</html>`;
}

export function generatePythonScript(
  imagePath: string = '/mnt/data/1000011307.jpg', 
  outHtml: string = '/mnt/data/embedded_photo.html'
): string {
  return `import base64
from pathlib import Path

# 1. Read input image and encode to Base64
img_path = Path("${imagePath}")
img_b64 = base64.b64encode(img_path.read_bytes()).decode("ascii")

# Determine mime type from extension
suffix = img_path.suffix.lower().replace(".", "")
mime_type = "image/png" if suffix == "png" else ("image/webp" if suffix == "webp" else ("image/svg+xml" if suffix == "svg" else "image/jpeg"))

# 2. Build self-contained HTML document
html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Embedded Image</title>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    html, body {{
      margin: 0;
      padding: 0;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }}
    img {{
      max-width: 100%;
      height: auto;
      display: block;
    }}
  </style>
</head>
<body>
  <img src="data:{mime_type};base64,{img_b64}" alt="Embedded Image" />
</body>
</html>
"""

# 3. Save standalone output HTML file
out = Path("${outHtml}")
out.write_text(html, encoding="utf-8")

print(f"Created: {out}")
print(f"HTML size: {out.stat().st_size / 1024:.1f} KB")
`;
}

export function generateNodeScript(imageName: string = 'photo.jpg', outHtml: string = 'embedded_photo.html'): string {
  return `import fs from 'fs';
import path from 'path';

const imgPath = path.resolve('${imageName}');
const imgBuffer = fs.readFileSync(imgPath);
const base64Data = imgBuffer.toString('base64');
const ext = path.extname(imgPath).toLowerCase().replace('.', '');
const mime = ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');

const html = \`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Embedded Photo</title>
  <style>
    body { margin: 0; background: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <img src="data:\${mime};base64,\${base64Data}">
</body>
</html>\`;

fs.writeFileSync('${outHtml}', html, 'utf-8');
console.log('Saved ${outHtml} (' + (Buffer.byteLength(html) / 1024).toFixed(1) + ' KB)');
`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
