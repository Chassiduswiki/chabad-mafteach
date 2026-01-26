'use client';

import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function InviteUserPage() {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('editor');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const res = await fetch('/api/admin/users/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send invitation');
            }

            setStatus('success');
            setMessage(`Invitation sent to ${email}`);
            setEmail('');
        } catch (error: any) {
            console.error('Invite error:', error);
            setStatus('error');
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl py-10">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-primary" />
                        Invite New User
                    </CardTitle>
                    <CardDescription>
                        Send an email invitation to join the editorial team.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleInvite} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="colleague@chabad.org"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="editor">Editor (Can create & edit topics)</SelectItem>
                                    <SelectItem value="admin">Admin (Full system access)</SelectItem>
                                    <SelectItem value="reviewer">Reviewer (Read-only + comments)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {status === 'error' && (
                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {message}
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="bg-emerald-50 text-emerald-600 text-sm p-3 rounded-md flex items-center gap-2 border border-emerald-200">
                                <CheckCircle className="w-4 h-4" />
                                {message}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending Invitation...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Invitation
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
