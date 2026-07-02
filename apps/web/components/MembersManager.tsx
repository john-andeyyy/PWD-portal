'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@pwd/ui';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

interface Member {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role?: string;
}

interface MembersManagerProps {
    token: string;
}

export function MembersManager({ token }: MembersManagerProps) {
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>([]);
    const [status, setStatus] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', role: '' });

    const fetchMembers = async () => {
        const response = await fetch(`${apiBaseUrl}/members`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
            setMembers(await response.json());
        }
    };

    useEffect(() => {
        if (token) {
            fetchMembers();
        }
    }, [token]);

    const createMember = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus('Creating member...');
        const response = await fetch(`${apiBaseUrl}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(form)
        });

        if (response.ok) {
            setStatus('Member created successfully.');
            setForm({ name: '', email: '', phone: '', role: '' });
            fetchMembers();
            return;
        }
        setStatus('Failed to create member.');
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        router.push('/');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Member Management</h2>
                <div className="flex items-center gap-4">
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {members.length} members
                    </span>
                    <button
                        onClick={handleLogout}
                        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Add New Member</h3>
                <form onSubmit={createMember} className="grid gap-4 lg:grid-cols-2">
                    <input
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        placeholder="Name"
                        className={cn(
                            'rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 outline-none transition',
                            'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                            'dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400'
                        )}
                        required
                    />
                    <input
                        type="email"
                        value={form.email}
                        onChange={(event) => setForm({ ...form, email: event.target.value })}
                        placeholder="Email"
                        className={cn(
                            'rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 outline-none transition',
                            'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                            'dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400'
                        )}
                        required
                    />
                    <input
                        value={form.phone}
                        onChange={(event) => setForm({ ...form, phone: event.target.value })}
                        placeholder="Phone"
                        className={cn(
                            'rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 outline-none transition',
                            'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                            'dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400'
                        )}
                    />
                    <input
                        value={form.role}
                        onChange={(event) => setForm({ ...form, role: event.target.value })}
                        placeholder="Role"
                        className={cn(
                            'rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 outline-none transition',
                            'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                            'dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400'
                        )}
                    />
                    <button
                        type="submit"
                        className="rounded-lg bg-sky-500 px-5 py-2 font-medium text-white transition hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 lg:col-span-2"
                    >
                        Add Member
                    </button>
                </form>

                {status ? (
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">{status}</p>
                ) : null}
            </div>

            <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">Members List</h3>
                {members.length === 0 ? (
                    <p className="text-slate-600 dark:text-slate-400">No members yet. Add one to get started.</p>
                ) : (
                    members.map((member) => (
                        <div
                            key={member.id}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                        >
                            <p className="font-medium text-slate-900 dark:text-white">{member.name}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{member.email}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                                {member.role || 'No role set'} • {member.phone || 'No phone'}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
