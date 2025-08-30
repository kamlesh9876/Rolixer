import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
};

/**
 * Sanitizes text content by removing all HTML tags
 * @param dirty - The potentially unsafe string
 * @returns Plain text string with HTML tags removed
 */
export const sanitizeText = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
};

/**
 * Validates and sanitizes user input for forms
 * @param input - User input string
 * @returns Sanitized input string
 */
export const sanitizeUserInput = (input: string): string => {
  // Remove any HTML tags and keep only plain text
  return sanitizeText(input).trim();
};