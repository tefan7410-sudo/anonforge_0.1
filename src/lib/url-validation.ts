// URL validation utilities for social links

const TWITTER_PATTERNS = [
  /^https?:\/\/(www\.)?(twitter\.com|x\.com|mobile\.twitter\.com)\/.+/i,
];

const DISCORD_PATTERNS = [
  /^https?:\/\/(www\.)?(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/.+/i,
];

const SECONDARY_MARKET_PATTERNS = [
  /^https?:\/\/(www\.)?jpg\.store\/.+/i,
  /^https?:\/\/(www\.)?wayup\.io\/.+/i,
];

const URL_PATTERN = /^https?:\/\/.+/i;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function isValidTwitterUrl(url: string): ValidationResult {
  if (!url || url.trim() === '') {
    return { isValid: true }; // Empty is valid (optional field)
  }
  
  const trimmedUrl = url.trim();
  
  if (!URL_PATTERN.test(trimmedUrl)) {
    return { isValid: false, error: 'Please enter a valid URL starting with https://' };
  }
  
  const isValid = TWITTER_PATTERNS.some(pattern => pattern.test(trimmedUrl));
  
  if (!isValid) {
    return { 
      isValid: false, 
      error: 'Please enter a valid Twitter/X URL (e.g., https://twitter.com/username or https://x.com/username)' 
    };
  }
  
  return { isValid: true };
}

export function isValidDiscordUrl(url: string): ValidationResult {
  if (!url || url.trim() === '') {
    return { isValid: true }; // Empty is valid (optional field)
  }
  
  const trimmedUrl = url.trim();
  
  if (!URL_PATTERN.test(trimmedUrl)) {
    return { isValid: false, error: 'Please enter a valid URL starting with https://' };
  }
  
  const isValid = DISCORD_PATTERNS.some(pattern => pattern.test(trimmedUrl));
  
  if (!isValid) {
    return { 
      isValid: false, 
      error: 'Please enter a valid Discord invite URL (e.g., https://discord.gg/invite-code)' 
    };
  }
  
  return { isValid: true };
}

export function isValidWebsiteUrl(url: string): ValidationResult {
  if (!url || url.trim() === '') {
    return { isValid: true }; // Empty is valid (optional field)
  }
  
  const trimmedUrl = url.trim();
  
  if (!URL_PATTERN.test(trimmedUrl)) {
    return { 
      isValid: false, 
      error: 'Please enter a valid URL starting with http:// or https://' 
    };
  }
  
  try {
    new URL(trimmedUrl);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Please enter a valid URL' };
  }
}

export function isValidSecondaryMarketUrl(url: string): ValidationResult {
  if (!url || url.trim() === '') {
    return { isValid: true }; // Empty is valid (optional field)
  }
  
  const trimmedUrl = url.trim();
  
  if (!URL_PATTERN.test(trimmedUrl)) {
    return { isValid: false, error: 'Please enter a valid URL starting with https://' };
  }
  
  const isValid = SECONDARY_MARKET_PATTERNS.some(pattern => pattern.test(trimmedUrl));
  
  if (!isValid) {
    return { 
      isValid: false, 
      error: 'Please enter a valid jpg.store or wayup.io URL' 
    };
  }
  
  return { isValid: true };
}
