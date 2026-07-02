'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MembersManager } from '@/components/MembersManager';

export default function MembersPage() {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);

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
        <main className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950">
            <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-10 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Members Dashboard</h1>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Manage PWD members and their information</p>
                </div>
                <MembersManager token={token} />
            </div>
        </main>
    );
}
