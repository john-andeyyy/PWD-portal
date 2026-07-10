'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Badge, Button, Card, FieldError, LoadingButton, Modal, SelectInput, StatusMessage, TextInput } from '@/components/ui/primitives';
import { apiBaseUrl, parseApiError } from '@/lib/api';
import { focusFirstInvalidField, friendlyError, isFutureDate, isValidEmail, isValidPassword, isValidPhilippineMobile, MOBILE_HELP, normalizeNumericInput, PASSWORD_HELP } from '@/lib/validation';

type Profile = {
    userId: string;
    email: string;
    name?: string;
    memberId?: string | null;
    fname?: string | null;
    lname?: string | null;
    mname?: string | null;
    bday?: string | null;
    disability?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    barangay?: string | null;
    isBedridden?: boolean | null;
    pwdId?: string | null;
    dateIssued?: string | null;
    gender?: string | null;
};

type ProfileErrors = Partial<Record<'name' | 'email' | 'fname' | 'mname' | 'lname' | 'bday' | 'disability' | 'phoneNumber' | 'address' | 'barangay' | 'pwdId' | 'dateIssued' | 'gender' | 'form', string>>;
type PasswordErrors = Partial<Record<'currentPassword' | 'newPassword' | 'confirmPassword' | 'form', string>>;

