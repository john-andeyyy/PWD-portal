'use client';

import { FormEvent, useEffect, useState } from 'react';
import { cn } from '@pwd/ui';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type Tab = 'president' | 'role';

interface Permissions {
    canCreateMembers: boolean;
    canViewMembers: boolean;
    canUpdateMembers: boolean;
    canDeleteMembers: boolean;
    canManageRoles: boolean;
}

interface MeResponse {
    userId: number;
    email: string;
    role: string;
    permissions: Permissions;
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

interface PresidentItem {
    id: number;
    name: string;
    email: string;
    isEnabled: boolean;
    role?: {
        id: number;
        name: string;
    } | null;
    createdAt: string;
}

interface Pager {
    data: any[];
    total: number;
    page: number;
    limit: number;
}

export function AccountsManager({ token }: { token: string }) {
    const [activeTab, setActiveTab] = useState<Tab>('president');
    const [isPresidentModalOpen, setIsPresidentModalOpen] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [user, setUser] = useState<MeResponse | null>(null);
    const [presidents, setPresidents] = useState<PresidentItem[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [presidentPage, setPresidentPage] = useState(1);
    const [rolePage, setRolePage] = useState(1);
    const [presidentPager, setPresidentPager] = useState<Pager>({ data: [], total: 0, page: 1, limit: 5 });
    const [rolePager, setRolePager] = useState<Pager>({ data: [], total: 0, page: 1, limit: 5 });
    const [presidentForm, setPresidentForm] = useState({ name: '', email: '', password: '', roleId: '', isEnabled: true });
    const [roleForm, setRoleForm] = useState({ name: '', canCreateMembers: false, canViewMembers: true, canUpdateMembers: false, canDeleteMembers: false, canManageRoles: false });

    const canManageRoles = user?.permissions.canManageRoles ?? false;

    const fetchMe = async () => {
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            setStatus('Unable to load account information.');
            return;
        }
        setUser(await response.json());
    };

    const fetchPresidents = async (page = 1) => {
        const response = await fetch(`${apiBaseUrl}/presidents?page=${page}&limit=5`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            setStatus('Unable to load president accounts.');
            return;
        }
        const data = await response.json();
        setPresidents(data.data || []);
        setPresidentPager(data);
    };

    const fetchRoles = async (page = 1) => {
        const response = await fetch(`${apiBaseUrl}/roles?page=${page}&limit=5`, {
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
        setRolePager(data);
    };

    useEffect(() => {
        if (!token) {
            return;
        }
        fetchMe();
        fetchPresidents(presidentPage);
        fetchRoles(rolePage);
    }, [token, presidentPage, rolePage]);

    const handleCreatePresident = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus('Creating president account...');
        const payload = {
            name: presidentForm.name,
            email: presidentForm.email,
            password: presidentForm.password,
            roleId: presidentForm.roleId ? Number(presidentForm.roleId) : undefined,
            isEnabled: presidentForm.isEnabled,
        };

        const response = await fetch(`${apiBaseUrl}/presidents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            setStatus('Failed to create president account.');
            return;
        }

        setStatus('President account created.');
        setPresidentForm({ name: '', email: '', password: '', roleId: '', isEnabled: true });
        fetchPresidents(1);
    };

    const handleCreateRole = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus('Creating role...');
        const response = await fetch(`${apiBaseUrl}/roles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(roleForm),
        });

        if (!response.ok) {
            setStatus('Failed to create role.');
            return;
        }

        setStatus('Role created successfully.');
        setRoleForm({ name: '', canCreateMembers: false, canViewMembers: true, canUpdateMembers: false, canDeleteMembers: false, canManageRoles: false });
        fetchRoles(1);
    };

    const handleTogglePresidentStatus = async (president: PresidentItem) => {
        const response = await fetch(`${apiBaseUrl}/presidents/${president.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isEnabled: !president.isEnabled }),
        });

        if (!response.ok) {
            setStatus('Could not update president status.');
            return;
        }
        fetchPresidents(presidentPage);
    };

    const handleAssignRole = async (president: PresidentItem, roleId: string) => {
        const response = await fetch(`${apiBaseUrl}/presidents/${president.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ roleId: roleId ? Number(roleId) : null }),
        });

