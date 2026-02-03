'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyEmail(token, email);
  }, [searchParams]);

  const verifyEmail = async (token: string, email: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('Your email has been verified successfully! You can now sign in.');
        
        // Redirect to signin after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin?message=Email verified successfully. Please sign in.');
        }, 3000);
      } else {
        if (data.error?.includes('expired')) {
          setStatus('expired');
          setMessage('Verification link has expired. Please request a new one.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  const handleResend = async () => {
    const email = searchParams.get('email');
    if (!email) return;

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('New verification email sent. Please check your inbox.');
      } else {
        setMessage(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Status Icon */}
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mb-4">
          {status === 'loading' && (
            <div className="h-16 w-16 bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="h-16 w-16 bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          )}
          {status === 'error' && (
            <div className="h-16 w-16 bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          )}
          {status === 'expired' && (
            <div className="h-16 w-16 bg-amber-500/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {status === 'loading' && 'Verifying Email...'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
          {status === 'expired' && 'Link Expired'}
        </h1>

        {/* Message */}
        <p className="text-muted-foreground mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="space-y-4">
          {status === 'success' && (
            <div className="animate-spin rounded-full h-6 w-6 border border-primary border-t-transparent mx-auto"></div>
          )}

          {status === 'expired' && (
            <button
              onClick={handleResend}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            >
              Resend Verification Email
            </button>
          )}

          {(status === 'error' || status === 'expired') && (
            <a
              href="/auth/signin"
              className="block text-sm text-primary hover:underline"
            >
              Back to Sign In
            </a>
          )}
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-primary hover:underline"
          >
            ← Back to Chabad Mafteach
          </a>
        </div>
      </div>
    </div>
  );
}

// Wrapper component with Suspense boundary for SSR compatibility
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
