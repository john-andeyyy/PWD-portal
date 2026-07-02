'use client';

import { useState } from 'react';
import { LoginForm } from '../components/LoginForm';
import { MembersManager } from '../components/MembersManager';

export default function Home() {
    const [token, setToken] = useState<string | null>(null);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
            <div className="mx-auto max-w-5xl rounded-3xl border border-slate-700 bg-slate-900/80 p-10 shadow-2xl shadow-slate-950/50">
                <h1 className="text-4xl font-semibold text-white">PWD President Portal</h1>
                <p className="mt-3 text-slate-300">Login to manage members and access the PWD president dashboard.</p>
                {!token ? (
                    <LoginForm onSuccess={setToken} />
                ) : (
                    <MembersManager token={token} />
                )}
            </div>
        </main>
    );
}
