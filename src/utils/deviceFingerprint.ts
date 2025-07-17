import { createHash } from 'crypto';

export interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: string | null;
  hardwareConcurrency: number;
  deviceMemory?: number;
  colorDepth: number;
  pixelDepth: number;
  screenOrientation?: string;
  touchSupport: boolean;
}

export interface DeviceFingerprint {
  deviceId: string;
  deviceInfo: DeviceInfo;
  timestamp: number;
}

/**
 * Generates a unique device fingerprint based on browser characteristics
 */
export const generateDeviceFingerprint = async (): Promise<DeviceFingerprint> => {
  const deviceInfo: DeviceInfo = {
    userAgent: navigator.userAgent,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    hardwareConcurrency: navigator.hardwareConcurrency || 1,
    deviceMemory: (navigator as any).deviceMemory,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    screenOrientation: screen.orientation?.type,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  };

  // Create a string from all device characteristics
  const fingerprintString = [
    deviceInfo.userAgent,
    deviceInfo.screenResolution,
    deviceInfo.timezone,
    deviceInfo.language,
    deviceInfo.platform,
    deviceInfo.cookieEnabled,
    deviceInfo.doNotTrack,
    deviceInfo.hardwareConcurrency,
    deviceInfo.deviceMemory,
    deviceInfo.colorDepth,
    deviceInfo.pixelDepth,
    deviceInfo.screenOrientation,
    deviceInfo.touchSupport,
  ].join('|');

  // Generate device ID using a simple hash (in production, use a proper hashing library)
  const deviceId = btoa(fingerprintString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);

  return {
    deviceId,
    deviceInfo,
    timestamp: Date.now(),
  };
};

/**
 * Get IP address from external service (fallback)
 */
export const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    console.warn('Failed to get IP address:', error);
    return 'unknown';
  }
};

/**
 * Generate a unique session token
 */
export const generateSessionToken = (): string => {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Check if two device fingerprints are similar (for device recognition)
 */
export const isSimilarDevice = (device1: DeviceInfo, device2: DeviceInfo): boolean => {
  // Check core characteristics that are unlikely to change
  const coreMatch = 
    device1.userAgent === device2.userAgent &&
    device1.screenResolution === device2.screenResolution &&
    device1.timezone === device2.timezone &&
    device1.platform === device2.platform &&
    device1.hardwareConcurrency === device2.hardwareConcurrency;

  return coreMatch;
};

/**
 * Validate device fingerprint integrity
 */
export const validateDeviceFingerprint = (fingerprint: DeviceFingerprint): boolean => {
  return (
    fingerprint.deviceId &&
    fingerprint.deviceInfo &&
    fingerprint.timestamp &&
    fingerprint.deviceId.length >= 16 &&
    fingerprint.timestamp > 0
  );
};