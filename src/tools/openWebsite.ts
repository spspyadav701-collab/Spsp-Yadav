import { FunctionDeclaration, Type } from '@google/genai';

/**
 * Tool definition for Gemini Live API
 */
export const openWebsiteDeclaration: FunctionDeclaration = {
  name: 'openWebsite',
  description: 'Opens a target website or web app in the browser (e.g., YouTube, WhatsApp, Google Search, Wikipedia, Maps, etc.) based on the user request.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: 'The full URL or web address to open, e.g. https://www.youtube.com, https://web.whatsapp.com, https://www.google.com',
      },
      name: {
        type: Type.STRING,
        description: 'Optional friendly name of the service, e.g. "YouTube", "WhatsApp"',
      },
    },
    required: ['url'],
  },
};

/**
 * Safely sanitizes and validates the target URL
 */
export function sanitizeUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  
  // Common quick shortcuts
  const lower = url.toLowerCase();
  if (lower === 'youtube' || lower === 'youtube.com') return 'https://www.youtube.com';
  if (lower === 'whatsapp' || lower === 'whatsapp.com' || lower === 'watsapp') return 'https://web.whatsapp.com';
  if (lower === 'google' || lower === 'google.com' || lower === 'chrome') return 'https://www.google.com';
  if (lower === 'wikipedia' || lower === 'wikipedia.org') return 'https://www.wikipedia.org';
  if (lower === 'github' || lower === 'github.com') return 'https://github.com';

  // Ensure protocol exists
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    // Disallow javascript: or file: or data: URIs
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'https://www.google.com/search?q=' + encodeURIComponent(rawUrl);
    }
    return parsed.toString();
  } catch {
    return 'https://www.google.com/search?q=' + encodeURIComponent(rawUrl);
  }
}

/**
 * Client-side execution of openWebsite tool
 */
export function executeOpenWebsite(args: { url: string; name?: string }): { success: boolean; message: string; openedUrl: string } {
  try {
    const targetUrl = sanitizeUrl(args.url);
    const serviceName = args.name || new URL(targetUrl).hostname;
    
    // Trigger browser navigation/tab open
    const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    
    if (win) {
      return {
        success: true,
        message: `Successfully opened ${serviceName} in a new tab: ${targetUrl}`,
        openedUrl: targetUrl,
      };
    } else {
      // If popup blocker intervened, fallback to top-level or return info
      return {
        success: true,
        message: `Triggered opening ${serviceName} (${targetUrl}). If popup was blocked, user can click the toast action.`,
        openedUrl: targetUrl,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to open website: ${error?.message || 'Unknown error'}`,
      openedUrl: args.url,
    };
  }
}
