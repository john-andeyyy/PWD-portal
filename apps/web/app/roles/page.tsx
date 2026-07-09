'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@pwd/ui';
import { AppShell } from '@/components/AppShell';
import { Badge, Button, Card, TextInput } from '@/components/ui/primitives';
import { fetchPermissionCatalog, hasPermission, PermissionCatalogItem } from '@/lib/rbac';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

interface MeResponse {
    userId: string;
    email: string;
    roleId?: string | null;
    roleName?: string | null;
    permissions: string[];
}

interface Role {
    id: string;
    name: string;
    permissions: string[];
}

interface Pager {
    data: Role[];
    total: number;
    page: number;
    limit: number;
}

function RolesContent({ token }: { token: string }) {
    const [status, setStatus] = useState<string | null>(null);
    const [user, setUser] = useState<MeResponse | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissionCatalog, setPermissionCatalog] = useState<PermissionCatalogItem[]>([]);
    const [page, setPage] = useState(1);
    const [pager, setPager] = useState<Pager>({ data: [], total: 0, page: 1, limit: 5 });
    const [form, setForm] = useState({
        name: '',
        permissions: [] as string[],
    });

    const fetchMe = async () => {
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            setStatus('Unable to verify account permissions.');
            return;
        }

        setUser(await response.json());
    };

    const fetchRoles = async (pageNumber = 1) => {
        const response = await fetch(`${apiBaseUrl}/roles?page=${pageNumber}&limit=5`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            setStatus('Unable to load roles.');
            return;
        }

        const data = await response.json();
        setRoles(data.data || []);
        setPager(data);
    };

    const fetchPermissions = async () => {
        try {
            const catalog = await fetchPermissionCatalog(apiBaseUrl);
            setPermissionCatalog(catalog);

            setForm((current) => {
                if (current.permissions.length > 0 || catalog.length === 0) {
                    return current;
                }

                return { ...current, permissions: [catalog[0].key] };
            });
        } catch {
            setStatus('Unable to load permission catalog.');
        }
    };

    useEffect(() => {
        fetchMe();
        fetchRoles(page);
        fetchPermissions();
    }, [token, page]);

    const handleCreateRole = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
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
            permissions: permissionCatalog[0] ? [permissionCatalog[0].key] : [],
        });
        setPage(1);
        fetchRoles(1);
    };

    const handleTogglePermission = async (role: Role, permission: string) => {
        const nextPermissions = role.permissions.includes(permission)
            ? role.permissions.filter((item) => item !== permission)
            : [...role.permissions, permission];

        const response = await fetch(`${apiBaseUrl}/roles/${role.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ permissions: nextPermissions }),
        });

        if (!response.ok) {
            setStatus('Could not update role permission.');
            return;
        }

        fetchRoles(page);
    };

    const pageCount = Math.ceil(pager.total / pager.limit) || 1;

    if (!user) {
        return <Card className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading permissions...</Card>;
    }

    if (!hasPermission(user.permissions, 'accounts.manage')) {
        return (
            <Card className="p-6 text-center">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Access restricted</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">You do not have permission to manage roles.</p>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Role setup</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Create role</h2>
                </div>
                <Link
                    href="/accounts"
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                >
                    Back to accounts
                </Link>
            </div>

            {status ? <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">{status}</div> : null}

            <Card className="p-5 sm:p-6">
                <form onSubmit={handleCreateRole} className="space-y-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Role key</span>
                            <TextInput
                                value={form.name}
                                onChange={(event) => setForm({ ...form, name: event.target.value })}
                                placeholder="e.g. verifier"
                                required
                            />
                        </label>

                        <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Permissions</p>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                {permissionCatalog.map((permission) => (
                                    <label key={permission.key} className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={form.permissions.includes(permission.key)}
                                            onChange={(event) => {
                                                const nextPermissions = event.target.checked
                                                    ? [...form.permissions, permission.key]
                                                    : form.permissions.filter((item) => item !== permission.key);
                                                setForm({ ...form, permissions: Array.from(new Set(nextPermissions)) });
                                            }}
                                            className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400"
                                        />
                                        {permission.displayName}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
                        <Button type="submit">Create role</Button>
                    </div>
                </form>
            </Card>

            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Existing roles</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Toggle permissions directly from the table.</p>
                    </div>
                    <Badge>{pager.total} total</Badge>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                            <tr>
                                <th className="px-5 py-3 font-medium">Role</th>
                                {permissionCatalog.map((permission) => (
                                    <th key={permission.key} className="px-5 py-3 font-medium">{permission.displayName}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map((role) => (
                                <tr key={role.id} className="border-t border-slate-200 dark:border-slate-800">
                                    <td className="px-5 py-4 font-semibold text-slate-950 dark:text-white">{role.name}</td>
                                    {permissionCatalog.map((permission) => (
                                        <td key={permission.key} className="px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() => handleTogglePermission(role, permission.key)}
                                                className={cn(
                                                    'rounded-full px-2.5 py-1 text-xs font-semibold transition',
                                                    role.permissions.includes(permission.key)
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
                                                )}
                                            >
                                                {role.permissions.includes(permission.key) ? 'On' : 'Off'}
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <p>Page {page} of {pageCount}</p>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                            Previous
                        </Button>
                        <Button type="button" variant="secondary" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>
                            Next
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default function RolesPage() {
    return (
        <AppShell title="Roles" description="Create roles and manage permission access.">
            {(token) => <RolesContent token={token} />}
        </AppShell>
    );
}


