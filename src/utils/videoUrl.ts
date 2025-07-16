/**
 * Video URL utilities for handling encoding, validation, and format detection
 */

export interface VideoUrlInfo {
  url: string;
  type: 'youtube' | 'supabase' | 'external';
  format?: string;
  needsEncoding: boolean;
  isValid: boolean;
}

/**
 * Properly encode video URLs to handle special characters
 */
export const encodeVideoUrl = (url: string): string => {
  if (!url) return url;
  
  try {
    // For Supabase URLs, we need to handle special characters in the path
    if (url.includes('supabase.co/storage/v1/object/public/')) {
      const baseUrl = url.substring(0, url.indexOf('/storage/v1/object/public/') + '/storage/v1/object/public/'.length);
      const filePath = url.substring(baseUrl.length);
      
      // Encode only the file path part, not the entire URL
      const encodedPath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
      return baseUrl + encodedPath;
    }
    
    // For other URLs, use standard encoding
    return encodeURI(url);
  } catch (error) {
    console.warn('Error encoding video URL:', error);
    return url;
  }
};

/**
 * Decode video URLs for display purposes
 */
export const decodeVideoUrl = (url: string): string => {
  if (!url) return url;
  
  try {
    return decodeURIComponent(url);
  } catch (error) {
    console.warn('Error decoding video URL:', error);
    return url;
  }
};

/**
 * Analyze video URL to determine type and characteristics
 */
export const analyzeVideoUrl = (url: string): VideoUrlInfo => {
  if (!url) {
    return {
      url,
      type: 'external',
      needsEncoding: false,
      isValid: false
    };
  }

  let type: 'youtube' | 'supabase' | 'external' = 'external';
  let format: string | undefined;
  let needsEncoding = false;

  // Check URL type
  if (/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(url)) {
    type = 'youtube';
  } else if (/^https?:\/\/.*\.supabase\.co\/storage\/v1\/object/.test(url)) {
    type = 'supabase';
    // Check if URL has characters that need encoding
    needsEncoding = /[^A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]/.test(url);
  }

  // Detect format
  const formatMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  if (formatMatch) {
    format = formatMatch[1].toLowerCase();
  }

  // Validate URL
  const isValid = validateVideoUrl(url);

  return {
    url,
    type,
    format,
    needsEncoding,
    isValid
  };
};

/**
 * Validate if URL is a supported video format
 */
export const validateVideoUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    
    // Check for supported video formats
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv'];
    const hasVideoExtension = videoExtensions.some(ext => 
      urlObj.pathname.toLowerCase().includes(ext)
    );
    
    // Check if it's a known video hosting service
    const isYouTubeUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(url);
    const isSupabaseUrl = /^https?:\/\/.*\.supabase\.co\/storage\/v1\/object/.test(url);
    
    return hasVideoExtension || isYouTubeUrl || isSupabaseUrl;
  } catch {
    return false;
  }
};

/**
 * Generate fallback URLs for better compatibility
 */
export const generateFallbackUrls = (originalUrl: string): string[] => {
  const urls: string[] = [originalUrl];
  
  // For Supabase URLs, try both encoded and non-encoded versions
  if (originalUrl.includes('supabase.co/storage/v1/object/public/')) {
    const encoded = encodeVideoUrl(originalUrl);
    if (encoded !== originalUrl) {
      urls.push(encoded);
    }
  }
  
  return urls;
};

/**
 * Check if URL is likely to have CORS issues
 */
export const hasCORSIssues = (url: string): boolean => {
  if (!url) return false;
  
  // YouTube videos don't have CORS issues as they use iframe embedding
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return false;
  }
  
  // Supabase hosted videos should work
  if (url.includes('supabase.co')) {
    return false;
  }
  
  // Check for known problematic domains
  const problematicDomains = [
    'commondatastorage.googleapis.com',
    'storage.googleapis.com',
    'drive.google.com',
    's3.amazonaws.com',
    '.s3.',
    'cloudfront.net',
    'dropbox.com',
    'onedrive.com'
  ];
  
  return problematicDomains.some(domain => url.includes(domain));
};

/**
 * Get appropriate video MIME type
 */
export const getVideoMimeType = (url: string): string => {
  const urlInfo = analyzeVideoUrl(url);
  
  switch (urlInfo.format) {
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'ogg':
      return 'video/ogg';
    case 'mov':
      return 'video/quicktime';
    case 'avi':
      return 'video/x-msvideo';
    case 'mkv':
      return 'video/x-matroska';
    case 'flv':
      return 'video/x-flv';
    default:
      return 'video/mp4'; // Default fallback
  }
};