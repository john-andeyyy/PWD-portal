'use client';

import { useEffect, useMemo, useState } from 'react';
import { Accessibility, BarChart3, BriefcaseBusiness, Filter, Shield, Users } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Badge, Card, SelectInput, Skeleton } from '@/components/ui/primitives';
import { apiBaseUrl } from '@/lib/api';

interface DashboardStats {
    total: number;
    byDisability: Array<{ disability: string; count: number }>;
    byBarangay: Array<{ barangay: string; count: number }>;
}

interface FilterOptions {
    barangays: string[];
    disabilities: string[];
}

interface PagerResponse<T> {
    data: T[];
    total: number;
}

function DashboardContent({ token }: { token: string }) {
    const [memberStats, setMemberStats] = useState<DashboardStats | null>(null);
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({ barangays: [], disabilities: [] });
    const [selectedBarangay, setSelectedBarangay] = useState('');
    const [accountsTotal, setAccountsTotal] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchStaticDashboardData = async () => {
            const headers = { Authorization: `Bearer ${token}` };
            const [presidentResponse, filterResponse] = await Promise.all([
                fetch(`${apiBaseUrl}/presidents?page=1&limit=1`, { headers }),
                fetch(`${apiBaseUrl}/members/filter-options`, { headers }),
            ]);

            if (cancelled) return;

            if (presidentResponse.ok) {
                const data = (await presidentResponse.json()) as PagerResponse<unknown>;
                setAccountsTotal(Number(data.total) || 0);
            }

            if (filterResponse.ok) {
                setFilterOptions(await filterResponse.json());
            }
        };

        fetchStaticDashboardData().catch(() => undefined);

        return () => {
            cancelled = true;
        };
    }, [token]);

    useEffect(() => {
        let cancelled = false;

        const fetchStats = async () => {
            setIsLoading(true);
            const headers = { Authorization: `Bearer ${token}` };
            const params = new URLSearchParams();
            if (selectedBarangay) params.set('barangay', selectedBarangay);

            const response = await fetch(`${apiBaseUrl}/members/stats${params.size ? `?${params.toString()}` : ''}`, { headers });

            if (cancelled) return;

            if (response.ok) {
                setMemberStats(await response.json());
            }

            setIsLoading(false);
        };

        fetchStats().catch(() => {
            if (!cancelled) setIsLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [selectedBarangay, token]);

    const disabilityTypes = memberStats?.byDisability ?? [];
    const barangayCounts = memberStats?.byBarangay ?? [];
    const topDisability = disabilityTypes[0];
    const chartTitle = selectedBarangay ? `Disability Graph in ${selectedBarangay}` : 'Disability Graph';
    const filteredLabel = selectedBarangay || 'All barangays';

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard icon={<Users size={18} />} label="Total PWD Members" value={memberStats?.total} loading={isLoading} />
                <SummaryCard icon={<Accessibility size={18} />} label="Total Disabilities" value={disabilityTypes.length} loading={isLoading} />
                <SummaryCard icon={<BriefcaseBusiness size={18} />} label="Total Accounts" value={accountsTotal} loading={accountsTotal === null} />
                <SummaryCard icon={<Shield size={18} />} label="Total Presidents" value={accountsTotal} loading={accountsTotal === null} />
            </div>

            <Card className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-slate-950 dark:text-white">
                            <BarChart3 className="h-5 w-5" aria-hidden="true" />
                            <h2 className="text-base font-semibold">{chartTitle}</h2>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Sorted count of PWD members by disability type. Highest count appears first.
                        </p>
                    </div>
                    <label className="w-full max-w-xs text-sm font-medium text-slate-700 dark:text-slate-300">
                        <span className="mb-2 flex items-center gap-2"><Filter className="h-4 w-4" aria-hidden="true" />Barangay filter</span>
                        <SelectInput value={selectedBarangay} onChange={(event) => setSelectedBarangay(event.target.value)}>
                            <option value="">All barangays</option>
                            {filterOptions.barangays.map((barangay) => (
                                <option key={barangay} value={barangay}>{barangay}</option>
                            ))}
                        </SelectInput>
                    </label>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Badge tone="info">{filteredLabel}</Badge>
                    {topDisability ? <Badge tone="success">Highest: {topDisability.disability} ({topDisability.count})</Badge> : null}
                </div>

                {isLoading ? (
                    <ChartSkeleton />
                ) : disabilityTypes.length > 0 ? (
                    <HorizontalBarChart items={disabilityTypes.map((item) => ({ label: item.disability, count: item.count }))} />
                ) : (
                    <EmptyStatsMessage message="No disability statistics are available for this barangay." />
                )}
            </Card>

            <Card className="p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-950 dark:text-white">Barangay Breakdown</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">PWD member counts by barangay for quick comparison.</p>
                    </div>
                    <Badge tone="info">{barangayCounts.length} barangays</Badge>
                </div>

                {isLoading ? (
                    <ChartSkeleton />
                ) : barangayCounts.length > 0 ? (
                    <HorizontalBarChart items={barangayCounts.map((item) => ({ label: item.barangay, count: item.count }))} />
                ) : (
                    <EmptyStatsMessage message="No barangay statistics are available yet." />
                )}
            </Card>

            <Card className="p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-950 dark:text-white">Disability Breakdown</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Current count for every registered disability type.</p>
                    </div>
                    <Badge tone="info">{disabilityTypes.length} types</Badge>
                </div>

                {isLoading ? (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Skeleton key={index} className="h-20" />
                        ))}
                    </div>
                ) : disabilityTypes.length > 0 ? (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {disabilityTypes.map((item) => (
                            <div key={item.disability} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                <p className="line-clamp-1 text-sm font-medium text-slate-700 dark:text-slate-300">{item.disability}</p>
                                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{item.count}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyStatsMessage message="No disability statistics are available yet." />
                )}
            </Card>
        </div>
    );
}

function HorizontalBarChart({ items }: { items: Array<{ label: string; count: number }> }) {
    const maxCount = useMemo(() => Math.max(...items.map((item) => item.count), 1), [items]);

    return (
        <div className="mt-5 space-y-3">
            {items.map((item) => {
                const width = `${Math.max(8, Math.round((item.count / maxCount) * 100))}%`;

                return (
                    <div key={item.label} className="grid gap-2 md:grid-cols-[minmax(9rem,16rem)_1fr_4rem] md:items-center">
                        <div className="min-w-0 text-sm font-medium text-slate-700 dark:text-slate-300">
                            <span className="block truncate" title={item.label}>{item.label}</span>
                        </div>
                        <div className="h-9 rounded-lg bg-slate-100 p-1 dark:bg-slate-900" aria-hidden="true">
                            <div className="flex h-full items-center rounded-md bg-sky-600 px-3 text-xs font-semibold text-white transition-all dark:bg-sky-500" style={{ width }}>
                                {item.count}
                            </div>
                        </div>
                        <div className="text-right text-sm font-semibold text-slate-950 dark:text-white">{item.count}</div>
                    </div>
                );
            })}
        </div>
    );
}

function ChartSkeleton() {
    return (
        <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="grid gap-2 md:grid-cols-[minmax(9rem,16rem)_1fr_4rem] md:items-center">
                    <Skeleton className="h-5" />
                    <Skeleton className="h-9" />
                    <Skeleton className="h-5" />
                </div>
            ))}
        </div>
    );
}

function EmptyStatsMessage({ message }: { message: string }) {
    return (
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {message}
        </div>
    );
}

function SummaryCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value?: number | null; loading: boolean }) {
    return (
        <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {icon}
                </div>
                <Badge tone="neutral">Live</Badge>
            </div>
            <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">{label}</p>
            {loading ? <Skeleton className="mt-2 h-8 w-24" /> : <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{value ?? 0}</p>}
        </Card>
    );
}

export default function DashboardPage() {
    return (
        <AppShell title="Dashboard" description="Monitor PWD records, disability totals, and account coverage.">
            {(token) => <DashboardContent token={token} />}
        </AppShell>
    );
}
