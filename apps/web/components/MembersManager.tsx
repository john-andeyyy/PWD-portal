'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@pwd/ui';
import { hasPermission } from '@/lib/rbac';
import { parseMemberImportText, type MemberImportRow } from '@/lib/member-import';
import { focusFirstInvalidField, friendlyError, isFutureDate, isValidPhilippineMobile, MOBILE_HELP, normalizeNumericInput } from '@/lib/validation';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

interface Member {
    id: string;
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

type MemberFormErrors = Partial<Record<keyof MemberFormState | 'form', string>>;

const EMPTY_MEMBER_FORM: MemberFormState = {
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
};

const formatDateDisplay = (value?: string | null) => {
    if (!value) {
        return '-';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return '-';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(parsedDate).replace(',', '');
};

interface MembersManagerProps {
    token: string;
}

interface MeResponse {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
}

interface MembersPager {
    data: Member[];
    total: number;
    page: number;
    limit: number;
}

interface MemberFilterOptions {
    barangays: string[];
    disabilities: string[];
}

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

export function MembersManager({ token }: MembersManagerProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [status, setStatus] = useState<string | null>(null);
    const [importRows, setImportRows] = useState<MemberImportRow[]>([]);
    const [importMessage, setImportMessage] = useState<string | null>(null);
    const [importErrors, setImportErrors] = useState<string[]>([]);
    const [importWarnings, setImportWarnings] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [isSubmittingMember, setIsSubmittingMember] = useState(false);
    const [formErrors, setFormErrors] = useState<MemberFormErrors>({});
    const [form, setForm] = useState<MemberFormState>(EMPTY_MEMBER_FORM);
    const [otherDisability, setOtherDisability] = useState('');
    const [isOtherDisabilitySelected, setIsOtherDisabilitySelected] = useState(false);
    const [user, setUser] = useState<MeResponse | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [memberSearch, setMemberSearch] = useState('');
    const [memberBarangay, setMemberBarangay] = useState('');
    const [memberDisability, setMemberDisability] = useState('');
    const [memberBedridden, setMemberBedridden] = useState('');
    const [isEditingMember, setIsEditingMember] = useState(false);
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [pager, setPager] = useState<MembersPager>({ data: [], total: 0, page: 1, limit: 10 });
    const [memberFilterOptions, setMemberFilterOptions] = useState<MemberFilterOptions>({ barangays: [], disabilities: [] });

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
    const isPresetDisability = (disability: string) => DISABILITIES.includes(disability) && disability !== 'Other';
    const usesOtherDisability = (disability: string) => disability.trim() !== '' && !isPresetDisability(disability);

    const resetMemberForm = () => {
        setForm(EMPTY_MEMBER_FORM);
        setOtherDisability('');
        setIsOtherDisabilitySelected(false);
        setFormErrors({});
        setIsEditingMember(false);
        setEditingMemberId(null);
    };

    const buildMemberQuery = () => {
        const params = new URLSearchParams();

        if (memberSearch.trim()) {
            params.set('search', memberSearch.trim());
        }

        if (memberBarangay.trim()) {
            params.set('barangay', memberBarangay.trim());
        }

        if (memberDisability.trim()) {
            params.set('disability', memberDisability.trim());
        }

        if (memberBedridden) {
            params.set('isBedridden', memberBedridden);
        }

        params.set('page', String(currentPage));
        params.set('limit', String(pageSize));
        params.set('sortBy', 'lname');
        params.set('sortOrder', 'asc');

        return params.toString();
    };

    const resetImportState = () => {
        setImportRows([]);
        setImportMessage(null);
        setImportErrors([]);
        setImportWarnings([]);
    };

    const isStep1Valid = () => {
        return (
            form.fname.trim() !== '' &&
            form.lname.trim() !== '' &&
            form.bday !== '' &&
            form.gender !== '' &&
            form.address.trim() !== '' &&
            form.barangay.trim() !== '' &&
            isValidPhilippineMobile(form.phoneNumber)
        );
    };

    const isStep2Valid = () => {
        return form.disability.trim() !== '' && form.pwdId.trim() !== '' && form.dateIssued !== '' && !isFutureDate(form.dateIssued);
    };

    const fetchMembers = async () => {
        const queryString = buildMemberQuery();
        const response = await fetch(`${apiBaseUrl}/members${queryString ? `?${queryString}` : ''}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
            setStatus(await parseApiError(response));
            return;
        }

        const data = await response.json();
        const list = Array.isArray(data) ? data : data.data;
        setMembers(Array.isArray(list) ? list : []);
        setPager(
            Array.isArray(data)
                ? { data: list, total: list.length, page: 1, limit: list.length || pageSize }
                : {
                    data: Array.isArray(data.data) ? data.data : [],
                    total: Number(data.total) || 0,
                    page: Number(data.page) || currentPage,
                    limit: Number(data.limit) || pageSize,
                },
        );
    };

    const fetchMemberFilterOptions = async () => {
        const response = await fetch(`${apiBaseUrl}/members/filter-options`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
            return;
        }

        const data = await response.json();
        setMemberFilterOptions({
            barangays: Array.isArray(data?.barangays) ? data.barangays : [],
            disabilities: Array.isArray(data?.disabilities) ? data.disabilities : [],
        });
    };

    const fetchMe = async () => {
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
            setStatus('Unable to load account permissions.');
            return;
        }
        setUser(await response.json());
    };

    useEffect(() => {
        if (token) {
            fetchMe();
            fetchMemberFilterOptions();
        }
    }, [token]);

    useEffect(() => {
        if (!token) {
            return;
        }

        fetchMembers();
    }, [token, memberSearch, memberBarangay, memberDisability, memberBedridden, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [memberSearch, memberBarangay, memberDisability, memberBedridden]);

    const createMemberFromPayload = async (payload: MemberImportRow['payload']) => {
        if (!payload) {
            throw new Error('Missing import payload.');
        }

        return fetch(`${apiBaseUrl}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
    };

    const handleImportRows = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        setStatus(`Parsing ${file.name}...`);
        setImportMessage(null);
        setImportErrors([]);
        setImportWarnings([]);

        try {
            const text = await file.text();
            const parsed = parseMemberImportText(text);
            const validRows = parsed.rows.filter((row) => row.payload && row.errors.length === 0);
            const skippedRows = parsed.rows.filter((row) => !row.payload || row.errors.length > 0);
            const warnings = parsed.rows.flatMap((row) => row.warnings.map((warning) => `Row ${row.rowNumber}: ${warning}`));

            if (parsed.rows.length === 0) {
                setStatus('No rows were found in the uploaded file.');
                resetImportState();
                return;
            }

            if (validRows.length === 0) {
                setStatus('No valid member rows were found in the uploaded file.');
                setImportRows(parsed.rows);
                setImportMessage(`Parsed ${parsed.rows.length} row(s) from ${file.name}, but none were ready to insert.`);
                setImportErrors(skippedRows.slice(0, 5).flatMap((row) => [`Row ${row.rowNumber}: ${[...row.errors, ...row.warnings].join(' ')}`]));
                setImportWarnings(warnings.slice(0, 5));
                return;
            }

            setIsImporting(true);

            let insertedCount = 0;
            const failedRows: string[] = [];

            for (const row of validRows) {
                const response = await createMemberFromPayload(row.payload);
                if (response.ok) {
                    insertedCount += 1;
                    continue;
                }

                const errorText = await parseApiError(response);
                failedRows.push(`Row ${row.rowNumber}: ${errorText || 'failed to insert'}`);
            }

            const skippedCount = skippedRows.length;
            const summary = `Imported ${insertedCount} row(s) from ${file.name}. ${skippedCount} skipped.`;
            setStatus(summary);
            setImportMessage(summary);
            setImportRows(parsed.rows);
            setImportErrors(failedRows.slice(0, 5));
            setImportWarnings(warnings.slice(0, 5));
            await Promise.all([fetchMembers(), fetchMemberFilterOptions()]);
        } catch (error) {
            setStatus('Failed to import the uploaded file.');
            setImportMessage('Failed to import the uploaded file.');
            setImportErrors([error instanceof Error ? error.message : 'Unknown import error']);
            setImportWarnings([]);
        } finally {
            setIsImporting(false);
        }
    };

    const canViewMembers = hasPermission(user?.permissions, 'members.view');
    const canCreateMembers = hasPermission(user?.permissions, 'members.create');

    if (!user) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
                <p className="text-slate-600 dark:text-slate-400">Loading permissions...</p>
            </div>
        );
    }

