'use client';

import { Sidebar } from '@/components/Sidebar';
import { MembersManager } from '@/components/MembersManager';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MembersPage() {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        if (!storedToken) {
            router.push('/');
            return;
        }

        setToken(storedToken);
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        router.push('/');
    };

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
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                Authenticated area
                            </p>
                            <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Member List</h1>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                                Browse and add members from this page.
                            </p>
                        </div>

                        <MembersManager token={token} />
                    </div>
                </section>
            </div>
        </main>
    );
}
