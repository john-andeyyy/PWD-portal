'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button, TextInput } from '@/components/ui/primitives';
import { apiBaseUrl, parseApiError } from '@/lib/api';

const endpoint = `${apiBaseUrl}/auth/login`;

export function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState('president@pwd.org');
    const [password, setPassword] = useState('Password123!');
    const [status, setStatus] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus(null);
        setIsLoading(true);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            setStatus(await parseApiError(response));
            setIsLoading(false);
            return;
        }

        const data = await response.json();
        if (data.accessToken) {
            localStorage.setItem('auth_token', data.accessToken);
            router.push('/dashboard');
            return;
        }

        setStatus('Login successful, but no token received.');
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
                <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                    <TextInput
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                        disabled={isLoading}
                    />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                    <div className="relative">
                        <TextInput
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="current-password"
                            className="pr-11"
                            required
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-white"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            disabled={isLoading}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </label>
            </div>

            {status ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
                    {status}
                </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
        </form>
    );
}