    if (!canViewMembers) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Access restricted</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">You do not have permission to view members on this page.</p>
            </div>
        );
    }

    const openCreateMemberModal = () => {
        resetMemberForm();
        setStatus(null);
        setStep(1);
        setIsModalOpen(true);
    };

    const openEditMemberModal = (member: Member) => {
        setForm({
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
            gender: member.gender
        });
        setOtherDisability(usesOtherDisability(member.disability) ? member.disability : '');
        setIsOtherDisabilitySelected(usesOtherDisability(member.disability));
        setIsEditingMember(true);
        setEditingMemberId(member.id);
        setStatus(null);
        setStep(1);
        setIsModalOpen(true);
    };

    const closeMemberModal = () => {
        setIsModalOpen(false);
        setStep(1);
        resetMemberForm();
    };

    const validateMemberForm = () => {
        const nextErrors: MemberFormErrors = {};
        if (!form.fname.trim()) nextErrors.fname = 'First name is required.';
        if (!form.lname.trim()) nextErrors.lname = 'Last name is required.';
        if (!form.bday) nextErrors.bday = 'Birthday is required.';
        else if (isFutureDate(form.bday)) nextErrors.bday = 'Birthday must not be a future date.';
        if (!form.gender) nextErrors.gender = 'Gender is required.';
        if (!form.address.trim()) nextErrors.address = 'Address is required.';
        if (!form.barangay.trim()) nextErrors.barangay = 'Barangay is required.';
        if (!form.phoneNumber.trim()) nextErrors.phoneNumber = 'Phone number is required.';
        else if (!isValidPhilippineMobile(form.phoneNumber)) nextErrors.phoneNumber = MOBILE_HELP;
        if (!form.disability.trim()) nextErrors.disability = 'Disability is required.';
        if (!form.pwdId.trim()) nextErrors.pwdId = 'PWD ID is required.';
        if (!form.dateIssued) nextErrors.dateIssued = 'Date issued is required.';
        else if (isFutureDate(form.dateIssued)) nextErrors.dateIssued = 'Date issued must not be a future date.';
        return nextErrors;
    };

    const updateMemberForm = (nextForm: MemberFormState) => {
        setForm(nextForm);
        setFormErrors({});
    };

    const submitMember = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextErrors = validateMemberForm();
        setFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setStatus('Please fix the highlighted fields.');
            setStep(nextErrors.fname || nextErrors.lname || nextErrors.bday || nextErrors.gender || nextErrors.address || nextErrors.barangay || nextErrors.phoneNumber ? 1 : 2);
            focusFirstInvalidField(nextErrors);
            return;
        }

        setIsSubmittingMember(true);
        setStatus(isEditingMember ? 'Updating member...' : 'Creating member...');
        const response = await fetch(
            isEditingMember && editingMemberId !== null
                ? `${apiBaseUrl}/members/${editingMemberId}`
                : `${apiBaseUrl}/members`,
            {
                method: isEditingMember ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(form)
            }
        );

        if (response.ok) {
            setStatus(isEditingMember ? 'Member updated successfully.' : 'Member created successfully.');
            closeMemberModal();
            await Promise.all([fetchMembers(), fetchMemberFilterOptions()]);
            setIsSubmittingMember(false);
            return;
        }
        const errorMessage = friendlyError(await parseApiError(response));
        setStatus(isEditingMember ? `Failed to update member: ${errorMessage}` : `Failed to create member: ${errorMessage}`);
        setFormErrors({ form: errorMessage });
        setIsSubmittingMember(false);
    };
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Member Management</h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Browse the current roster, add new members, or import rows from a CSV or tab-separated file.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {members.length} members
                    </span>
                    {canCreateMembers ? (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isImporting}
                            className={cn(
                                'rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition',
                                'hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40',
                                'dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
                                isImporting && 'cursor-not-allowed opacity-60'
                            )}
                        >
                            {isImporting ? 'Importing...' : 'Import CSV'}
                        </button>
                    ) : null}
                    {canCreateMembers ? (
                        <button
                            type="button"
                            onClick={openCreateMemberModal}
                            className={cn(
                                'rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition',
                                'hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40',
                                'dark:bg-sky-600 dark:hover:bg-sky-500'
                            )}
                        >
                            Add Member
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40 lg:grid-cols-5">
                <label className="space-y-2 lg:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Search</span>
                    <input
                        value={memberSearch}
                        onChange={(event) => setMemberSearch(event.target.value)}
                        placeholder="Search by name, PWD ID, or phone"
                        className={cn(
                            'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 outline-none transition',
                            'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                            'dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder-slate-400'
                        )}
                    />
                </label>

                <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Barangay</span>
                    <select
                        value={memberBarangay}
                        onChange={(event) => setMemberBarangay(event.target.value)}
                        className={cn(
                            'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition',
                            'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                            'dark:border-slate-600 dark:bg-slate-900 dark:text-white'
                        )}
                    >
                        <option value="">All barangays</option>
                        {memberFilterOptions.barangays.map((barangay) => (
                            <option key={barangay} value={barangay}>
                                {barangay}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Disability</span>
                    <select
                        value={memberDisability}
                        onChange={(event) => setMemberDisability(event.target.value)}
                        className={cn(
                            'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition',
                            'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                            'dark:border-slate-600 dark:bg-slate-900 dark:text-white'
                        )}
                    >
                        <option value="">All disabilities</option>
                        {memberFilterOptions.disabilities.map((disability) => (
                            <option key={disability} value={disability}>
                                {disability}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Bedridden</span>
                    <select
                        value={memberBedridden}
                        onChange={(event) => setMemberBedridden(event.target.value)}
                        className={cn(
                            'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition',
                            'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                            'dark:border-slate-600 dark:bg-slate-900 dark:text-white'
                        )}
                    >
                        <option value="">All</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>
                </label>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
                className="hidden"
                onChange={handleImportRows}
            />

            {importMessage ? (
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100">
                    <p className="font-medium">{importMessage}</p>
                    {importErrors.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs text-sky-800 dark:text-sky-200">
                            {importErrors.map((error) => (
                                <li key={error}>{error}</li>
                            ))}
                        </ul>
                    ) : null}
                    {importWarnings.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs text-sky-800 dark:text-sky-200">
                            {importWarnings.map((warning) => (
                                <li key={warning}>{warning}</li>
                            ))}
                        </ul>
                    ) : null}
                    {importRows.length > 0 ? (
                        <p className="mt-2 text-xs text-sky-800/80 dark:text-sky-200/80">
                            Parsed {importRows.length} row(s). Blank bedridden values are saved as false.
                        </p>
                    ) : null}
                </div>
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Members Table</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Filtered members are shown here.</p>
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
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    Date Issued
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                            {members.length === 0 ? (
                                <tr>
                                    <td className="px-5 py-10 text-sm text-slate-600 dark:text-slate-400" colSpan={7}>
                                        No members matched the current search and filters.
                                    </td>
                                </tr>
                            ) : (
                                members
                                    .map((member) => (
                                        <tr
                                            key={member.id}
                                            className="transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                        >
                                            <td
                                                className="cursor-pointer px-5 py-4 text-sm font-medium text-slate-900 dark:text-white"
                                                onClick={() => router.push(`/members/${member.id}`)}
                                            >
                                                {[member.fname, member.mname, member.lname].filter(Boolean).join(' ')}
                                            </td>
                                            <td className="cursor-pointer px-5 py-4 text-sm text-slate-600 dark:text-slate-300" onClick={() => router.push(`/members/${member.id}`)}>{member.pwdId}</td>
                                            <td className="cursor-pointer px-5 py-4 text-sm text-slate-600 dark:text-slate-300" onClick={() => router.push(`/members/${member.id}`)}>{member.disability}</td>
                                            <td className="cursor-pointer px-5 py-4 text-sm text-slate-600 dark:text-slate-300" onClick={() => router.push(`/members/${member.id}`)}>{member.barangay ?? '-'}</td>
                                            <td className="cursor-pointer px-5 py-4 text-sm text-slate-600 dark:text-slate-300" onClick={() => router.push(`/members/${member.id}`)}>{member.phoneNumber}</td>
                                            <td className="cursor-pointer px-5 py-4 text-sm text-slate-600 dark:text-slate-300" onClick={() => router.push(`/members/${member.id}`)}>{formatDateDisplay(member.dateIssued)}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            router.push(`/members/${member.id}`);
                                                        }}
                                                        className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                                    >
                                                        View
                                                    </button>
                                                    {hasPermission(user?.permissions, 'members.update') ? (
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                openEditMemberModal(member);
                                                            }}
                                                            className="rounded-md bg-sky-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500"
                                                        >
                                                            Update
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination controls */}
                {pager.total > pager.limit ? (
                    <div className="flex items-center justify-end gap-3 px-4 py-3">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="rounded-md border px-3 py-1 text-sm"
                            disabled={currentPage === 1}
                        >
                            Prev
                        </button>

                        <span className="text-sm text-slate-600 dark:text-slate-400">Page {currentPage} of {Math.max(1, Math.ceil(pager.total / pager.limit))}</span>

                        <button
                            onClick={() => setCurrentPage((p) => Math.min(Math.max(1, Math.ceil(pager.total / pager.limit)), p + 1))}
                            className="rounded-md border px-3 py-1 text-sm"
                            disabled={currentPage === Math.max(1, Math.ceil(pager.total / pager.limit))}
                        >
                            Next
                        </button>
                    </div>
                ) : null}
            </div>

            {isModalOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm !mt-0"
                    onClick={closeMemberModal}
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
                                    {isEditingMember ? 'Update Member' : 'Add Member'}
                                </h3>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Step {step} of 2 - {step === 1 ? 'Personal info' : 'PWD details'}</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeMemberModal}
                                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                                aria-label="Close modal"
                            >
                                x
                            </button>
                        </div>

                        <form onSubmit={submitMember} className="space-y-5 px-6 py-6 overflow-y-auto max-h-[72vh]">
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
                                                onChange={(event) => updateMemberForm({ ...form, phoneNumber: normalizeNumericInput(event.target.value) })}
                                                placeholder="09XXXXXXXXX"
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={11}
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
                                                value={isPresetDisability(form.disability) ? form.disability : (isOtherDisabilitySelected ? 'Other' : '')}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'Other') {
                                                        setIsOtherDisabilitySelected(true);
                                                        setForm({ ...form, disability: otherDisability });
                                                    } else {
                                                        setIsOtherDisabilitySelected(false);
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

                                            {isOtherDisabilitySelected ? (
                                                <input
                                                    value={otherDisability}
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
                                        onClick={closeMemberModal}
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
                                            disabled={!isStep2Valid() || isSubmittingMember}
                                            className={cn(
                                                'rounded-lg px-5 py-2 text-sm font-semibold text-white transition',
                                                'bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500',
                                                (!isStep2Valid() || isSubmittingMember) && 'opacity-50 cursor-not-allowed'
                                            )}
                                        >
                                            {isSubmittingMember ? (isEditingMember ? 'Updating member...' : 'Creating member...') : (isEditingMember ? 'Update Member' : 'Create Member')}
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




