'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, CheckCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function AcceptInviteForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (!token) {
            setError('Invalid or missing invitation token.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Directus endpoint for accepting invites is typically /users/invite/accept
            // We will proxy this via our own API to keep Directus URL hidden/managed or call Directus SDK directly if possible client-side (but better server-side to hide admin details if needed, though invite acceptance is public).
            // Actually, standard Directus flow allows public POST to /users/invite/accept with { token, password }.

            const res = await fetch('/api/auth/accept-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to accept invitation');
            }

            setStatus('success');
            setTimeout(() => router.push('/auth/signin'), 2000);
        } catch (err: any) {
            setError(err.message);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="pt-6 text-center text-destructive">
                    <AlertCircle className="w-10 h-10 mx-auto mb-4" />
                    <p>Invalid link. Please check your email or ask for a new invitation.</p>
                </CardContent>
            </Card>
        );
    }

    if (status === 'success') {
        return (
            <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-emerald-800 mb-2">Account Created!</h2>
                    <p className="text-emerald-600 mb-4">Your password has been set.</p>
                    <p className="text-sm text-emerald-600/80">Redirecting to login...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Welcome to the Team</CardTitle>
                <CardDescription>Set your password to activate your account.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAccept} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm">Confirm Password</Label>
                        <Input
                            id="confirm"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                    </div>

                    {error && (
                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Set Password & Login'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export default function AcceptInvitePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-2xl font-serif italic text-foreground tracking-tight">Chabad Mafteach</h1>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mt-2">Editorial Access</p>
                </div>

                <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
                    <AcceptInviteForm />
                </Suspense>
            </div>
        </div>
    );
}
