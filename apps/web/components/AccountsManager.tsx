'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Card, EmptyState, FieldError, LoadingButton, Modal, SelectInput, StatusMessage, TextInput } from '@/components/ui/primitives';
import { fetchPermissionCatalog, hasPermission, PermissionCatalogItem } from '@/lib/rbac';
import { apiBaseUrl, parseApiError } from '@/lib/api';
import { focusFirstInvalidField, friendlyError, isValidEmail, isValidPassword, PASSWORD_HELP } from '@/lib/validation';

type Tab = 'president' | 'role';
type MeResponse = { userId: string; email: string; roleId?: string | null; roleName?: string | null; permissions: string[] };
type Role = { id: string; name: string; permissions: string[] };
type PresidentItem = { id: string; name: string; email: string; isEnabled: boolean; memberId?: string | null; member?: { id: string; fname: string; lname: string; pwdId: string } | null; role?: { id: string; name: string } | null; createdAt: string };
type MemberOption = { id: string; fname: string; lname: string; pwdId: string };
type Pager<T> = { data: T[]; total: number; page: number; limit: number };

type PresidentFormErrors = Partial<Record<'name' | 'email' | 'password' | 'memberId' | 'roleId' | 'form', string>>;

type EditRoleState = { role: Role; name: string; permissions: string[] } | null;

const includesSensitivePermission = (permissions: string[]) => permissions.includes('members.delete') || permissions.includes('accounts.manage');