function ProfileContent({ token }: { token: string }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [form, setForm] = useState({ name: '', email: '', fname: '', lname: '', mname: '', bday: '', disability: '', phoneNumber: '', address: '', barangay: '', isBedridden: false, pwdId: '', dateIssued: '', gender: '' });
    const [errors, setErrors] = useState<ProfileErrors>({});
    const [status, setStatus] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
    const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const hydrateForm = (data: Profile) => {
        setProfile(data);
        setForm({
            name: data.name ?? '',
            email: data.email ?? '',
            fname: data.fname ?? '',
            lname: data.lname ?? '',
            mname: data.mname ?? '',
            bday: data.bday ? String(data.bday).slice(0, 10) : '',
            disability: data.disability ?? '',
            phoneNumber: data.phoneNumber ?? '',
            address: data.address ?? '',
            barangay: data.barangay ?? '',
            isBedridden: data.isBedridden === true,
            pwdId: data.pwdId ?? '',
            dateIssued: data.dateIssued ? String(data.dateIssued).slice(0, 10) : '',
            gender: data.gender ?? '',
        });
    };

    useEffect(() => {
        const loadProfile = async () => {
            const response = await fetch(`${apiBaseUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
            if (!response.ok) {
                setStatus(friendlyError(await parseApiError(response)));
                return;
            }
            hydrateForm(await response.json());
        };
        loadProfile();
    }, [token]);

    const updateForm = (key: keyof typeof form, value: string | boolean) => {
        setForm((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
    };

    const validateProfile = () => {
        const next: ProfileErrors = {};
        if (!form.email.trim()) next.email = 'Email is required.';
        else if (!isValidEmail(form.email)) next.email = 'Enter a valid email address.';

        const hasAnyMemberInput = Boolean(profile?.memberId) || ['fname', 'lname', 'bday', 'disability', 'phoneNumber', 'address', 'barangay', 'pwdId', 'dateIssued', 'gender'].some((key) => String(form[key as keyof typeof form] ?? '').trim() !== '');
        if (hasAnyMemberInput) {
            if (!form.fname.trim()) next.fname = 'First name is required.';
            if (!form.lname.trim()) next.lname = 'Last name is required.';
            if (!form.bday) next.bday = 'Birthday is required.';
            else if (isFutureDate(form.bday)) next.bday = 'Birthday must not be a future date.';
            if (!form.gender) next.gender = 'Gender is required.';
            if (!form.address.trim()) next.address = 'Address is required.';
            if (!form.barangay.trim()) next.barangay = 'Barangay is required.';
            if (!form.phoneNumber.trim()) next.phoneNumber = 'Phone number is required.';
            else if (!isValidPhilippineMobile(form.phoneNumber)) next.phoneNumber = MOBILE_HELP;
            if (!form.disability.trim()) next.disability = 'Disability is required.';
            if (!form.pwdId.trim()) next.pwdId = 'PWD ID is required.';
            if (form.dateIssued && isFutureDate(form.dateIssued)) next.dateIssued = 'Date issued must not be a future date.';
        }
        return next;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextErrors = validateProfile();
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            focusFirstInvalidField(nextErrors);
            return;
        }

        setIsSaving(true);
        setStatus(null);
        const payload: Record<string, string | boolean> = {};
        if (form.name.trim()) payload.name = form.name.trim();
        payload.email = form.email.trim();
        const hasAnyMemberInput = Boolean(profile?.memberId) || ['fname', 'lname', 'mname', 'bday', 'disability', 'phoneNumber', 'address', 'barangay', 'pwdId', 'dateIssued', 'gender'].some((key) => String(form[key as keyof typeof form] ?? '').trim() !== '');
        if (hasAnyMemberInput) {
            ['fname', 'lname', 'mname', 'bday', 'disability', 'phoneNumber', 'address', 'barangay', 'pwdId', 'dateIssued', 'gender'].forEach((key) => {
                const value = String(form[key as keyof typeof form] ?? '').trim();
                if (value) payload[key] = value;
            });
            payload.isBedridden = form.isBedridden;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/auth/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
            if (!response.ok) {
                setErrors({ form: friendlyError(await parseApiError(response)) });
                return;
            }
            hydrateForm(await response.json());
            setIsEditing(false);
            setStatus('Profile updated successfully.');
        } catch {
            setErrors({ form: 'Unable to save profile. Check your connection and try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        if (profile) hydrateForm(profile);
        setErrors({});
        setStatus(null);
        setIsEditing(false);
    };

    const validatePassword = () => {
        const next: PasswordErrors = {};
        if (!passwordForm.currentPassword) next.currentPassword = 'Current password is required.';
        if (!passwordForm.newPassword) next.newPassword = 'New password is required.';
        else if (!isValidPassword(passwordForm.newPassword)) next.newPassword = PASSWORD_HELP;
        if (!passwordForm.confirmPassword) next.confirmPassword = 'Confirm new password is required.';
        else if (passwordForm.newPassword !== passwordForm.confirmPassword) next.confirmPassword = 'New password and confirmation must match.';
        if (passwordForm.currentPassword && passwordForm.newPassword && passwordForm.currentPassword === passwordForm.newPassword) next.newPassword = 'New password must be different from the current password.';
        return next;
    };

    const changePassword = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextErrors = validatePassword();
        setPasswordErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            focusFirstInvalidField(nextErrors);
            return;
        }
        setIsChangingPassword(true);
        try {
            const response = await fetch(`${apiBaseUrl}/auth/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }) });
            if (!response.ok) {
                setPasswordErrors({ form: friendlyError(await parseApiError(response)) });
                return;
            }
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setIsPasswordOpen(false);
            setStatus('Password changed successfully.');
        } catch {
            setPasswordErrors({ form: 'Unable to change password. Check your connection and try again.' });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const displayName = useMemo(() => [form.fname, form.mname, form.lname].filter(Boolean).join(' ') || form.name || 'Profile owner', [form]);
    const isProfileReadOnly = !isEditing || isSaving;

    if (!profile) return <Card className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading profile...</Card>;

    const passwordField = (key: keyof typeof passwordForm, label: string, showKey: keyof typeof showPassword, help?: string) => (
        <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label} <span className="text-rose-600">*</span></span>
            <div className="relative">
                <TextInput
                    name={key}
                    type={showPassword[showKey] ? 'text' : 'password'}
                    value={passwordForm[key]}
                    onChange={(event) => {
                        setPasswordForm((current) => ({ ...current, [key]: event.target.value }));
                        setPasswordErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
                    }}
                    disabled={isChangingPassword}
                    className="pr-11"
                    aria-invalid={Boolean(passwordErrors[key])}
                    aria-describedby={passwordErrors[key] ? `${key}-error` : help ? `${key}-help` : undefined}
                />
                <button type="button" className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => setShowPassword((current) => ({ ...current, [showKey]: !current[showKey] }))} aria-label={showPassword[showKey] ? `Hide ${label}` : `Show ${label}`}>
                    {showPassword[showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
            {help ? <p id={`${key}-help`} className="text-xs text-slate-500 dark:text-slate-400">{help}</p> : null}
            <FieldError id={`${key}-error`}>{passwordErrors[key]}</FieldError>
        </label>
    );

    return (
        <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
            <aside className="space-y-4">
                <Card className="p-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-950 text-xl font-semibold text-white dark:bg-white dark:text-slate-950">{displayName.slice(0, 1).toUpperCase()}</div>
                    <h2 className="mt-4 break-words text-lg font-semibold text-slate-950 dark:text-white">{displayName}</h2>
                    <p className="mt-1 break-all text-sm text-slate-500 dark:text-slate-400">{form.email}</p>
                    <div className="mt-4 flex flex-wrap gap-2"><Badge tone={profile.memberId ? 'success' : 'neutral'}>{profile.memberId ? 'Linked member' : 'Account only'}</Badge>{form.pwdId ? <Badge tone="info">PWD ID {form.pwdId}</Badge> : null}</div>
                    <Button type="button" variant="secondary" className="mt-5 w-full" onClick={() => setIsPasswordOpen(true)}>Change Password</Button>
                </Card>
            </aside>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <StatusMessage tone="success">{status}</StatusMessage>
                <StatusMessage tone="danger">{errors.form}</StatusMessage>
                <Card className="p-5 sm:p-6">
                    <div className="mb-5"><h2 className="text-lg font-semibold text-slate-950 dark:text-white">Account details</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View login and display information.</p></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</span><TextInput name="name" value={form.name} onChange={(e) => updateForm('name', e.target.value)} disabled={isProfileReadOnly} /></label>
                        <label className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email <span className="text-rose-600">*</span></span><TextInput name="email" type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} disabled={isProfileReadOnly} aria-invalid={Boolean(errors.email)} aria-describedby="email-error" /><FieldError id="email-error">{errors.email}</FieldError></label>
                    </div>
                </Card>
                <Card className="p-5 sm:p-6">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold text-slate-950 dark:text-white">PWD details</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View personal, contact, and registry details.</p></div><Badge tone={form.isBedridden ? 'warning' : 'neutral'}>{form.isBedridden ? 'Bedridden' : 'Not bedridden'}</Badge></div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {(['fname', 'mname', 'lname'] as const).map((key) => <label key={key} className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">{key === 'fname' ? 'First name' : key === 'mname' ? 'Middle name' : 'Last name'} {key !== 'mname' ? <span className="text-rose-600">*</span> : null}</span><TextInput name={key} value={form[key]} onChange={(e) => updateForm(key, e.target.value)} disabled={isProfileReadOnly} aria-invalid={Boolean(errors[key])} aria-describedby={`${key}-error`} /><FieldError id={`${key}-error`}>{errors[key]}</FieldError></label>)}
                        <label className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Birthday <span className="text-rose-600">*</span></span><TextInput name="bday" type="date" value={form.bday} onChange={(e) => updateForm('bday', e.target.value)} disabled={isProfileReadOnly} aria-invalid={Boolean(errors.bday)} aria-describedby="bday-error" /><FieldError id="bday-error">{errors.bday}</FieldError></label>
                        <label className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Gender <span className="text-rose-600">*</span></span><SelectInput name="gender" value={form.gender} onChange={(e) => updateForm('gender', e.target.value)} disabled={isProfileReadOnly} aria-invalid={Boolean(errors.gender)} aria-describedby="gender-error"><option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></SelectInput><FieldError id="gender-error">{errors.gender}</FieldError></label>
                        <label className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone number <span className="text-rose-600">*</span></span><TextInput name="phoneNumber" type="tel" inputMode="numeric" maxLength={11} value={form.phoneNumber} onChange={(e) => updateForm('phoneNumber', normalizeNumericInput(e.target.value))} disabled={isProfileReadOnly} placeholder="09XXXXXXXXX" aria-invalid={Boolean(errors.phoneNumber)} aria-describedby="phone-error" /><p className="text-xs text-slate-500 dark:text-slate-400">{MOBILE_HELP}</p><FieldError id="phone-error">{errors.phoneNumber}</FieldError></label>
                        <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Address <span className="text-rose-600">*</span></span><TextInput name="address" value={form.address} onChange={(e) => updateForm('address', e.target.value)} disabled={isProfileReadOnly} aria-invalid={Boolean(errors.address)} aria-describedby="address-error" /><FieldError id="address-error">{errors.address}</FieldError></label>
                        {(['barangay', 'disability', 'pwdId'] as const).map((key) => <label key={key} className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">{key === 'pwdId' ? 'PWD ID' : key[0].toUpperCase() + key.slice(1)} <span className="text-rose-600">*</span></span><TextInput name={key} value={form[key]} onChange={(e) => updateForm(key, e.target.value)} disabled={isProfileReadOnly} aria-invalid={Boolean(errors[key])} aria-describedby={`${key}-error`} /><FieldError id={`${key}-error`}>{errors[key]}</FieldError></label>)}
                        <label className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Date issued</span><TextInput name="dateIssued" type="date" value={form.dateIssued} onChange={(e) => updateForm('dateIssued', e.target.value)} disabled={isProfileReadOnly} aria-invalid={Boolean(errors.dateIssued)} aria-describedby="dateIssued-error" /><FieldError id="dateIssued-error">{errors.dateIssued}</FieldError></label>
                        <label className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bedridden</span><SelectInput value={form.isBedridden ? 'yes' : 'no'} onChange={(e) => updateForm('isBedridden', e.target.value === 'yes')} disabled={isProfileReadOnly}><option value="no">No</option><option value="yes">Yes</option></SelectInput></label>
                    </div>
                </Card>
                <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-slate-50/95 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">{isEditing ? <><Button type="button" variant="secondary" disabled={isSaving} onClick={handleCancelEdit}>Cancel</Button><LoadingButton type="submit" isLoading={isSaving} loadingText="Saving...">Save profile</LoadingButton></> : <Button type="button" onClick={() => { setErrors({}); setStatus(null); setIsEditing(true); }}>Update</Button>}</div>
            </form>

            {isPasswordOpen ? <Modal title="Change Password" description="Enter your current password and choose a new password." onClose={() => !isChangingPassword && setIsPasswordOpen(false)}><form onSubmit={changePassword} className="space-y-4" noValidate><StatusMessage tone="danger">{passwordErrors.form}</StatusMessage>{passwordField('currentPassword', 'Current Password', 'current')}{passwordField('newPassword', 'New Password', 'next', PASSWORD_HELP)}{passwordField('confirmPassword', 'Confirm New Password', 'confirm')}<div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" disabled={isChangingPassword} onClick={() => setIsPasswordOpen(false)}>Cancel</Button><LoadingButton type="submit" isLoading={isChangingPassword} loadingText="Changing password...">Change password</LoadingButton></div></form></Modal> : null}
        </div>
    );
}

export default function ProfilePage() {
    return <AppShell title="Profile" description="Update your account and PWD profile details.">{(token) => <ProfileContent token={token} />}</AppShell>;
}