        if (!response.ok) {
            setStatus('Could not update president role.');
            return;
        }
        fetchPresidents(presidentPage);
    };

    const handleToggleRolePermission = async (role: Role, permission: keyof Permissions) => {
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
        fetchRoles(rolePage);
    };

    const presidentCount = presidentPager.total;
    const roleCount = rolePager.total;
    const presidentPageCount = Math.ceil(presidentCount / presidentPager.limit) || 1;
    const rolePageCount = Math.ceil(roleCount / rolePager.limit) || 1;

    const tabClasses = (selected: boolean) =>
        cn(
            'rounded-full px-4 py-2 text-sm font-semibold transition',
            selected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
        );

    if (!user) {
        return (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-950">
                <p className="text-slate-600 dark:text-slate-400">Loading account permissions...</p>
            </div>
        );
    }

    if (!canManageRoles) {
        return (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-950">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Access restricted</h2>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                    Your account does not have permission to manage president accounts and role permissions.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Accounts management</p>
                    <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">President & Role Settings</h1>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => setActiveTab('president')} className={tabClasses(activeTab === 'president')}>
                        President
                    </button>
                    <button
                        type="button"
                        onClick={() => window.open('/roles', '_blank')}
                        className={tabClasses(false)}
                    >
                        Role
                    </button>
                </div>
            </div>

            {status ? <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">{status}</div> : null}

            {isPresidentModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
                    <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Create president account</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Fill in the details below to add a new president account.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPresidentModalOpen(false)}
                                className="rounded-full bg-slate-200 px-3 py-2 text-slate-700 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Close
                            </button>
                        </div>
                        <form onSubmit={handleCreatePresident} className="space-y-4 p-6">
                            <input
                                value={presidentForm.name}
                                onChange={(event) => setPresidentForm({ ...presidentForm, name: event.target.value })}
                                placeholder="Name"
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                required
                            />
                            <input
                                type="email"
                                value={presidentForm.email}
                                onChange={(event) => setPresidentForm({ ...presidentForm, email: event.target.value })}
                                placeholder="Email"
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                required
                            />
                            <input
                                type="password"
                                value={presidentForm.password}
                                onChange={(event) => setPresidentForm({ ...presidentForm, password: event.target.value })}
                                placeholder="Password"
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                required
                            />
                            <div className="grid gap-4 lg:grid-cols-2">
                                <select
                                    value={presidentForm.roleId}
                                    onChange={(event) => setPresidentForm({ ...presidentForm, roleId: event.target.value })}
                                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                >
                                    <option value="">Choose role</option>
                                    {roles.map((role) => (
                                        <option value={role.id} key={role.id}>{role.name}</option>
                                    ))}
                                </select>
                                <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={presidentForm.isEnabled}
                                        onChange={(event) => setPresidentForm({ ...presidentForm, isEnabled: event.target.checked })}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    Enabled
                                </label>
                            </div>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPresidentModalOpen(false)}
                                    className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                                >
                                    Create president account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {activeTab === 'president' ? (
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">President accounts</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Manage presidents from here. Create new accounts using the modal.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPresidentModalOpen(true)}
                            className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                        >
                            New president
                        </button>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950">
                        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Role quick notes</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">President accounts can be assigned a role that governs member permissions. Use the role selector when creating or updating president accounts.</p>
                        <div className="mt-6 space-y-3 rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Permissions supported</p>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li>• Create member records</li>
                                <li>• View member list and details</li>
                                <li>• Update member records</li>
                                <li>• Delete member records</li>
                                <li>• Grant and edit roles</li>
                            </ul>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                        <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">President accounts</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">List of president accounts with status and role assignment.</p>
                            </div>
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">{presidentCount} total</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                                <thead className="bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                    <tr>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Email</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {presidents.map((president) => (
                                        <tr key={president.id} className="border-t border-slate-200 dark:border-slate-700">
                                            <td className="px-6 py-4">{president.name}</td>
                                            <td className="px-6 py-4">{president.email}</td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={president.role?.id ?? ''}
                                                    onChange={(event) => handleAssignRole(president, event.target.value)}
                                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                >
                                                    <option value="">No role</option>
                                                    {roles.map((role) => (
                                                        <option key={role.id} value={role.id}>{role.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                                                    president.isEnabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
                                                )}>
                                                    {president.isEnabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePresidentStatus(president)}
                                                    className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                                >
                                                    {president.isEnabled ? 'Disable' : 'Enable'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-100 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                            <p>Page {presidentPage} of {presidentPageCount}</p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={presidentPage <= 1}
                                    onClick={() => setPresidentPage((page) => Math.max(1, page - 1))}
                                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    disabled={presidentPage >= presidentPageCount}
                                    onClick={() => setPresidentPage((page) => Math.min(presidentPageCount, page + 1))}
                                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
