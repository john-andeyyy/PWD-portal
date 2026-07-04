'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@pwd/ui';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

interface Member {
    id: number;
    fname: string;
    lname: string;
    mname?: string;
    bday: string;
    disability: string;
    phoneNumber: string;
    address: string;
    barangay?: string;
    isBedridden: boolean;
    pwdId: string;
    dateIssued: string;
    gender: string;
}

interface MembersManagerProps {
    token: string;
}

export function MembersManager({ token }: MembersManagerProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [status, setStatus] = useState<string | null>(null);
    const [form, setForm] = useState({
        fname: '',
        lname: '',
        mname: '',
        bday: '',
        disability: '',
        phoneNumber: '',
        address: '',
        barangay: '',
        isBedridden: false,
        pwdId: '',
        dateIssued: '',
        gender: ''
    });
    const [otherDisability, setOtherDisability] = useState('');

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
        'Other'
    ];

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
        'TIBAGAN'
    ];
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState(1);
    const router = useRouter();

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const isStep1Valid = () => {
        return (
            form.fname.trim() !== '' &&
            form.lname.trim() !== '' &&
            form.bday !== '' &&
            form.gender !== '' &&
            form.address.trim() !== '' &&
            form.barangay.trim() !== '' &&
            form.phoneNumber.trim() !== ''
        );
    };

    const isStep2Valid = () => {
        return form.disability.trim() !== '' && form.pwdId.trim() !== '' && form.dateIssued !== '';
    };

    const fetchMembers = async () => {
        const response = await fetch(`${apiBaseUrl}/members`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
            setMembers(await response.json());
            setCurrentPage(1);
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
            // setStatus('Member created successfully.');
            setForm({
                fname: '',
                lname: '',
                mname: '',
                bday: '',
                disability: '',
                barangay: '',
                phoneNumber: '',
                address: '',
                isBedridden: false,
                pwdId: '',
                dateIssued: '',
                gender: ''
            });
            setOtherDisability('');
            setIsModalOpen(false);
            setStep(1);
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
                        onClick={() => {
                            setForm({
                                fname: '',
                                lname: '',
                                mname: '',
                                bday: '',
                                disability: '',
                                barangay: '',
                                phoneNumber: '',
                                address: '',
                                isBedridden: false,
                                pwdId: '',
                                dateIssued: '',
                                gender: ''
                            });
                            setStatus(null);
                            setStep(1);
                            setIsModalOpen(true);
                        }}
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
                                    Full Name
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    PWD ID
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    Disability
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    Barangay
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    Phone
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
                                // client-side pagination
                                members
                                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                    .map((member) => (
                                        <tr
                                            key={member.id}
                                            className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                            onClick={() => router.push(`/members/${member.id}`)}
                                        >
                                            <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                                {[member.fname, member.mname, member.lname].filter(Boolean).join(' ')}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{member.pwdId}</td>
                                            <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{member.disability}</td>
                                            <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{member.barangay ?? '-'}</td>
                                            <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{member.phoneNumber}</td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination controls */}
                {members.length > pageSize ? (
                    <div className="flex items-center justify-end gap-3 px-4 py-3">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="rounded-md border px-3 py-1 text-sm"
                            disabled={currentPage === 1}
                        >
                            Prev
                        </button>

                        <span className="text-sm text-slate-600 dark:text-slate-400">Page {currentPage} of {Math.ceil(members.length / pageSize)}</span>

                        <button
                            onClick={() => setCurrentPage((p) => Math.min(Math.ceil(members.length / pageSize), p + 1))}
                            className="rounded-md border px-3 py-1 text-sm"
                            disabled={currentPage === Math.ceil(members.length / pageSize)}
                        >
                            Next
                        </button>
                    </div>
                ) : null}
            </div>

            {isModalOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm !mt-0"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="add-member-title"
                        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 max-h-[90vh] overflow-hidden"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-700">
                            <div>
                                <h3 id="add-member-title" className="text-xl font-semibold text-slate-900 dark:text-white">
                                    Add Member
                                </h3>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Step {step} of 2 — {step === 1 ? 'Personal info' : 'PWD details'}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setStep(1);
                                }}
                                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={createMember} className="space-y-5 px-6 py-6 overflow-y-auto max-h-[72vh]">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {step === 1 ? (
                                    <>
                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">First Name <span className="text-red-500">*</span></span>
                                            <input
                                                value={form.fname}
                                                onChange={(event) => setForm({ ...form, fname: event.target.value })}
                                                placeholder="First name"
                                                className={cn(
                                                    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 outline-none transition',
                                                    'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                                                    'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400'
                                                )}
                                                required
                                            />
                                        </label>

                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Name <span className="text-red-500">*</span></span>
                                            <input
                                                value={form.lname}
                                                onChange={(event) => setForm({ ...form, lname: event.target.value })}
                                                placeholder="Last name"
                                                className={cn(
                                                    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 outline-none transition',
                                                    'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                                                    'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400'
                                                )}
                                                required
                                            />
                                        </label>

                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Middle Name</span>
                                            <input
                                                value={form.mname}
                                                onChange={(event) => setForm({ ...form, mname: event.target.value })}
                                                placeholder="Middle name (optional)"
                                                className={cn(
                                                    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 outline-none transition',
                                                    'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                                                    'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400'
                                                )}
                                            />
                                        </label>

                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Birthday <span className="text-red-500">*</span></span>
                                            <input
                                                type="date"
                                                value={form.bday}
                                                onChange={(event) => setForm({ ...form, bday: event.target.value })}
                                                className={cn(
                                                    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 outline-none transition',
                                                    'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                                                    'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400'
                                                )}
                                                required
                                            />
                                        </label>

                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Gender <span className="text-red-500">*</span></span>
                                            <select
                                                value={form.gender}
                                                onChange={(event) => setForm({ ...form, gender: event.target.value })}
                                                className={cn(
                                                    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition',
                                                    'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                                                    'dark:border-slate-600 dark:bg-slate-800 dark:text-white'
                                                )}
                                                required
                                            >
                                                <option value="">Select gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </label>

                                        <label className="space-y-2 sm:col-span-2">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Address <span className="text-red-500">*</span></span>
                                            <input
                                                value={form.address}
                                                onChange={(event) => setForm({ ...form, address: event.target.value })}
                                                placeholder="Complete address"
                                                className={cn(
                                                    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 outline-none transition',
                                                    'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                                                    'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400'
                                                )}
                                                required
                                            />
                                        </label>

                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Barangay <span className="text-red-500">*</span></span>
                                            <select
                                                value={form.barangay}
                                                onChange={(e) => setForm({ ...form, barangay: e.target.value })}
                                                className={cn(
                                                    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition',
                                                    'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                                                    'dark:border-slate-600 dark:bg-slate-800 dark:text-white'
                                                )}
                                                required
                                            >
                                                <option value="">Select barangay</option>
                                                {BARANGAYS.map((b) => (
                                                    <option key={b} value={b}>{b}</option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number <span className="text-red-500">*</span></span>
                                            <input
                                                value={form.phoneNumber}
                                                onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })}
                                                placeholder="09xxxxxxxxx"
                                                className={cn(
                                                    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 outline-none transition',
                                                    'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                                                    'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400'
                                                )}
                                                required
                                            />
                                        </label>
                                    </>
                                ) : (
                                    <>
                                        <label className="space-y-2 sm:col-span-2">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Disability <span className="text-red-500">*</span></span>
                                            <select
                                                value={DISABILITIES.includes(form.disability) ? form.disability : (otherDisability ? 'Other' : '')}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'Other') {
                                                        setForm({ ...form, disability: '' });
                                                    } else {
                                                        setForm({ ...form, disability: val });
                                                        setOtherDisability('');
                                                    }
                                                }}
                                                className={cn(
                                                    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition',
                                                    'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                                                    'dark:border-slate-600 dark:bg-slate-800 dark:text-white'
                                                )}
                                                required
                                            >
                                                <option value="">Select disability</option>
                                                {DISABILITIES.map((d) => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>

                                            {(!DISABILITIES.includes(form.disability)) || (otherDisability) ? (
                                                <input
                                                    value={otherDisability || form.disability}
                                                    onChange={(e) => {
                                                        setOtherDisability(e.target.value);
                                                        setForm({ ...form, disability: e.target.value });
                                                    }}
                                                    placeholder="Specify disability"
                                                    className={cn(
                                                        'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 outline-none transition mt-2',
                                                        'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                                                        'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400'
                                                    )}
                                                />
                                            ) : null}
                                        </label>

                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Is Bedridden <span className="text-red-500">*</span></span>
                                            <select
                                                value={form.isBedridden ? 'yes' : 'no'}
                                                onChange={(event) =>
                                                    setForm({
                                                        ...form,
                                                        isBedridden: event.target.value === 'yes'
                                                    })
                                                }
                                                className={cn(
                                                    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition',
                                                    'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                                                    'dark:border-slate-600 dark:bg-slate-800 dark:text-white'
                                                )}
                                                required
                                            >
                                                <option value="no">No</option>
                                                <option value="yes">Yes</option>
                                            </select>
                                        </label>

                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">PWD ID <span className="text-red-500">*</span></span>
                                            <input
                                                value={form.pwdId}
                                                onChange={(event) => setForm({ ...form, pwdId: event.target.value })}
                                                placeholder="PWD ID number"
                                                className={cn(
                                                    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 outline-none transition',
                                                    'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                                                    'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400'
                                                )}
                                                required
                                            />
                                        </label>

                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Date Issued <span className="text-red-500">*</span></span>
                                            <input
                                                type="date"
                                                value={form.dateIssued}
                                                onChange={(event) => setForm({ ...form, dateIssued: event.target.value })}
                                                className={cn(
                                                    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition',
                                                    'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                                                    'dark:border-slate-600 dark:bg-slate-800 dark:text-white'
                                                )}
                                                required
                                            />
                                        </label>
                                    </>
                                )}
                            </div>

                            {status ? <p className="text-sm text-slate-600 dark:text-slate-400">{status}</p> : null}

                            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsModalOpen(false);
                                            setStep(1);
                                        }}
                                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        Cancel
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    {step > 1 ? (
                                        <button
                                            type="button"
                                            onClick={() => setStep((s) => Math.max(1, s - 1))}
                                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            Back
                                        </button>
                                    ) : null}

                                    {step === 1 ? (
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            disabled={!isStep1Valid()}
                                            className={cn(
                                                'rounded-lg px-5 py-2 text-sm font-semibold text-white transition',
                                                'bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500',
                                                !isStep1Valid() && 'opacity-50 cursor-not-allowed'
                                            )}
                                        >
                                            Next
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={!isStep2Valid()}
                                            className={cn(
                                                'rounded-lg px-5 py-2 text-sm font-semibold text-white transition',
                                                'bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500',
                                                !isStep2Valid() && 'opacity-50 cursor-not-allowed'
                                            )}
                                        >
                                            Create Member
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
