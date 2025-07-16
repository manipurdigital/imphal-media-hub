import { supabase } from '@/integrations/supabase/client';

export interface VideoValidationResult {
  videoId: string;
  title: string;
  status: 'accessible' | 'not_found' | 'cors_blocked' | 'unknown';
  error?: string;
  message: string;
  needsAttention: boolean;
}

export interface VideoHealthCheck {
  totalVideos: number;
  accessibleVideos: number;
  blockedVideos: number;
  unknownVideos: number;
  results: VideoValidationResult[];
}

/**
 * Test if a video URL is accessible
 */
export async function testVideoAccessibility(url: string): Promise<{
  accessible: boolean;
  error?: string;
  corsIssue?: boolean;
}> {
  try {
    // Skip testing for YouTube videos - they work via iframe
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return { accessible: true };
    }

    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
      cache: 'no-cache',
    });

    return { accessible: response.ok };
  } catch (error: any) {
    console.warn('Video accessibility test failed:', error);
    
    // Check for CORS-related errors
    if (error.name === 'TypeError' && error.message.includes('CORS')) {
      return { accessible: false, error: 'CORS_ERROR', corsIssue: true };
    }

    return { accessible: false, error: 'NETWORK_ERROR' };
  }
}

/**
 * Check if a URL is likely to have CORS issues
 */
export function hasLikelyCORSIssues(url: string): boolean {
  if (!url) return false;
  
  // YouTube videos don't have CORS issues
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return false;
  }
  
  // Supabase hosted videos should work
  if (url.includes('zzulxowwlqndtrlmfnij.supabase.co')) {
    return false;
  }
  
  // Known problematic domains
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
}

/**
 * Validate a single video
 */
export async function validateVideo(videoId: string, title: string, videoUrl: string): Promise<VideoValidationResult> {
  try {
    // Check if URL is likely to have CORS issues first
    if (hasLikelyCORSIssues(videoUrl)) {
      return {
        videoId,
        title,
        status: 'cors_blocked',
        message: 'Video is hosted on a domain with known CORS restrictions',
        needsAttention: true
      };
    }

    // Test accessibility
    const { accessible, error, corsIssue } = await testVideoAccessibility(videoUrl);
    
    if (accessible) {
      return {
        videoId,
        title,
        status: 'accessible',
        message: 'Video is accessible and should play correctly',
        needsAttention: false
      };
    }

    // Handle different error types
    if (corsIssue) {
      return {
        videoId,
        title,
        status: 'cors_blocked',
        error,
        message: 'Video cannot be played due to CORS restrictions',
        needsAttention: true
      };
    }

    return {
      videoId,
      title,
      status: 'not_found',
      error,
      message: 'Video source is not accessible or not found',
      needsAttention: true
    };
  } catch (error) {
    return {
      videoId,
      title,
      status: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to validate video accessibility',
      needsAttention: true
    };
  }
}

/**
 * Run health check on all videos
 */
export async function runVideoHealthCheck(): Promise<VideoHealthCheck> {
  try {
    const { data: videos, error } = await supabase
      .from('videos')
      .select('id, title, video_url, accessibility_status')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const results: VideoValidationResult[] = [];
    let accessibleCount = 0;
    let blockedCount = 0;
    let unknownCount = 0;

    for (const video of videos || []) {
      const result = await validateVideo(video.id, video.title, video.video_url);
      results.push(result);

      switch (result.status) {
        case 'accessible':
          accessibleCount++;
          break;
        case 'cors_blocked':
        case 'not_found':
          blockedCount++;
          break;
        default:
          unknownCount++;
      }
    }

    return {
      totalVideos: videos?.length || 0,
      accessibleVideos: accessibleCount,
      blockedVideos: blockedCount,
      unknownVideos: unknownCount,
      results
    };
  } catch (error) {
    console.error('Video health check failed:', error);
    throw error;
  }
}

/**
 * Update video accessibility status in database
 */
export async function updateVideoAccessibilityStatus(
  videoId: string,
  status: 'accessible' | 'not_found' | 'cors_blocked' | 'unknown'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('videos')
      .update({
        accessibility_status: status,
        accessibility_checked_at: new Date().toISOString()
      })
      .eq('id', videoId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Failed to update video accessibility status:', error);
    throw error;
  }
}

/**
 * Fix missing video_sources entries
 */
export async function fixMissingVideoSources(): Promise<{
  success: boolean;
  message: string;
  fixed: number;
}> {
  try {
    const { data, error } = await supabase.rpc('fix_video_sources_consistency');
    
    if (error) {
      throw error;
    }

    const fixedCount = data?.filter((item: any) => item.action === 'CREATED').length || 0;
    
    return {
      success: true,
      message: `Fixed ${fixedCount} videos with missing video_sources entries`,
      fixed: fixedCount
    };
  } catch (error) {
    console.error('Failed to fix missing video sources:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      fixed: 0
    };
  }
}

/**
 * Get videos that need attention
 */
export async function getVideosNeedingAttention(): Promise<VideoValidationResult[]> {
  try {
    const { data: videos, error } = await supabase
      .from('videos')
      .select('id, title, video_url, accessibility_status')
      .in('accessibility_status', ['unknown', 'cors_blocked', 'not_found'])
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (videos || []).map(video => ({
      videoId: video.id,
      title: video.title,
      status: video.accessibility_status as any,
      message: getStatusMessage(video.accessibility_status),
      needsAttention: true
    }));
  } catch (error) {
    console.error('Failed to get videos needing attention:', error);
    return [];
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'accessible':
      return 'Video is accessible and should play correctly';
    case 'cors_blocked':
      return 'Video cannot be played due to CORS restrictions';
    case 'not_found':
      return 'Video source is not accessible or not found';
    default:
      return 'Video accessibility status is unknown';
  }
}