// Comprehensive input validation and sanitization

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

// Common validation patterns
const PATTERNS = {
  name: /^[a-zA-Z\u0590-\u05FF\s'-]{1,50}$/, // Hebrew letters, English letters, spaces, hyphens, apostrophes
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  passwordMinLength: 8,
  // Disallow common disposable email domains
  disposableDomains: [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
    'mailinator.com', 'throwaway.email', 'temp-mail.org'
  ]
};

// XSS prevention - sanitize HTML content
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate and sanitize names
export function validateName(input: string, fieldName: string): ValidationResult {
  if (!input || input.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const trimmed = input.trim();
  
  if (trimmed.length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters long` };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: `${fieldName} must be less than 50 characters long` };
  }

  if (!PATTERNS.name.test(trimmed)) {
    return { 
      isValid: false, 
      error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` 
    };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /script/i, /javascript:/i, /on\w+=/i, /data:/i,
    /<[^>]*>/, /javascript/i, /vbscript/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return { isValid: false, error: `Invalid characters in ${fieldName}` };
    }
  }

  return { isValid: true, sanitized: trimmed };
}

// Enhanced email validation
export function validateEmail(input: string): ValidationResult {
  if (!input || input.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmed = input.trim().toLowerCase();
  
  if (!PATTERNS.email.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Check length
  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }

  // Check for disposable email domains
  const domain = trimmed.split('@')[1];
  if (PATTERNS.disposableDomains.some(disposable => domain.includes(disposable))) {
    return { isValid: false, error: 'Disposable email addresses are not allowed' };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\+\./, // email+alias@gmail.com (allow but be careful)
    /[<>]/, // HTML tags
    /script/i, /javascript/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return { isValid: false, error: 'Invalid email format' };
    }
  }

  return { isValid: true, sanitized: trimmed };
}

// Enhanced password validation
export function validatePassword(input: string): ValidationResult {
  if (!input || input.length === 0) {
    return { isValid: false, error: 'Password is required' };
  }

  if (input.length < PATTERNS.passwordMinLength) {
    return { 
      isValid: false, 
      error: `Password must be at least ${PATTERNS.passwordMinLength} characters long` 
    };
  }

  if (input.length > 128) {
    return { isValid: false, error: 'Password is too long (max 128 characters)' };
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', '12345678', 'qwerty', 'admin', 'letmein',
    'welcome', 'monkey', 'dragon', 'master', 'sunshine'
  ];

  if (commonPasswords.includes(input.toLowerCase())) {
    return { isValid: false, error: 'Please choose a stronger password' };
  }

  // Check for sequential characters
  const hasSequentialChars = (str: string): boolean => {
    for (let i = 0; i < str.length - 2; i++) {
      const char1 = str.charCodeAt(i);
      const char2 = str.charCodeAt(i + 1);
      const char3 = str.charCodeAt(i + 2);
      
      if (char2 === char1 + 1 && char3 === char2 + 1) {
        return true;
      }
    }
    return false;
  };

  if (hasSequentialChars(input)) {
    return { isValid: false, error: 'Password cannot contain sequential characters' };
  }

  return { isValid: true };
}

// Validate verification token
export function validateToken(token: string): ValidationResult {
  if (!token || token.trim().length === 0) {
    return { isValid: false, error: 'Verification token is required' };
  }

  const trimmed = token.trim();
  
  // Check if it's a valid hex string (32 bytes = 64 hex chars)
  if (!/^[a-fA-F0-9]{64}$/.test(trimmed)) {
    return { isValid: false, error: 'Invalid verification token' };
  }

  return { isValid: true, sanitized: trimmed };
}

// Generic text validation for descriptions, etc.
export function validateText(input: string, fieldName: string, maxLength: number = 1000): ValidationResult {
  if (!input) {
    return { isValid: true, sanitized: '' }; // Optional field
  }

  const trimmed = input.trim();
  
  if (trimmed.length > maxLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must be less than ${maxLength} characters long` 
    };
  }

  // Sanitize HTML
  const sanitized = sanitizeHtml(trimmed);

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /script/i, /javascript:/i, /on\w+=/i, /data:/i,
    /<iframe/i, /<object/i, /<embed/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      return { isValid: false, error: `Invalid content in ${fieldName}` };
    }
  }

  return { isValid: true, sanitized };
}

// Validate user registration data
export function validateRegistrationData(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): { isValid: boolean; errors: string[]; sanitized?: any } {
  const errors: string[] = [];
  const sanitized: any = {};

  // Validate first name
  const firstNameResult = validateName(data.firstName, 'First name');
  if (!firstNameResult.isValid) {
    errors.push(firstNameResult.error!);
  } else {
    sanitized.firstName = firstNameResult.sanitized;
  }

  // Validate last name
  const lastNameResult = validateName(data.lastName, 'Last name');
  if (!lastNameResult.isValid) {
    errors.push(lastNameResult.error!);
  } else {
    sanitized.lastName = lastNameResult.sanitized;
  }

  // Validate email
  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid) {
    errors.push(emailResult.error!);
  } else {
    sanitized.email = emailResult.sanitized;
  }

  // Validate password
  const passwordResult = validatePassword(data.password);
  if (!passwordResult.isValid) {
    errors.push(passwordResult.error!);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined
  };
}

// Rate limiting helper for validation
export function createValidationError(message: string, statusCode: number = 400) {
  return {
    error: message,
    code: 'VALIDATION_ERROR',
    statusCode
  };
}
