'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { Badge, Button, Card, EmptyState, FieldError, LoadingButton, Modal, StatusMessage, TextInput } from '@/components/ui/primitives';
import { fetchPermissionCatalog, hasPermission, PermissionCatalogItem } from '@/lib/rbac';
import { apiBaseUrl, parseApiError } from '@/lib/api';
import { focusFirstInvalidField, friendlyError } from '@/lib/validation';

type MeResponse = { userId: string; email: string; roleId?: string | null; roleName?: string | null; permissions: string[] };
type Role = { id: string; name: string; permissions: string[] };
type Pager = { data: Role[]; total: number; page: number; limit: number };
type RoleErrors = Partial<Record<'name' | 'permissions' | 'form', string>>;
type EditRoleState = { role: Role; name: string; permissions: string[] } | null;

const sensitive = (permissions: string[]) => permissions.includes('members.delete') || permissions.includes('accounts.manage');

function RolesContent({ token }: { token: string }) {
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<MeResponse | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissionCatalog, setPermissionCatalog] = useState<PermissionCatalogItem[]>([]);
    const [page, setPage] = useState(1);
    const [pager, setPager] = useState<Pager>({ data: [], total: 0, page: 1, limit: 5 });
    const [form, setForm] = useState({ name: '', permissions: [] as string[] });
    const [errors, setErrors] = useState<RoleErrors>({});
    const [isCreating, setIsCreating] = useState(false);
    const [editRole, setEditRole] = useState<EditRoleState>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSavingRole, setIsSavingRole] = useState(false);

    const fetchMe = async () => {
        const response = await fetch(`${apiBaseUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) { setError('Unable to verify account permissions.'); return; }
        setUser(await response.json());
    };
    const fetchRoles = async (pageNumber = 1) => {
        const response = await fetch(`${apiBaseUrl}/roles?page=${pageNumber}&limit=5`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) { setError('Unable to load roles.'); return; }
        const data = await response.json(); setRoles(data.data || []); setPager(data);
    };
    const fetchPermissions = async () => {
        try {
            const catalog = await fetchPermissionCatalog(apiBaseUrl);
            setPermissionCatalog(catalog);
            setForm((current) => current.permissions.length > 0 || catalog.length === 0 ? current : { ...current, permissions: [catalog[0].key] });
        } catch { setError('Unable to load permission catalog.'); }
    };

    useEffect(() => { fetchMe(); fetchRoles(page); fetchPermissions(); }, [token, page]);

    const validateCreate = () => {
        const next: RoleErrors = {};
        if (!form.name.trim()) next.name = 'Role name is required.';
        if (form.permissions.length === 0) next.permissions = 'Select at least one permission.';
        return next;
    };

    const handleCreateRole = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const next = validateCreate();
        setErrors(next);
        if (Object.keys(next).length > 0) { focusFirstInvalidField(next); return; }
        setIsCreating(true); setError(null); setStatus(null);
        try {
            const response = await fetch(`${apiBaseUrl}/roles`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: form.name.trim(), permissions: form.permissions }) });
            if (!response.ok) { setErrors({ form: friendlyError(await parseApiError(response)) }); return; }
            setStatus('Role created successfully.'); setForm({ name: '', permissions: permissionCatalog[0] ? [permissionCatalog[0].key] : [] }); setPage(1); await fetchRoles(1);
        } catch { setErrors({ form: 'Unable to create role. Check your connection and try again.' }); }
        finally { setIsCreating(false); }
    };

    const roleChanged = editRole ? editRole.name.trim() !== editRole.role.name || [...editRole.permissions].sort().join('|') !== [...editRole.role.permissions].sort().join('|') : false;
    const saveEditedRole = async () => {
        if (!editRole) return;
        setIsSavingRole(true); setError(null); setStatus(null);
        try {
            const response = await fetch(`${apiBaseUrl}/roles/${editRole.role.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: editRole.name.trim(), permissions: editRole.permissions }) });
            if (!response.ok) { setError(friendlyError(await parseApiError(response))); return; }
            setStatus('Role permissions updated successfully.'); setEditRole(null); setIsConfirmOpen(false); await fetchRoles(page);
        } catch { setError('Unable to update role permissions. Check your connection and try again.'); }
        finally { setIsSavingRole(false); }
    };

    const pageCount = Math.ceil(pager.total / pager.limit) || 1;

    if (!user) return <Card className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading permissions...</Card>;
    if (!hasPermission(user.permissions, 'accounts.manage')) return <EmptyState title="Access restricted" description="You do not have permission to manage roles." />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Role setup</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Create role</h2></div><Link href="/accounts" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900">Back to accounts</Link></div>
            <StatusMessage tone="success">{status}</StatusMessage><StatusMessage tone="danger">{error || errors.form}</StatusMessage>
            <Card className="p-5 sm:p-6"><form onSubmit={handleCreateRole} className="space-y-5" noValidate><div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"><label className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Role name <span className="text-rose-600">*</span></span><TextInput name="name" value={form.name} onChange={(event) => { setForm({ ...form, name: event.target.value }); setErrors((current) => ({ ...current, name: undefined, form: undefined })); }} disabled={isCreating} aria-invalid={Boolean(errors.name)} /><FieldError>{errors.name}</FieldError></label><div><p className="text-sm font-medium text-slate-700 dark:text-slate-300">Permissions <span className="text-rose-600">*</span></p><div className="mt-2 grid gap-2 sm:grid-cols-2">{permissionCatalog.map((permission) => <label key={permission.key} className="flex min-h-11 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"><input type="checkbox" checked={form.permissions.includes(permission.key)} disabled={isCreating} onChange={(event) => { const nextPermissions = event.target.checked ? [...form.permissions, permission.key] : form.permissions.filter((item) => item !== permission.key); setForm({ ...form, permissions: Array.from(new Set(nextPermissions)) }); setErrors((current) => ({ ...current, permissions: undefined, form: undefined })); }} className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400" /><span>{permission.displayName}</span></label>)}</div><FieldError>{errors.permissions}</FieldError></div></div>{sensitive(form.permissions) ? <StatusMessage tone="danger">This role includes sensitive permissions.</StatusMessage> : null}<div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800"><LoadingButton type="submit" isLoading={isCreating} loadingText="Creating role...">Create role</LoadingButton></div></form></Card>
            <Card className="overflow-hidden"><div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold text-slate-950 dark:text-white">Existing roles</h2><p className="text-sm text-slate-500 dark:text-slate-400">Permissions are read-only until you choose Edit.</p></div><Badge>{pager.total} total</Badge></div><div className="overflow-x-auto"><table className="min-w-full border-separate border-spacing-0 text-left text-sm"><thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300"><tr><th className="px-5 py-3 font-medium">Role</th>{permissionCatalog.map((permission) => <th key={permission.key} className="px-5 py-3 font-medium">{permission.displayName}</th>)}<th className="px-5 py-3 font-medium">Actions</th></tr></thead><tbody>{roles.map((role) => <tr key={role.id} className="border-t border-slate-200 dark:border-slate-800"><td className="px-5 py-4 font-semibold text-slate-950 dark:text-white">{role.name}</td>{permissionCatalog.map((permission) => <td key={permission.key} className="px-5 py-4"><Badge tone={role.permissions.includes(permission.key) ? 'success' : 'danger'}>{role.permissions.includes(permission.key) ? 'On' : 'Off'}</Badge></td>)}<td className="px-5 py-4"><Button type="button" variant="secondary" onClick={() => setEditRole({ role, name: role.name, permissions: [...role.permissions] })}>Edit</Button></td></tr>)}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400"><p>Page {page} of {pageCount}</p><div className="flex gap-2"><Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button><Button type="button" variant="secondary" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</Button></div></div></Card>
            {editRole ? <Modal title="Edit Role" description="Permission changes stay local until you save." onClose={() => !isSavingRole && setEditRole(null)}><div className="space-y-4"><StatusMessage tone="danger">{error}</StatusMessage><label className="space-y-2"><span className="text-sm font-medium">Role name</span><TextInput value={editRole.name} onChange={(e) => setEditRole({ ...editRole, name: e.target.value })} disabled={isSavingRole} /></label><div className="grid gap-3 sm:grid-cols-2">{permissionCatalog.map((permission) => <label key={permission.key} className="flex min-h-16 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900"><input type="checkbox" className="mt-1 h-4 w-4" checked={editRole.permissions.includes(permission.key)} disabled={isSavingRole} onChange={(e) => { const next = e.target.checked ? [...editRole.permissions, permission.key] : editRole.permissions.filter((item) => item !== permission.key); setEditRole({ ...editRole, permissions: Array.from(new Set(next)) }); }} /><span><span className="block font-medium text-slate-900 dark:text-white">{permission.displayName}</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{permission.description}</span></span></label>)}</div>{sensitive(editRole.permissions) ? <StatusMessage tone="danger">This role includes sensitive permissions such as deleting members or managing accounts.</StatusMessage> : null}<div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" disabled={isSavingRole} onClick={() => setEditRole(null)}>Cancel</Button><Button type="button" disabled={!roleChanged || isSavingRole || !editRole.name.trim()} onClick={() => setIsConfirmOpen(true)}>Save Changes</Button></div></div></Modal> : null}
            {isConfirmOpen && editRole ? <Modal title="Confirm permission changes" description="Saving will update what users with this role can do." onClose={() => !isSavingRole && setIsConfirmOpen(false)} className="max-w-md"><div className="space-y-4"><StatusMessage tone={sensitive(editRole.permissions) ? 'danger' : 'info'}>{sensitive(editRole.permissions) ? 'This update affects sensitive permissions.' : 'Review the permission changes before saving.'}</StatusMessage><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" disabled={isSavingRole} onClick={() => setIsConfirmOpen(false)}>Cancel</Button><LoadingButton type="button" isLoading={isSavingRole} loadingText="Saving..." onClick={saveEditedRole}>Save Changes</LoadingButton></div></div></Modal> : null}
        </div>
    );
}

export default function RolesPage() {
    return <AppShell title="Roles" description="Create roles and manage permission access.">{(token) => <RolesContent token={token} />}</AppShell>;
}
