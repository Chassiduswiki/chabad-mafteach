// Standardized error handling for API endpoints
import { NextRequest, NextResponse } from 'next/server';

export interface ApiError {
  error: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

// Standard error responses
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
  INVALID_TOKEN: 'INVALID_TOKEN',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS'
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION_ERROR]: 'Invalid input provided',
  [ERROR_CODES.AUTHENTICATION_ERROR]: 'Authentication required',
  [ERROR_CODES.AUTHORIZATION_ERROR]: 'Insufficient permissions',
  [ERROR_CODES.NOT_FOUND]: 'Resource not found',
  [ERROR_CODES.CONFLICT]: 'Resource already exists',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
  [ERROR_CODES.INTERNAL_ERROR]: 'An unexpected error occurred',
  [ERROR_CODES.EMAIL_SERVICE_ERROR]: 'Email service temporarily unavailable',
  [ERROR_CODES.INVALID_TOKEN]: 'Invalid or expired token',
  [ERROR_CODES.USER_NOT_FOUND]: 'User not found',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password'
} as const;

// Create standardized error response
export function createErrorResponse(
  message: string,
  code: string = ERROR_CODES.INTERNAL_ERROR,
  statusCode: number = 500,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      ...(details && { details })
    },
    { status: statusCode }
  );
}

// Create standardized success response
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message })
    },
    { status: statusCode }
  );
}

// Common error handlers
export function handleValidationError(errors: string[]): NextResponse {
  return createErrorResponse(
    errors.join('. '),
    ERROR_CODES.VALIDATION_ERROR,
    400
  );
}

export function handleAuthError(message?: string): NextResponse {
  return createErrorResponse(
    message || ERROR_MESSAGES[ERROR_CODES.AUTHENTICATION_ERROR],
    ERROR_CODES.AUTHENTICATION_ERROR,
    401
  );
}

export function handleAuthzError(message?: string): NextResponse {
  return createErrorResponse(
    message || ERROR_MESSAGES[ERROR_CODES.AUTHORIZATION_ERROR],
    ERROR_CODES.AUTHORIZATION_ERROR,
    403
  );
}

export function handleNotFoundError(resource?: string): NextResponse {
  return createErrorResponse(
    resource ? `${resource} not found` : ERROR_MESSAGES[ERROR_CODES.NOT_FOUND],
    ERROR_CODES.NOT_FOUND,
    404
  );
}

export function handleConflictError(message?: string): NextResponse {
  return createErrorResponse(
    message || ERROR_MESSAGES[ERROR_CODES.CONFLICT],
    ERROR_CODES.CONFLICT,
    409
  );
}

export function handleRateLimitError(message?: string): NextResponse {
  return createErrorResponse(
    message || ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_EXCEEDED],
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    429
  );
}

export function handleEmailServiceError(): NextResponse {
  return createErrorResponse(
    ERROR_MESSAGES[ERROR_CODES.EMAIL_SERVICE_ERROR],
    ERROR_CODES.EMAIL_SERVICE_ERROR,
    503
  );
}

export function handleInternalError(error?: any): NextResponse {
  console.error('Internal server error:', error);
  return createErrorResponse(
    ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
    ERROR_CODES.INTERNAL_ERROR,
    500
  );
}

// Async error wrapper for API routes
export function withErrorHandling<T>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error: any) {
      console.error('API Error:', error);
      
      // Handle specific error types
      if (error.name === 'ValidationError') {
        return handleValidationError(error.errors || [error.message]);
      }
      
      if (error.name === 'UnauthorizedError') {
        return handleAuthError(error.message);
      }
      
      if (error.name === 'ForbiddenError') {
        return handleAuthzError(error.message);
      }
      
      if (error.name === 'NotFoundError') {
        return handleNotFoundError(error.message);
      }
      
      if (error.name === 'ConflictError') {
        return handleConflictError(error.message);
      }
      
      // Default to internal error
      return handleInternalError(error);
    }
  };
}

// Validation error class
export class ValidationError extends Error {
  public errors: string[];
  
  constructor(errors: string[]) {
    super(errors.join('. '));
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

// Authentication error class
export class UnauthorizedError extends Error {
  constructor(message?: string) {
    super(message || 'Authentication required');
    this.name = 'UnauthorizedError';
  }
}

// Authorization error class
export class ForbiddenError extends Error {
  constructor(message?: string) {
    super(message || 'Insufficient permissions');
    this.name = 'ForbiddenError';
  }
}

// Not found error class
export class NotFoundError extends Error {
  constructor(message?: string) {
    super(message || 'Resource not found');
    this.name = 'NotFoundError';
  }
}

// Conflict error class
export class ConflictError extends Error {
  constructor(message?: string) {
    super(message || 'Resource already exists');
    this.name = 'ConflictError';
  }
}
