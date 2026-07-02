'use client';

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

    return (
        <div className="mt-8 rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-white">Member Management</h2>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">{members.length} members</span>
            </div>

            <form onSubmit={createMember} className="grid gap-4 lg:grid-cols-2">
                <input
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Name"
                    className={cn('rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white')}
                    required
                />
                <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder="Email"
                    className={cn('rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white')}
                    required
                />
                <input
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    placeholder="Phone"
                    className={cn('rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white')}
                />
                <input
                    value={form.role}
                    onChange={(event) => setForm({ ...form, role: event.target.value })}
                    placeholder="Role"
                    className={cn('rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white')}
                />
                <button
                    type="submit"
                    className="rounded-2xl bg-sky-500 px-5 py-3 text-white transition hover:bg-sky-400 lg:col-span-2"
                >
                    Add Member
                </button>
            </form>

            {status ? <p className="mt-4 text-sm text-slate-300">{status}</p> : null}

            <div className="mt-8 space-y-4">
                {members.map((member) => (
                    <div key={member.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                        <p className="text-lg font-semibold text-white">{member.name}</p>
                        <p className="text-sm text-slate-300">{member.email}</p>
                        <p className="mt-1 text-sm text-slate-400">{member.role || 'No role set'} • {member.phone || 'No phone'}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
