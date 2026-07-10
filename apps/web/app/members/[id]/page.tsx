'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BadgeCheck, Edit, X } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Badge, Button, Card, EmptyState, LoadingButton, SelectInput, Skeleton, StatusMessage, TextInput } from '@/components/ui/primitives';
import { apiBaseUrl, parseApiError } from '@/lib/api';
import { hasPermission } from '@/lib/rbac';

type Member = {
    id: string;
    fname: string;
    lname: string;
    mname?: string | null;
    bday: string;
    disability: string;
    phoneNumber: string;
    address: string;
    barangay: string;
    isBedridden: boolean;
    pwdId: string;
    dateIssued?: string | null;
    gender: string;
    joinedAt: string;
};

type MeResponse = { permissions: string[]; isSuperAdmin?: boolean };

type MemberFormState = {
    fname: string;
    lname: string;
    mname: string;
    bday: string;
    disability: string;
    phoneNumber: string;
    address: string;
    barangay: string;
    isBedridden: boolean;
    pwdId: string;
    dateIssued: string;
    gender: string;
};

const DISABILITIES = [
    'CANCER (RA 11215)',
    'DEAF',
    'DEAF & MUTE',
    'Down Syndrome',
    'HEARING',
    'HEART',
    'Hyper',
    'INTELLECTUAL',
    'LEARNING',
    'MENTAL',
    'MULTIPLE',
    'MULTIPLE DISABILITY',
    'ORTHOPEDIC',
    'PHYSICAL',
    'POLIO',
    'PSYCHOLOGICAL',
    'PSYCHOSOCIAL',
    'RARE DISEASE (RA 10747)',
    'SPEECH',
    'SPEECH IMPAIRMENT',
    'Other',
];

const isPresetDisability = (disability: string) => DISABILITIES.includes(disability) && disability !== 'Other';
const usesOtherDisability = (disability: string) => disability.trim() !== '' && !isPresetDisability(disability);

const BARANGAYS = [
    'BONGA MAYOR',
    'BONGA MENOR',
    'BUISAN',
    'CAMACHILIHAN',
    'CAMBAOG',
    'CATACTE',
    'LICIADA',
    'MALAMIG',
    'MALAWAK',
    'POBLACION',
    'SAN PEDRO',
    'TALAMPAS',
    'TANAWAN',
    'TIBAGAN',
];

function formatDateDisplay(value?: string | null) {
    if (!value) return '-';
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return '-';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsedDate).replace(',', '');
}

function computeAge(bday?: string) {
    if (!bday) return '-';
    const dob = new Date(bday);
    if (Number.isNaN(dob.getTime())) return '-';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDelta = today.getMonth() - dob.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) age -= 1;
    return String(age);
}

function memberToForm(member: Member): MemberFormState {
    return {
        fname: member.fname,
        lname: member.lname,
        mname: member.mname ?? '',
        bday: member.bday?.slice(0, 10) ?? '',
        disability: member.disability,
        phoneNumber: member.phoneNumber,
        address: member.address,
        barangay: member.barangay ?? '',
        isBedridden: member.isBedridden,
        pwdId: member.pwdId,
        dateIssued: member.dateIssued?.slice(0, 10) ?? '',
        gender: member.gender,
    };
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-white">{value || '-'}</dd>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Card className="p-5">
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">{title}</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">{children}</dl>
        </Card>
    );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {label} {required ? <span className="text-rose-600 dark:text-rose-400">*</span> : null}
            </span>
            {children}
        </label>
    );
}

