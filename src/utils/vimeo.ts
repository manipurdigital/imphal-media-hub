/**
 * Utility functions for Vimeo video handling
 */

export const isVimeoUrl = (url: string): boolean => {
  if (!url) return false;
  
  const vimeoRegex = /^(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/(?:[\w\-]+\/)?|player\.vimeo\.com\/video\/)/;
  return vimeoRegex.test(url);
};

export const extractVimeoVideoId = (url: string): string | null => {
  if (!url) return null;
  
  // Handle different Vimeo URL formats
  const regexes = [
    /vimeo\.com\/(?:[\w\-]+\/)?(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
    /vimeo\.com\/channels\/[\w\-]+\/(\d+)/,
    /vimeo\.com\/groups\/[\w\-]+\/videos\/(\d+)/,
    /vimeo\.com\/album\/\d+\/video\/(\d+)/,
    /vimeo\.com\/(\d+)/
  ];
  
  for (const regex of regexes) {
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

export const getVimeoEmbedUrl = (videoId: string): string => {
  return `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0&controls=1`;
};

export const getVimeoThumbnailUrl = (videoId: string): string => {
  // This would typically require an API call to Vimeo's oEmbed API
  // For now, we'll use a placeholder or the default Vimeo thumbnail format
  return `https://vumbnail.com/${videoId}.jpg`;
};