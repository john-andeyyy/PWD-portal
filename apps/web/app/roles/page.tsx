'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@pwd/ui';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

interface Permissions {
    canCreateMembers: boolean;
    canViewMembers: boolean;
    canUpdateMembers: boolean;
    canDeleteMembers: boolean;
    canManageRoles: boolean;
}

interface Role {
    id: number;
    name: string;
    canCreateMembers: boolean;
    canViewMembers: boolean;
    canUpdateMembers: boolean;
    canDeleteMembers: boolean;
    canManageRoles: boolean;
}

interface Pager {
    data: Role[];
    total: number;
    page: number;
    limit: number;
}

export default function RolesPage() {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [page, setPage] = useState(1);
    const [pager, setPager] = useState<Pager>({ data: [], total: 0, page: 1, limit: 5 });
    const [form, setForm] = useState({
        name: '',
        canCreateMembers: false,
        canViewMembers: true,
        canUpdateMembers: false,
        canDeleteMembers: false,
        canManageRoles: false,
    });

    const fetchRoles = async (pageNumber = 1) => {
        if (!token) return;
        const response = await fetch(`${apiBaseUrl}/roles?page=${pageNumber}&limit=5`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            setStatus('Unable to load roles.');
            return;
        }

        const data = await response.json();
        setRoles(data.data || []);
        setPager(data);
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        if (!storedToken) {
            router.push('/');
            return;
        }
        setToken(storedToken);
    }, [router]);

    useEffect(() => {
        if (token) {
            fetchRoles(page);
        }
    }, [token, page]);

    const handleCreateRole = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!token) return;

        setStatus('Creating role...');
        const response = await fetch(`${apiBaseUrl}/roles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(form),
        });

        if (!response.ok) {
            setStatus('Failed to create role.');
            return;
        }

        setStatus('Role created successfully.');
        setForm({
            name: '',
            canCreateMembers: false,
            canViewMembers: true,
            canUpdateMembers: false,
            canDeleteMembers: false,
            canManageRoles: false,
        });
        fetchRoles(1);
        setPage(1);
    };

    const handleTogglePermission = async (role: Role, permission: keyof Permissions) => {
        if (!token) return;

        const response = await fetch(`${apiBaseUrl}/roles/${role.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ [permission]: !role[permission] }),
        });

        if (!response.ok) {
            setStatus('Could not update role permission.');
            return;
        }

        fetchRoles(page);
    };

    const pageCount = Math.ceil(pager.total / pager.limit) || 1;

    if (!token) {
        return null;
    }

    return (
        <main className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-white">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/20 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/20">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Role management</p>
                            <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Roles</h1>
                        </div>
                        <p className="max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                            Create, review, and manage role permissions from this page.
                        </p>
                    </div>
                </div>

                {status ? (
                    <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {status}
                    </div>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Create a new role</h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Add a role and choose the permissions it should grant.</p>
                        <form onSubmit={handleCreateRole} className="mt-6 space-y-4">
                            <input
                                value={form.name}
                                onChange={(event) => setForm({ ...form, name: event.target.value })}
                                placeholder="Role name"
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                required
                            />
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={form.canCreateMembers}
                                        onChange={(event) => setForm({ ...form, canCreateMembers: event.target.checked })}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    Create members
                                </label>
                                <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={form.canViewMembers}
                                        onChange={(event) => setForm({ ...form, canViewMembers: event.target.checked })}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    View members
                                </label>
                                <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={form.canUpdateMembers}
                                        onChange={(event) => setForm({ ...form, canUpdateMembers: event.target.checked })}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    Update members
                                </label>
                                <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={form.canDeleteMembers}
                                        onChange={(event) => setForm({ ...form, canDeleteMembers: event.target.checked })}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    Delete members
                                </label>
                                <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={form.canManageRoles}
                                        onChange={(event) => setForm({ ...form, canManageRoles: event.target.checked })}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    Manage roles
                                </label>
                            </div>
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                            >
                                Create role
                            </button>
                        </form>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Roles</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Toggle permissions directly in the table.</p>
                            </div>
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">{pager.total} total</span>
                        </div>
                        <div className="mt-6 overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                                <thead className="bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                    <tr>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Create</th>
                                        <th className="px-6 py-3">View</th>
                                        <th className="px-6 py-3">Update</th>
                                        <th className="px-6 py-3">Delete</th>
                                        <th className="px-6 py-3">Manage roles</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roles.map((role) => (
                                        <tr key={role.id} className="border-t border-slate-200 dark:border-slate-700">
                                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{role.name}</td>
                                            {(['canCreateMembers', 'canViewMembers', 'canUpdateMembers', 'canDeleteMembers', 'canManageRoles'] as Array<keyof Permissions>).map((permission) => (
                                                <td key={permission} className="px-6 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTogglePermission(role, permission)}
                                                        className={cn(
                                                            'rounded-full px-3 py-1 text-xs font-semibold transition',
                                                            role[permission]
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                                                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
                                                        )}
                                                    >
                                                        {role[permission] ? 'On' : 'Off'}
                                                    </button>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
                            <p>Page {page} of {pageCount}</p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    disabled={page >= pageCount}
                                    onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
