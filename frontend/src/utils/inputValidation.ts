import { sanitizeUserInput } from './sanitize';

/**
 * Validates and sanitizes email input
 * @param email - Email string to validate
 * @returns Object with isValid boolean and sanitized email
 */
export const validateEmail = (email: string): { isValid: boolean; sanitized: string } => {
  const sanitized = sanitizeUserInput(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    isValid: emailRegex.test(sanitized),
    sanitized,
  };
};

/**
 * Validates and sanitizes name input
 * @param name - Name string to validate
 * @returns Object with isValid boolean and sanitized name
 */
export const validateName = (name: string): { isValid: boolean; sanitized: string } => {
  const sanitized = sanitizeUserInput(name);
  // Allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  return {
    isValid: nameRegex.test(sanitized) && sanitized.length >= 2 && sanitized.length <= 50,
    sanitized,
  };
};

/**
 * Validates and sanitizes phone number input
 * @param phone - Phone string to validate
 * @returns Object with isValid boolean and sanitized phone
 */
export const validatePhone = (phone: string): { isValid: boolean; sanitized: string } => {
  const sanitized = sanitizeUserInput(phone);
  // Allow digits, spaces, hyphens, parentheses, and plus sign
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  return {
    isValid: phoneRegex.test(sanitized) && sanitized.length >= 10 && sanitized.length <= 20,
    sanitized,
  };
};

/**
 * Validates password strength
 * @param password - Password string to validate
 * @returns Object with isValid boolean and strength details
 */
export const validatePassword = (password: string): { 
  isValid: boolean; 
  strength: 'weak' | 'medium' | 'strong';
  issues: string[];
} => {
  const issues: string[] = [];
  
  if (password.length < 8) {
    issues.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    issues.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    issues.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    issues.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    issues.push('Password must contain at least one special character');
  }
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (issues.length === 0) {
    strength = 'strong';
  } else if (issues.length <= 2) {
    strength = 'medium';
  }
  
  return {
    isValid: issues.length === 0,
    strength,
    issues,
  };
};

/**
 * Sanitizes and validates general text input
 * @param text - Text to validate
 * @param maxLength - Maximum allowed length
 * @returns Object with isValid boolean and sanitized text
 */
export const validateText = (text: string, maxLength: number = 1000): { isValid: boolean; sanitized: string } => {
  const sanitized = sanitizeUserInput(text);
  return {
    isValid: sanitized.length <= maxLength,
    sanitized,
  };
};