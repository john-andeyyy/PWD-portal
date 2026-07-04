'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@pwd/ui';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const endpoint = `${apiBaseUrl}/auth/login`;

export function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState('president@pwd.org');
    const [password, setPassword] = useState('Password123!');
    const [status, setStatus] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus('Signing in...');
        setIsLoading(true);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const body = await response.json();
            setStatus(body?.message || 'Login failed.');
            setIsLoading(false);
            return;
        }

        const data = await response.json();
        if (data.accessToken) {
            localStorage.setItem('auth_token', data.accessToken);
            setStatus('Login successful. Redirecting...');
            router.push('/dashboard');
            return;
        }

        setStatus('Login successful, but no token received.');
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={cn(
                            'rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition',
                            'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                            'dark:border-slate-600 dark:bg-slate-800 dark:text-white'
                        )}
                        required
                        disabled={isLoading}
                    />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={cn(
                            'rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition',
                            'focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
                            'dark:border-slate-600 dark:bg-slate-800 dark:text-white'
                        )}
                        required
                        disabled={isLoading}
                    />
                </label>
            </div>
            <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-sky-500 px-4 py-2.5 font-medium text-white transition hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-sky-600 dark:hover:bg-sky-700"
            >
                {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
            {status ? <p className="text-center text-sm text-slate-600 dark:text-slate-400">{status}</p> : null}
        </form>
    );
}
