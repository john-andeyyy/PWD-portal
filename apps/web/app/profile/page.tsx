'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Badge, Button, Card, SelectInput, TextInput } from '@/components/ui/primitives';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

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

const parseApiError = async (response: Response) => {
    try {
        const body = await response.json();
        if (Array.isArray(body?.message)) {
            return body.message.join(', ');
        }
        if (typeof body?.message === 'string' && body.message.trim() !== '') {
            return body.message;
        }
    } catch {
        // Ignore malformed response bodies.
    }

    return response.statusText || 'Request failed.';
};

function ProfileContent({ token }: { token: string }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fname, setFname] = useState('');
    const [lname, setLname] = useState('');
    const [mname, setMname] = useState('');
    const [bday, setBday] = useState('');
    const [disability, setDisability] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [barangay, setBarangay] = useState('');
    const [isBedridden, setIsBedridden] = useState(false);
    const [pwdId, setPwdId] = useState('');
    const [dateIssued, setDateIssued] = useState('');
    const [gender, setGender] = useState('');
    const [status, setStatus] = useState<string | null>(null);

    const hydrateForm = (data: Profile) => {
        setProfile(data);
        setName(data.name ?? '');
        setEmail(data.email ?? '');
        setFname(data.fname ?? '');
        setLname(data.lname ?? '');
        setMname(data.mname ?? '');
        setBday(data.bday ? String(data.bday).slice(0, 10) : '');
        setDisability(data.disability ?? '');
        setPhoneNumber(data.phoneNumber ?? '');
        setAddress(data.address ?? '');
        setBarangay(data.barangay ?? '');
        setIsBedridden(data.isBedridden === true);
        setPwdId(data.pwdId ?? '');
        setDateIssued(data.dateIssued ? String(data.dateIssued).slice(0, 10) : '');
        setGender(data.gender ?? '');
    };

    useEffect(() => {
        const loadProfile = async () => {
            const response = await fetch(`${apiBaseUrl}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                setStatus(await parseApiError(response));
                return;
            }

            hydrateForm(await response.json());
        };

        loadProfile();
    }, [token]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus('Saving profile...');

        const payload: {
            name?: string;
            email?: string;
            password?: string;
            fname?: string;
            lname?: string;
            mname?: string;
            bday?: string;
            disability?: string;
            phoneNumber?: string;
            address?: string;
            barangay?: string;
            isBedridden?: boolean;
            pwdId?: string;
            dateIssued?: string;
            gender?: string;
        } = {};

        if (name.trim() !== '') payload.name = name.trim();
        if (email.trim() !== '') payload.email = email.trim();
        if (password.trim() !== '') payload.password = password;

        const hasAnyMemberInput =
            !!profile?.memberId ||
            [fname, lname, mname, bday, disability, phoneNumber, address, barangay, pwdId, dateIssued, gender].some(
                (value) => value.trim() !== '',
            );

        if (hasAnyMemberInput) {
            if (fname.trim() !== '') payload.fname = fname.trim();
            if (lname.trim() !== '') payload.lname = lname.trim();
            if (mname.trim() !== '') payload.mname = mname.trim();
            if (bday.trim() !== '') payload.bday = bday;
            if (disability.trim() !== '') payload.disability = disability.trim();
            if (phoneNumber.trim() !== '') payload.phoneNumber = phoneNumber.trim();
            if (address.trim() !== '') payload.address = address.trim();
            if (barangay.trim() !== '') payload.barangay = barangay.trim();
            payload.isBedridden = isBedridden;
            if (pwdId.trim() !== '') payload.pwdId = pwdId.trim();
            if (dateIssued.trim() !== '') payload.dateIssued = dateIssued;
            if (gender.trim() !== '') payload.gender = gender;
        }

        const response = await fetch(`${apiBaseUrl}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            setStatus(await parseApiError(response));
            return;
        }

        hydrateForm(await response.json());
        setPassword('');
        setStatus('Profile updated successfully.');
    };

    const displayName = [fname, mname, lname].filter(Boolean).join(' ') || name || 'Profile owner';

    if (!profile) {
        return <Card className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading profile...</Card>;
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
            <aside className="space-y-4">
                <Card className="p-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-950 text-xl font-semibold text-white dark:bg-white dark:text-slate-950">
                        {displayName.slice(0, 1).toUpperCase()}
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">{displayName}</h2>
                    <p className="mt-1 break-all text-sm text-slate-500 dark:text-slate-400">{email}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Badge tone={profile.memberId ? 'success' : 'neutral'}>{profile.memberId ? 'Linked member' : 'Account only'}</Badge>
                        {pwdId ? <Badge tone="info">PWD ID {pwdId}</Badge> : null}
                    </div>
                </Card>

                <Card className="p-5 text-sm text-slate-500 dark:text-slate-400">
                    <p className="font-medium text-slate-700 dark:text-slate-300">Record IDs</p>
                    <p className="mt-3 break-all">User: {profile.userId}</p>
                    {profile.memberId ? <p className="mt-2 break-all">Member: {profile.memberId}</p> : null}
                </Card>
            </aside>

            <form onSubmit={handleSubmit} className="space-y-6">
                {status ? <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">{status}</div> : null}

                <Card className="p-5 sm:p-6">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Account details</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update login and display information.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</span>
                            <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Your account name" />
                        </label>
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
                            <TextInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
                        </label>
                        <label className="space-y-2 sm:col-span-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">New password</span>
                            <TextInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Leave blank to keep current password" />
                        </label>
                    </div>
                </Card>

                <Card className="p-5 sm:p-6">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">PWD details</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Keep personal, contact, and registry details current.</p>
                        </div>
                        <Badge tone={isBedridden ? 'warning' : 'neutral'}>{isBedridden ? 'Bedridden' : 'Not bedridden'}</Badge>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">First name</span>
                            <TextInput value={fname} onChange={(event) => setFname(event.target.value)} />
                        </label>
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Middle name</span>
                            <TextInput value={mname} onChange={(event) => setMname(event.target.value)} />
                        </label>
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Last name</span>
                            <TextInput value={lname} onChange={(event) => setLname(event.target.value)} />
                        </label>
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Birthday</span>
                            <TextInput type="date" value={bday} onChange={(event) => setBday(event.target.value)} />
                        </label>
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Gender</span>
                            <SelectInput value={gender} onChange={(event) => setGender(event.target.value)}>
                                <option value="">Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </SelectInput>
                        </label>
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone number</span>
                            <TextInput value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
                        </label>
                        <label className="space-y-2 sm:col-span-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Address</span>
                            <TextInput value={address} onChange={(event) => setAddress(event.target.value)} />
                        </label>
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Barangay</span>
                            <TextInput value={barangay} onChange={(event) => setBarangay(event.target.value)} />
                        </label>
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Disability</span>
                            <TextInput value={disability} onChange={(event) => setDisability(event.target.value)} />
                        </label>
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">PWD ID</span>
                            <TextInput value={pwdId} onChange={(event) => setPwdId(event.target.value)} />
                        </label>
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Date issued</span>
                            <TextInput type="date" value={dateIssued} onChange={(event) => setDateIssued(event.target.value)} />
                        </label>
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bedridden</span>
                            <SelectInput value={isBedridden ? 'yes' : 'no'} onChange={(event) => setIsBedridden(event.target.value === 'yes')}>
                                <option value="no">No</option>
                                <option value="yes">Yes</option>
                            </SelectInput>
                        </label>
                    </div>
                </Card>

                <div className="sticky bottom-0 flex justify-end border-t border-slate-200 bg-slate-50/95 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
                    <Button type="submit">Save profile</Button>
                </div>
            </form>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <AppShell title="Profile" description="Update your account and PWD profile details.">
            {(token) => <ProfileContent token={token} />}
        </AppShell>
    );
}
