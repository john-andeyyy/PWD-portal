'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MembersManager } from '@/components/MembersManager';
import { AccountsManager } from '@/components/AccountsManager';
import { Sidebar } from '@/components/Sidebar';

type Panel = 'dashboard' | 'list' | 'accounts';

export default function DashboardPage() {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [panel] = useState<Panel>('dashboard');

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        router.push('/');
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        if (!storedToken) {
            router.push('/');
        } else {
            setToken(storedToken);
        }
    }, [router]);

    if (!token) {
        return null;
    }

    return (
        <main className="h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
            <div className="lg:flex lg:h-full lg:overflow-hidden">
                <Sidebar onLogout={handleLogout} />

                <section className="flex-1 overflow-y-auto p-4 sm:p-6 lg:ml-80">
                    <div className="min-h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/20 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/20 sm:p-8">
                        <div className="mb-8">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                        Authenticated area
                                    </p>
                                    <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                                        {panel === 'dashboard'
                                            ? 'Dashboard'
                                            : panel === 'list'
                                                ? 'Member List'
                                                : 'Accounts'}
                                    </h1>
                                </div>
                                <p className="max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                                    Use the sidebar to switch between dashboard views, member list, and account details.
                                </p>
                            </div>
                        </div>

                        {panel === 'dashboard' ? (
                            <div className="space-y-6">
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950">
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Quick overview</h2>
                                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                                        Welcome back! This dashboard gives you a quick view of the portal and member activity.
                                    </p>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Current section</p>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</p>
                                    </article>
                                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Members synced</p>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">-</p>
                                    </article>
                                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Account status</p>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Active</p>
                                    </article>
                                </div>
                            </div>
                        ) : panel === 'accounts' ? (
                            <AccountsManager token={token} />
                        ) : (
                            <MembersManager token={token} />
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
