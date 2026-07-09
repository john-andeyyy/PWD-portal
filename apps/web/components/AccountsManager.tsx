'use client';

import { FormEvent, useEffect, useState } from 'react';
import { cn } from '@pwd/ui';
import { APP_PERMISSIONS, AppPermission, hasPermission } from '@/lib/rbac';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type Tab = 'president' | 'role';

interface MeResponse {
    userId: number;
    email: string;
    role: string;
    permissions: string[];
}

interface Role {
    id: number;
    name: string;
    permissions: string[];
}

interface PresidentItem {
    id: number;
    name: string;
    email: string;
    isEnabled: boolean;
    memberId?: number | null;
    member?: {
        id: number;
        fname: string;
        lname: string;
        pwdId: string;
    } | null;
    role?: {
        id: number;
        name: string;
    } | null;
    createdAt: string;
}

interface MemberOption {
    id: number;
    fname: string;
    lname: string;
    pwdId: string;
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
    const [members, setMembers] = useState<MemberOption[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [presidentPage, setPresidentPage] = useState(1);
    const [rolePage, setRolePage] = useState(1);
    const [presidentPager, setPresidentPager] = useState<Pager>({ data: [], total: 0, page: 1, limit: 5 });
    const [rolePager, setRolePager] = useState<Pager>({ data: [], total: 0, page: 1, limit: 5 });
    const [presidentForm, setPresidentForm] = useState({ name: '', email: '', password: '', roleId: '', memberId: '', isEnabled: true });
    const [roleForm, setRoleForm] = useState<{ name: string; permissions: AppPermission[] }>({
        name: '',
        permissions: ['members.view'],
    });

    const canManageRoles = hasPermission(user?.permissions, 'accounts.manage');

    const permissionLabels: Record<AppPermission, string> = {
        'members.create': 'Create members',
        'members.view': 'View members',
        'members.update': 'Update members',
        'members.delete': 'Delete members',
        'accounts.manage': 'Manage accounts and roles',
    };

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

    const fetchMembers = async () => {
        const response = await fetch(`${apiBaseUrl}/members`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            setStatus('Unable to load members.');
            return;
        }

        const data = await response.json();
        setMembers(data || []);
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
        fetchMembers();
    }, [token, presidentPage, rolePage]);

    const handleCreatePresident = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus('Creating president account...');
        const payload = {
            name: presidentForm.name,
            email: presidentForm.email,
            password: presidentForm.password,
            roleId: presidentForm.roleId ? Number(presidentForm.roleId) : undefined,
            memberId: presidentForm.memberId ? Number(presidentForm.memberId) : undefined,
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
        setPresidentForm({ name: '', email: '', password: '', roleId: '', memberId: '', isEnabled: true });
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
        setRoleForm({ name: '', permissions: ['members.view'] });
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

    const handleToggleRolePermission = async (role: Role, permission: AppPermission) => {
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
                        onClick={() => setActiveTab('role')}
                        className={tabClasses(activeTab === 'role')}
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
                                <p className="text-sm text-slate-600 dark:text-slate-400">Pick an existing member profile, then add the president account for the same person.</p>
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
                                    value={presidentForm.memberId}
                                    onChange={(event) => setPresidentForm({ ...presidentForm, memberId: event.target.value })}
                                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    required
                                >
                                    <option value="">Choose member profile</option>
                                    {members.map((member) => {
                                        const linked = presidents.some((president) => president.memberId === member.id);

                                        return (
                                            <option key={member.id} value={member.id} disabled={linked}>
                                                {[member.fname, member.lname].filter(Boolean).join(' ')} {linked ? '(linked)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
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
                                        <th className="px-6 py-3">Member</th>
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
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                {president.member ? [president.member.fname, president.member.lname].filter(Boolean).join(' ') : 'Not linked'}
                                            </td>
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
            ) : (
                <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Create a new role</h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Add a role and choose the permissions it should grant.</p>
                        <form onSubmit={handleCreateRole} className="mt-6 space-y-4">
                            <input
                                value={roleForm.name}
                                onChange={(event) => setRoleForm({ ...roleForm, name: event.target.value })}
                                placeholder="Role name"
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                required
                            />
                            <div className="grid gap-3 sm:grid-cols-2">
                                {APP_PERMISSIONS.map((permission) => (
                                    <label key={permission} className="inline-flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={roleForm.permissions.includes(permission)}
                                            onChange={(event) => {
                                                const nextPermissions = event.target.checked
                                                    ? [...roleForm.permissions, permission]
                                                    : roleForm.permissions.filter((item) => item !== permission);
                                                setRoleForm({ ...roleForm, permissions: Array.from(new Set(nextPermissions)) as AppPermission[] });
                                            }}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        {permissionLabels[permission]}
                                    </label>
                                ))}
                            </div>
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                            >
                                Create role
                            </button>
                        </form>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                        <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Roles</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Toggle permissions directly in the table.</p>
                            </div>
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">{roleCount} total</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                                <thead className="bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                    <tr>
                                        <th className="px-6 py-3">Role</th>
                                        {APP_PERMISSIONS.map((permission) => (
                                            <th key={permission} className="px-6 py-3">{permission}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {roles.map((role) => (
                                        <tr key={role.id} className="border-t border-slate-200 dark:border-slate-700">
                                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{role.name}</td>
                                            {APP_PERMISSIONS.map((permission) => (
                                                <td key={permission} className="px-6 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleRolePermission(role, permission)}
                                                        className={cn(
                                                            'rounded-full px-3 py-1 text-xs font-semibold transition',
                                                            role.permissions.includes(permission)
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                                                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
                                                        )}
                                                    >
                                                        {role.permissions.includes(permission) ? 'On' : 'Off'}
                                                    </button>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-100 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                            <p>Page {rolePage} of {rolePageCount}</p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={rolePage <= 1}
                                    onClick={() => setRolePage((page) => Math.max(1, page - 1))}
                                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    disabled={rolePage >= rolePageCount}
                                    onClick={() => setRolePage((page) => Math.min(rolePageCount, page + 1))}
                                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
