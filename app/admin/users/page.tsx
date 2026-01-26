'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

async function fetchUsers() {
    const res = await fetch('/api/admin/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
}

export default function UsersPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-users'],
        queryFn: fetchUsers,
    });

    return (
        <div className="container max-w-6xl py-10 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Manage editors, administrators, and reviewers.</p>
                </div>
                <Link href="/admin/users/invite">
                    <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite User
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Active Users
                    </CardTitle>
                    <CardDescription>
                        List of all registered users with access to the platform.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="p-4 text-red-500 bg-red-50 rounded-lg">
                            Failed to load users. Please try again.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Access</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.users?.map((user: any) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {user.first_name} {user.last_name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="capitalize px-2 py-1 bg-muted rounded-full text-xs font-medium">
                                                {user.role?.name || 'User'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                    user.status === 'invited' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {user.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {user.last_access ? formatDistanceToNow(new Date(user.last_access), { addSuffix: true }) : 'Never'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