export function AccountsManager({ token }: { token: string }) {
    const [activeTab, setActiveTab] = useState<Tab>('president');
    const [isPresidentModalOpen, setIsPresidentModalOpen] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<MeResponse | null>(null);
    const [presidents, setPresidents] = useState<PresidentItem[]>([]);
    const [members, setMembers] = useState<MemberOption[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissionCatalog, setPermissionCatalog] = useState<PermissionCatalogItem[]>([]);
    const [presidentPage, setPresidentPage] = useState(1);
    const [rolePage, setRolePage] = useState(1);
    const [presidentPager, setPresidentPager] = useState<Pager<PresidentItem>>({ data: [], total: 0, page: 1, limit: 5 });
    const [rolePager, setRolePager] = useState<Pager<Role>>({ data: [], total: 0, page: 1, limit: 5 });
    const [presidentForm, setPresidentForm] = useState({ name: '', email: '', password: '', roleId: '', memberId: '', isEnabled: true });
    const [presidentErrors, setPresidentErrors] = useState<PresidentFormErrors>({});
    const [isCreatingPresident, setIsCreatingPresident] = useState(false);
    const [savingPresidentId, setSavingPresidentId] = useState<string | null>(null);
    const [changeRoleTarget, setChangeRoleTarget] = useState<PresidentItem | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [isChangingRole, setIsChangingRole] = useState(false);
    const [editRole, setEditRole] = useState<EditRoleState>(null);
    const [isConfirmingRoleSave, setIsConfirmingRoleSave] = useState(false);
    const [isSavingRole, setIsSavingRole] = useState(false);

    const canManageRoles = hasPermission(user?.permissions, 'accounts.manage');

    const fetchMe = async () => {
        const response = await fetch(`${apiBaseUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) { setError('Unable to load account information.'); return; }
        setUser(await response.json());
    };
    const fetchPresidents = async (page = 1) => {
        const response = await fetch(`${apiBaseUrl}/presidents?page=${page}&limit=5`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) { setError('Unable to load president accounts.'); return; }
        const data = await response.json();
        setPresidents(data.data || []); setPresidentPager(data);
    };
    const fetchMembers = async () => {
        const response = await fetch(`${apiBaseUrl}/members?page=1&limit=5000&sortBy=lname&sortOrder=asc`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) { setError('Unable to load members.'); return; }
        const data = await response.json(); setMembers(Array.isArray(data) ? data : data.data || []);
    };
    const fetchRoles = async (page = 1) => {
        const response = await fetch(`${apiBaseUrl}/roles?page=${page}&limit=5`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) { setError('Unable to load roles.'); return; }
        const data = await response.json(); setRoles(data.data || []); setRolePager(data);
    };
    const fetchPermissions = async () => {
        try { setPermissionCatalog(await fetchPermissionCatalog(apiBaseUrl)); }
        catch { setError('Unable to load permission catalog.'); }
    };

    useEffect(() => { if (token) { fetchMe(); fetchPresidents(presidentPage); fetchRoles(rolePage); fetchMembers(); fetchPermissions(); } }, [token, presidentPage, rolePage]);

    const updatePresidentForm = (key: keyof typeof presidentForm, value: string | boolean) => {
        setPresidentForm((current) => ({ ...current, [key]: value }));
        setPresidentErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
    };

    const validatePresidentForm = () => {
        const next: PresidentFormErrors = {};
        if (!presidentForm.name.trim()) next.name = 'Name is required.';
        if (!presidentForm.email.trim()) next.email = 'Email is required.';
        else if (!isValidEmail(presidentForm.email)) next.email = 'Enter a valid email address.';
        if (!presidentForm.password) next.password = 'Password is required.';
        else if (!isValidPassword(presidentForm.password)) next.password = PASSWORD_HELP;
        if (!presidentForm.memberId) next.memberId = 'Select a member profile.';
        return next;
    };

    const handleCreatePresident = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextErrors = validatePresidentForm();
        setPresidentErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) { focusFirstInvalidField(nextErrors); return; }
        setIsCreatingPresident(true); setError(null); setStatus(null);
        const payload = { name: presidentForm.name.trim(), email: presidentForm.email.trim(), password: presidentForm.password, roleId: presidentForm.roleId || undefined, memberId: presidentForm.memberId || undefined, isEnabled: presidentForm.isEnabled };
        try {
            const response = await fetch(`${apiBaseUrl}/presidents`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
            if (!response.ok) { setPresidentErrors({ form: friendlyError(await parseApiError(response)) }); return; }
            setStatus('President account created.');
            setPresidentForm({ name: '', email: '', password: '', roleId: '', memberId: '', isEnabled: true });
            setIsPresidentModalOpen(false);
            setPresidentPage(1); await fetchPresidents(1);
        } catch { setPresidentErrors({ form: 'Unable to create president account. Check your connection and try again.' }); }
        finally { setIsCreatingPresident(false); }
    };

    const handleTogglePresidentStatus = async (president: PresidentItem) => {
        setSavingPresidentId(president.id); setError(null); setStatus(null);
        try {
            const response = await fetch(`${apiBaseUrl}/presidents/${president.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ isEnabled: !president.isEnabled }) });
            if (!response.ok) { setError(friendlyError(await parseApiError(response))); return; }
            setStatus(`President account ${president.isEnabled ? 'disabled' : 'enabled'}.`); await fetchPresidents(presidentPage);
        } catch { setError('Unable to update president status. Check your connection and try again.'); }
        finally { setSavingPresidentId(null); }
    };

    const openChangeRole = (president: PresidentItem) => { setChangeRoleTarget(president); setSelectedRoleId(president.role?.id ?? ''); setError(null); };
    const saveRoleChange = async () => {
        if (!changeRoleTarget) return;
        setIsChangingRole(true); setError(null); setStatus(null);
        try {
            const response = await fetch(`${apiBaseUrl}/presidents/${changeRoleTarget.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ roleId: selectedRoleId || null }) });
            if (!response.ok) { setError(friendlyError(await parseApiError(response))); return; }
            setStatus('Role updated successfully.'); setChangeRoleTarget(null); await fetchPresidents(presidentPage);
        } catch { setError('Unable to update role. Check your connection and try again.'); }
        finally { setIsChangingRole(false); }
    };

    const openEditRole = (role: Role) => setEditRole({ role, name: role.name, permissions: [...role.permissions] });
    const roleChanged = editRole ? editRole.name.trim() !== editRole.role.name || [...editRole.permissions].sort().join('|') !== [...editRole.role.permissions].sort().join('|') : false;
    const saveEditedRole = async () => {
        if (!editRole) return;
        setIsSavingRole(true); setError(null); setStatus(null);
        try {
            const response = await fetch(`${apiBaseUrl}/roles/${editRole.role.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: editRole.name.trim(), permissions: editRole.permissions }) });
            if (!response.ok) { setError(friendlyError(await parseApiError(response))); return; }
            setStatus('Role permissions updated successfully.'); setEditRole(null); setIsConfirmingRoleSave(false); await fetchRoles(rolePage);
        } catch { setError('Unable to update role permissions. Check your connection and try again.'); }
        finally { setIsSavingRole(false); }
    };

    const presidentPageCount = Math.ceil(presidentPager.total / presidentPager.limit) || 1;
    const rolePageCount = Math.ceil(rolePager.total / rolePager.limit) || 1;
    const tabClasses = (selected: boolean) => `rounded-lg px-4 py-2 text-sm font-semibold transition ${selected ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`;

    if (!user) return <Card className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading account permissions...</Card>;
    if (!canManageRoles) return <EmptyState title="Access restricted" description="Your account does not have permission to manage president accounts and role permissions." />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Accounts management</p><h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">President & Role Settings</h1></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setActiveTab('president')} className={tabClasses(activeTab === 'president')}>President</button><button type="button" onClick={() => setActiveTab('role')} className={tabClasses(activeTab === 'role')}>Role</button></div></div>
            <StatusMessage tone="success">{status}</StatusMessage><StatusMessage tone="danger">{error}</StatusMessage>

            {activeTab === 'president' ? <div className="space-y-6"><Card className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold text-slate-950 dark:text-white">President accounts</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create accounts and change roles through explicit save actions.</p></div><Button type="button" onClick={() => setIsPresidentModalOpen(true)}>New president</Button></div></Card><Card className="overflow-hidden"><div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-lg font-semibold text-slate-950 dark:text-white">President accounts</h2><Badge>{presidentPager.total} total</Badge></div><div className="overflow-x-auto"><table className="min-w-full border-separate border-spacing-0 text-left text-sm"><thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Member</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead><tbody>{presidents.map((president) => <tr key={president.id} className="border-t border-slate-200 dark:border-slate-800"><td className="px-5 py-4 font-medium text-slate-950 dark:text-white">{president.name}</td><td className="px-5 py-4 text-slate-600 dark:text-slate-300">{president.member ? [president.member.fname, president.member.lname].filter(Boolean).join(' ') : 'Not linked'}</td><td className="px-5 py-4 break-all">{president.email}</td><td className="px-5 py-4"><Badge tone={president.role ? 'info' : 'neutral'}>{president.role?.name ?? 'No role'}</Badge></td><td className="px-5 py-4"><Badge tone={president.isEnabled ? 'success' : 'danger'}>{president.isEnabled ? 'Enabled' : 'Disabled'}</Badge></td><td className="px-5 py-4"><div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={() => openChangeRole(president)}>Change Role</Button><LoadingButton type="button" variant="secondary" isLoading={savingPresidentId === president.id} loadingText="Saving..." onClick={() => handleTogglePresidentStatus(president)}>{president.isEnabled ? 'Disable' : 'Enable'}</LoadingButton></div></td></tr>)}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 dark:border-slate-800"><p>Page {presidentPage} of {presidentPageCount}</p><div className="flex gap-2"><Button type="button" variant="secondary" disabled={presidentPage <= 1} onClick={() => setPresidentPage((p) => Math.max(1, p - 1))}>Previous</Button><Button type="button" variant="secondary" disabled={presidentPage >= presidentPageCount} onClick={() => setPresidentPage((p) => Math.min(presidentPageCount, p + 1))}>Next</Button></div></div></Card></div> : <div className="space-y-6"><Card className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold text-slate-950 dark:text-white">Roles</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Permissions are read-only here until you choose Edit.</p></div><Link href="/roles" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">Create role</Link></div></Card><Card className="overflow-hidden"><div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-lg font-semibold text-slate-950 dark:text-white">Roles</h2><Badge>{rolePager.total} total</Badge></div><div className="overflow-x-auto"><table className="min-w-full border-separate border-spacing-0 text-left text-sm"><thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300"><tr><th className="px-5 py-3">Role</th>{permissionCatalog.map((permission) => <th key={permission.key} className="px-5 py-3">{permission.displayName}</th>)}<th className="px-5 py-3">Actions</th></tr></thead><tbody>{roles.map((role) => <tr key={role.id} className="border-t border-slate-200 dark:border-slate-800"><td className="px-5 py-4 font-semibold text-slate-950 dark:text-white">{role.name}</td>{permissionCatalog.map((permission) => <td key={permission.key} className="px-5 py-4"><Badge tone={role.permissions.includes(permission.key) ? 'success' : 'danger'}>{role.permissions.includes(permission.key) ? 'On' : 'Off'}</Badge></td>)}<td className="px-5 py-4"><Button type="button" variant="secondary" onClick={() => openEditRole(role)}>Edit</Button></td></tr>)}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 dark:border-slate-800"><p>Page {rolePage} of {rolePageCount}</p><div className="flex gap-2"><Button type="button" variant="secondary" disabled={rolePage <= 1} onClick={() => setRolePage((p) => Math.max(1, p - 1))}>Previous</Button><Button type="button" variant="secondary" disabled={rolePage >= rolePageCount} onClick={() => setRolePage((p) => Math.min(rolePageCount, p + 1))}>Next</Button></div></div></Card></div>}

            {isPresidentModalOpen ? <Modal title="Create president account" description="Pick an existing member profile, then add login access." onClose={() => !isCreatingPresident && setIsPresidentModalOpen(false)}><form onSubmit={handleCreatePresident} className="space-y-4" noValidate><StatusMessage tone="danger">{presidentErrors.form}</StatusMessage><label className="space-y-2"><span className="text-sm font-medium">Name <span className="text-rose-600">*</span></span><TextInput name="name" value={presidentForm.name} onChange={(e) => updatePresidentForm('name', e.target.value)} disabled={isCreatingPresident} aria-invalid={Boolean(presidentErrors.name)} /><FieldError>{presidentErrors.name}</FieldError></label><label className="space-y-2"><span className="text-sm font-medium">Email <span className="text-rose-600">*</span></span><TextInput name="email" type="email" value={presidentForm.email} onChange={(e) => updatePresidentForm('email', e.target.value)} disabled={isCreatingPresident} aria-invalid={Boolean(presidentErrors.email)} /><FieldError>{presidentErrors.email}</FieldError></label><label className="space-y-2"><span className="text-sm font-medium">Password <span className="text-rose-600">*</span></span><TextInput name="password" type="password" value={presidentForm.password} onChange={(e) => updatePresidentForm('password', e.target.value)} disabled={isCreatingPresident} aria-invalid={Boolean(presidentErrors.password)} /><p className="text-xs text-slate-500">{PASSWORD_HELP}</p><FieldError>{presidentErrors.password}</FieldError></label><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2"><span className="text-sm font-medium">Member profile <span className="text-rose-600">*</span></span><SelectInput name="memberId" value={presidentForm.memberId} onChange={(e) => updatePresidentForm('memberId', e.target.value)} disabled={isCreatingPresident} aria-invalid={Boolean(presidentErrors.memberId)}><option value="">Choose member profile</option>{members.map((member) => { const linked = presidents.some((president) => president.memberId === member.id); return <option key={member.id} value={member.id} disabled={linked}>{[member.fname, member.lname].filter(Boolean).join(' ')} {linked ? '(linked)' : ''}</option>; })}</SelectInput><FieldError>{presidentErrors.memberId}</FieldError></label><label className="space-y-2"><span className="text-sm font-medium">Role</span><SelectInput name="roleId" value={presidentForm.roleId} onChange={(e) => updatePresidentForm('roleId', e.target.value)} disabled={isCreatingPresident}><option value="">Choose role</option>{roles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}</SelectInput></label></div><label className="inline-flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm"><input type="checkbox" checked={presidentForm.isEnabled} onChange={(e) => updatePresidentForm('isEnabled', e.target.checked)} disabled={isCreatingPresident} />Enabled</label><div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" disabled={isCreatingPresident} onClick={() => setIsPresidentModalOpen(false)}>Cancel</Button><LoadingButton type="submit" isLoading={isCreatingPresident} loadingText="Creating account...">Create president account</LoadingButton></div></form></Modal> : null}
            {changeRoleTarget ? <Modal title="Change Role" description="Role changes are saved only after you confirm." onClose={() => !isChangingRole && setChangeRoleTarget(null)}><div className="space-y-4"><StatusMessage tone="danger">{error}</StatusMessage><div className="rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-900"><p className="font-semibold text-slate-950 dark:text-white">{changeRoleTarget.name}</p><p className="mt-1 text-slate-500">Current role: {changeRoleTarget.role?.name ?? 'No role'}</p></div><label className="space-y-2"><span className="text-sm font-medium">New role</span><SelectInput value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} disabled={isChangingRole}><option value="">No role</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</SelectInput></label>{roles.find((role) => role.id === selectedRoleId)?.permissions.includes('accounts.manage') ? <StatusMessage tone="danger">This role can manage accounts and permissions. Review carefully before saving.</StatusMessage> : null}<div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" disabled={isChangingRole} onClick={() => setChangeRoleTarget(null)}>Cancel</Button><LoadingButton type="button" isLoading={isChangingRole} loadingText="Saving..." disabled={selectedRoleId === (changeRoleTarget.role?.id ?? '')} onClick={saveRoleChange}>Save Changes</LoadingButton></div></div></Modal> : null}
            {editRole ? <Modal title="Edit Role" description="Permission changes stay local until you save." onClose={() => !isSavingRole && setEditRole(null)}><div className="space-y-4"><StatusMessage tone="danger">{error}</StatusMessage><label className="space-y-2"><span className="text-sm font-medium">Role name</span><TextInput value={editRole.name} onChange={(e) => setEditRole({ ...editRole, name: e.target.value })} disabled={isSavingRole} /></label><div className="grid gap-3 sm:grid-cols-2">{permissionCatalog.map((permission) => <label key={permission.key} className="flex min-h-16 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900"><input type="checkbox" className="mt-1 h-4 w-4" checked={editRole.permissions.includes(permission.key)} disabled={isSavingRole} onChange={(e) => { const next = e.target.checked ? [...editRole.permissions, permission.key] : editRole.permissions.filter((item) => item !== permission.key); setEditRole({ ...editRole, permissions: Array.from(new Set(next)) }); }} /><span><span className="block font-medium text-slate-900 dark:text-white">{permission.displayName}</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{permission.description}</span></span></label>)}</div>{includesSensitivePermission(editRole.permissions) ? <StatusMessage tone="danger">This role includes sensitive permissions such as deleting members or managing accounts.</StatusMessage> : null}<div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" disabled={isSavingRole} onClick={() => setEditRole(null)}>Cancel</Button><Button type="button" disabled={!roleChanged || isSavingRole || !editRole.name.trim()} onClick={() => setIsConfirmingRoleSave(true)}>Save Changes</Button></div></div></Modal> : null}
            {isConfirmingRoleSave && editRole ? <Modal title="Confirm permission changes" description="Saving will update what users with this role can do." onClose={() => !isSavingRole && setIsConfirmingRoleSave(false)} className="max-w-md"><div className="space-y-4"><StatusMessage tone={includesSensitivePermission(editRole.permissions) ? 'danger' : 'info'}>{includesSensitivePermission(editRole.permissions) ? 'This update affects sensitive permissions.' : 'Review the permission changes before saving.'}</StatusMessage><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" disabled={isSavingRole} onClick={() => setIsConfirmingRoleSave(false)}>Cancel</Button><LoadingButton type="button" isLoading={isSavingRole} loadingText="Saving..." onClick={saveEditedRole}>Save Changes</LoadingButton></div></div></Modal> : null}
        </div>
    );
}