function MemberDetailContent({ token }: { token: string }) {
    const params = useParams();
    const router = useRouter();
    const [member, setMember] = useState<Member | null>(null);
    const [user, setUser] = useState<MeResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState<MemberFormState | null>(null);
    const [otherDisability, setOtherDisability] = useState('');
    const [isOtherDisabilitySelected, setIsOtherDisabilitySelected] = useState(false);
    const [status, setStatus] = useState<{ tone: 'info' | 'success' | 'danger'; message: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const id = params?.id;
        if (!id) return;
        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [memberResponse, meResponse] = await Promise.all([
                    fetch(`${apiBaseUrl}/members/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${apiBaseUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                if (!memberResponse.ok) {
                    setError(await parseApiError(memberResponse));
                    setMember(null);
                } else {
                    setMember(await memberResponse.json());
                }
                if (meResponse.ok) setUser(await meResponse.json());
            } catch {
                setError('Unable to load member details. Check your connection and try again.');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [params, token]);

    const initials = useMemo(() => member ? `${member.fname?.[0] ?? ''}${member.lname?.[0] ?? ''}`.toUpperCase() : '', [member]);
    const fullName = member ? [member.fname, member.mname, member.lname].filter(Boolean).join(' ') : '';
    const canUpdate = hasPermission(user?.permissions, 'members.update');

    const startEditing = () => {
        if (!member) return;
        setForm(memberToForm(member));
        setOtherDisability(usesOtherDisability(member.disability) ? member.disability : '');
        setIsOtherDisabilitySelected(usesOtherDisability(member.disability));
        setStatus(null);
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setForm(null);
        setOtherDisability('');
        setIsOtherDisabilitySelected(false);
        setStatus(null);
    };

    const submitEdit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!member || !form) return;

        setIsSaving(true);
        setStatus({ tone: 'info', message: 'Updating member...' });

        try {
            const response = await fetch(`${apiBaseUrl}/members/${member.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });

            if (!response.ok) {
                setStatus({ tone: 'danger', message: `Failed to update member: ${await parseApiError(response)}` });
                return;
            }

            const updatedMember = await response.json();
            setMember(updatedMember);
            setForm(memberToForm(updatedMember));
            setStatus({ tone: 'success', message: 'Member updated successfully.' });
            setIsEditing(false);
        } catch {
            setStatus({ tone: 'danger', message: 'Unable to update member. Check your connection and try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="space-y-4"><Skeleton className="h-32 w-full" /><div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-56" /><Skeleton className="h-56" /></div></div>;
    }

    if (!member) {
        return <EmptyState title="Member record not found" description={error || 'The member may have been deleted or you may not have permission to view it.'} action={<Button type="button" variant="secondary" onClick={() => router.push('/members')}>Back to Members</Button>} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="secondary" onClick={() => router.push('/members')}><ArrowLeft className="h-4 w-4" />Back to Members</Button>
                {canUpdate ? (
                    isEditing
                        ? <Button type="button" variant="secondary" onClick={cancelEditing}><X className="h-4 w-4" />Cancel Edit</Button>
                        : <Button type="button" onClick={startEditing}><Edit className="h-4 w-4" />Edit Member</Button>
                ) : null}
            </div>

            {status ? <StatusMessage tone={status.tone}>{status.message}</StatusMessage> : null}

            <Card className="p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-2xl font-semibold text-white dark:bg-white dark:text-slate-950">{initials}</div>
                    <div className="min-w-0 flex-1">
                        <h1 className="break-words text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{fullName}</h1>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Badge tone="info"><BadgeCheck className="mr-1 h-3.5 w-3.5" />PWD ID {member.pwdId}</Badge>
                            <Badge tone="neutral">{member.disability}</Badge>
                            <Badge tone={member.isBedridden ? 'warning' : 'success'}>{member.isBedridden ? 'Bedridden' : 'Active'}</Badge>
                        </div>
                    </div>
                </div>
            </Card>

            {isEditing && form ? (
                <Card className="p-5 sm:p-6">
                    <form onSubmit={submitEdit} className="space-y-6">
                        <div>
                            <h2 className="text-base font-semibold text-slate-950 dark:text-white">Edit Member Information</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update the details below. The page URL will remain on this member record.</p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="First name" required>
                                <TextInput value={form.fname} onChange={(event) => setForm({ ...form, fname: event.target.value })} required />
                            </Field>
                            <Field label="Middle name">
                                <TextInput value={form.mname} onChange={(event) => setForm({ ...form, mname: event.target.value })} />
                            </Field>
                            <Field label="Last name" required>
                                <TextInput value={form.lname} onChange={(event) => setForm({ ...form, lname: event.target.value })} required />
                            </Field>
                            <Field label="Gender" required>
                                <SelectInput value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} required>
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </SelectInput>
                            </Field>
                            <Field label="Birthday" required>
                                <TextInput type="date" value={form.bday} onChange={(event) => setForm({ ...form, bday: event.target.value })} required />
                            </Field>
                            <Field label="Phone number" required>
                                <TextInput value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} placeholder="09xxxxxxxxx" required />
                            </Field>
                            <Field label="Barangay" required>
                                <SelectInput value={form.barangay} onChange={(event) => setForm({ ...form, barangay: event.target.value })} required>
                                    <option value="">Select barangay</option>
                                    {BARANGAYS.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}
                                </SelectInput>
                            </Field>
                            <Field label="Address" required>
                                <TextInput value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required />
                            </Field>
                            <Field label="Disability" required>
                                <SelectInput
                                    value={isPresetDisability(form.disability) ? form.disability : (isOtherDisabilitySelected ? 'Other' : '')}
                                    onChange={(event) => {
                                        if (event.target.value === 'Other') {
                                            setIsOtherDisabilitySelected(true);
                                            setForm({ ...form, disability: otherDisability });
                                            return;
                                        }
                                        setIsOtherDisabilitySelected(false);
                                        setOtherDisability('');
                                        setForm({ ...form, disability: event.target.value });
                                    }}
                                    required
                                >
                                    <option value="">Select disability</option>
                                    {DISABILITIES.map((disability) => <option key={disability} value={disability}>{disability}</option>)}
                                </SelectInput>
                                {isOtherDisabilitySelected ? (
                                    <TextInput
                                        value={otherDisability}
                                        onChange={(event) => {
                                            setOtherDisability(event.target.value);
                                            setForm({ ...form, disability: event.target.value });
                                        }}
                                        placeholder="Specify disability"
                                        required
                                    />
                                ) : null}
                            </Field>
                            <Field label="Bedridden" required>
                                <SelectInput value={form.isBedridden ? 'yes' : 'no'} onChange={(event) => setForm({ ...form, isBedridden: event.target.value === 'yes' })} required>
                                    <option value="no">No</option>
                                    <option value="yes">Yes</option>
                                </SelectInput>
                            </Field>
                            <Field label="PWD ID" required>
                                <TextInput value={form.pwdId} onChange={(event) => setForm({ ...form, pwdId: event.target.value })} required />
                            </Field>
                            <Field label="Date issued">
                                <TextInput type="date" value={form.dateIssued} onChange={(event) => setForm({ ...form, dateIssued: event.target.value })} />
                            </Field>
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                            <Button type="button" variant="secondary" onClick={cancelEditing} disabled={isSaving}>Cancel</Button>
                            <LoadingButton type="submit" isLoading={isSaving} loadingText="Updating...">Update Member</LoadingButton>
                        </div>
                    </form>
                </Card>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
                <Section title="Personal Information">
                    <DetailItem label="First name" value={member.fname} />
                    <DetailItem label="Middle name" value={member.mname} />
                    <DetailItem label="Last name" value={member.lname} />
                    <DetailItem label="Gender" value={member.gender} />
                    <DetailItem label="Birthday" value={formatDateDisplay(member.bday)} />
                    <DetailItem label="Age" value={`${computeAge(member.bday)} years old`} />
                </Section>
                <Section title="Contact Information">
                    <DetailItem label="Phone number" value={member.phoneNumber} />
                    <DetailItem label="Barangay" value={member.barangay} />
                    <div className="sm:col-span-2"><DetailItem label="Complete address" value={member.address} /></div>
                </Section>
                <Section title="PWD Information">
                    <DetailItem label="PWD ID" value={member.pwdId} />
                    <DetailItem label="Disability" value={member.disability} />
                    <DetailItem label="Date issued" value={formatDateDisplay(member.dateIssued)} />
                    <DetailItem label="Bedridden" value={member.isBedridden ? 'Yes' : 'No'} />
                </Section>
                <Section title="Other Information">
                    <DetailItem label="Joined" value={formatDateDisplay(member.joinedAt)} />
                    <DetailItem label="Record status" value={member.isBedridden ? 'Needs bedridden support' : 'Active member'} />
                </Section>
            </div>
        </div>
    );
}

export default function MemberDetailPage() {
    return <AppShell title="Member Details" description="View personal, contact, and PWD registry information.">{(token) => <MemberDetailContent token={token} />}</AppShell>;
}
