'use client';

import { useState } from 'react';
import { cn } from '@pwd/ui';

const endpoint = '/api/auth/login';

interface LoginFormProps {
    onSuccess: (token: string) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
    const [email, setEmail] = useState('president@pwd.org');
    const [password, setPassword] = useState('Password123!');
    const [status, setStatus] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus('Signing in...');

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const body = await response.json();
            setStatus(body?.message || 'Login failed.');
            return;
        }

        const data = await response.json();
        if (data.accessToken) {
            onSuccess(data.accessToken);
            setStatus('Login successful.');
            return;
        }

        setStatus('Login successful, but no token received.');
    };

    return (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid gap-4">
                <label className="grid gap-2 text-sm text-slate-300">
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={cn('rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400')}
                        required
                    />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                    Password
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={cn('rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400')}
                        required
                    />
                </label>
            </div>
            <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 text-base font-semibold text-slate-950 transition hover:bg-sky-400"
            >
                Sign in
            </button>
            {status ? <p className="text-sm text-slate-300">{status}</p> : null}
        </form>
    );
}
