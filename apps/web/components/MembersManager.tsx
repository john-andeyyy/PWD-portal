'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
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
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const createMember = async (event: FormEvent<HTMLFormElement>) => {
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
            setIsModalOpen(false);
            fetchMembers();
            return;
        }
        setStatus('Failed to create member.');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Member Management</h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Browse the current roster and add new members from the modal.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {members.length} members
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className={cn(
                            'rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition',
                            'hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40',
                            'dark:bg-sky-600 dark:hover:bg-sky-500'
                        )}
                    >
                        Add Member
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Members Table</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">All existing members are shown here.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-800/60">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    Name
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    Email
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    Phone
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    Role
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                            {members.length === 0 ? (
                                <tr>
                                    <td className="px-5 py-10 text-sm text-slate-600 dark:text-slate-400" colSpan={4}>
                                        No members yet. Use the Add Member button to create the first record.
                                    </td>
                                </tr>
                            ) : (
                                members.map((member) => (
                                    <tr key={member.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                                        <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">{member.name}</td>
                                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{member.email}</td>
                                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{member.phone || '—'}</td>
                                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{member.role || '—'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="add-member-title"
                        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-700">
                            <div>
                                <h3 id="add-member-title" className="text-xl font-semibold text-slate-900 dark:text-white">
                                    Add Member
                                </h3>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                    Fill in the member details below.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={createMember} className="space-y-5 px-6 py-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="space-y-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</span>
                                    <input
                                        value={form.name}
                                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                                        placeholder="Full name"
                                        className={cn(
                                            'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 outline-none transition',
                                            'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                                            'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400'
                                        )}
                                        required
                                    />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(event) => setForm({ ...form, email: event.target.value })}
                                        placeholder="Email address"
                                        className={cn(
                                            'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 outline-none transition',
                                            'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                                            'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400'
                                        )}
                                        required
                                    />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</span>
                                    <input
                                        value={form.phone}
                                        onChange={(event) => setForm({ ...form, phone: event.target.value })}
                                        placeholder="Phone number"
                                        className={cn(
                                            'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 outline-none transition',
                                            'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                                            'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400'
                                        )}
                                    />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</span>
                                    <input
                                        value={form.role}
                                        onChange={(event) => setForm({ ...form, role: event.target.value })}
                                        placeholder="Role or position"
                                        className={cn(
                                            'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 outline-none transition',
                                            'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                                            'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400'
                                        )}
                                    />
                                </label>
                            </div>

                            {status ? <p className="text-sm text-slate-600 dark:text-slate-400">{status}</p> : null}

                            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-sky-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500"
                                >
                                    Add Member
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
