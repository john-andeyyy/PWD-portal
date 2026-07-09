'use client';

import { useEffect, useState } from 'react';
import { Accessibility, BriefcaseBusiness, Shield, Users } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Badge, Card, Skeleton } from '@/components/ui/primitives';
import { apiBaseUrl } from '@/lib/api';

interface DashboardStats {
    total: number;
    byDisability: Array<{ disability: string; count: number }>;
}

interface PagerResponse<T> {
    data: T[];
    total: number;
}

function DashboardContent({ token }: { token: string }) {
    const [memberStats, setMemberStats] = useState<DashboardStats | null>(null);
    const [accountsTotal, setAccountsTotal] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchDashboard = async () => {
            setIsLoading(true);
            const headers = { Authorization: `Bearer ${token}` };
            const [memberResponse, presidentResponse] = await Promise.all([
                fetch(`${apiBaseUrl}/members/stats`, { headers }),
                fetch(`${apiBaseUrl}/presidents?page=1&limit=1`, { headers }),
                fetch(`${apiBaseUrl}/roles?page=1&limit=1`, { headers }),
            ]);

            if (cancelled) return;

            if (memberResponse.ok) {
                setMemberStats(await memberResponse.json());
            }

            if (presidentResponse.ok) {
                const data = (await presidentResponse.json()) as PagerResponse<unknown>;
                setAccountsTotal(Number(data.total) || 0);
            }

            setIsLoading(false);
        };

        fetchDashboard().catch(() => setIsLoading(false));

        return () => {
            cancelled = true;
        };
    }, [token]);

    const disabilityTypes = memberStats?.byDisability ?? [];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard icon={<Users size={18} />} label="Total PWD Members" value={memberStats?.total} loading={isLoading} />
                <SummaryCard icon={<Accessibility size={18} />} label="Total Disabilities" value={disabilityTypes.length} loading={isLoading} />
                <SummaryCard icon={<BriefcaseBusiness size={18} />} label="Total Accounts" value={accountsTotal} loading={isLoading} />
                <SummaryCard icon={<Shield size={18} />} label="Total Presidents" value={accountsTotal} loading={isLoading} />
            </div>

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
                    <div className="mt-5 rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        No disability statistics are available yet.
                    </div>
                )}
            </Card>
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

