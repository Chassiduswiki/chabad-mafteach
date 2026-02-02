'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

function SignInContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setInfoMessage(message);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setError('');
        setIsLocked(false);
        setUserRole(data.user?.role || 'editor');

        // Redirect based on role after a short delay
        setTimeout(() => {
          const redirectPath = data.user?.role === 'admin' ? '/admin' : '/editor';
          router.push(redirectPath);
        }, 1500);
      } else {
        // Handle different error types
        if (data.isLocked) {
          setIsLocked(true);
          setLockoutTime(data.lockoutRemaining || 0);
        }
        setError(data.error || 'Login failed');
        setSuccess(false);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    const destination = userRole === 'admin' ? 'admin dashboard' : 'editor';
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-500 mb-4">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back!</h1>
          <p className="text-muted-foreground mb-6">
            Authentication successful. Redirecting to {destination}...
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border border-primary border-t-transparent mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Sign In</h1>
          <p className="text-muted-foreground">
            Access your Chabad Mafteach account
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-card border border-border rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                placeholder="editor@chabad.org"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-3 py-2 pr-10 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Info Message */}
        {infoMessage && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-green-700 text-sm">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            {infoMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`flex items-start gap-2 p-3 rounded-md text-sm ${
            isLocked 
              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-700' 
              : 'bg-destructive/10 border border-destructive/20 text-destructive'
          }`}>
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <p>{error}</p>
              {isLocked && lockoutTime && (
                <p className="text-xs mt-1 opacity-80">
                  Try again in {Math.ceil(lockoutTime / 60)} minute{Math.ceil(lockoutTime / 60) !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border border-primary-foreground border-t-transparent"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Account Access</h3>
          <p className="text-xs text-muted-foreground">
            Use your registered email and password to access your account. 
            This session is valid for 24 hours.
          </p>
        </div>

        {/* Forgot Password Link */}
        <div className="mt-4 text-center">
          <a
            href="/auth/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot your password?
          </a>
        </div>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <span className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <a
              href="/auth/signup"
              className="text-sm text-primary hover:underline"
            >
              Sign Up
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

// Wrapper component with Suspense boundary for SSR compatibility
export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-8 w-8 border border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
