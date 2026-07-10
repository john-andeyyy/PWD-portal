'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button, FieldError, LoadingButton, TextInput } from '@/components/ui/primitives';
import { apiBaseUrl, parseApiError } from '@/lib/api';
import { focusFirstInvalidField, friendlyError, isValidEmail } from '@/lib/validation';

const endpoint = `${apiBaseUrl}/auth/login`;

type LoginErrors = Partial<Record<'email' | 'password' | 'form', string>>;

export function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState('president@pwd.org');
    const [password, setPassword] = useState('Password123!');
    const [errors, setErrors] = useState<LoginErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const validate = () => {
        const nextErrors: LoginErrors = {};
        if (!email.trim()) nextErrors.email = 'Email is required.';
        else if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address.';
        if (!password) nextErrors.password = 'Password is required.';
        return nextErrors;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextErrors = validate();
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            focusFirstInvalidField(nextErrors);
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            });

            if (!response.ok) {
                setErrors({ form: friendlyError(await parseApiError(response)) });
                return;
            }

            const data = await response.json();
            if (data.accessToken) {
                localStorage.setItem('auth_token', data.accessToken);
                router.push('/dashboard');
                return;
            }

            setErrors({ form: 'Login successful, but no token was received.' });
        } catch {
            setErrors({ form: 'Unable to sign in. Check your connection and try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-4">
                <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email <span className="sr-only">required</span>
                    <TextInput
                        name="email"
                        type="email"
                        value={email}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            if (errors.email && isValidEmail(event.target.value)) setErrors((current) => ({ ...current, email: undefined }));
                        }}
                        autoComplete="email"
                        disabled={isLoading}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'login-email-error' : undefined}
                    />
                    <FieldError id="login-email-error">{errors.email}</FieldError>
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password <span className="sr-only">required</span>
                    <div className="relative">
                        <TextInput
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(event) => {
                                setPassword(event.target.value);
                                if (errors.password && event.target.value) setErrors((current) => ({ ...current, password: undefined }));
                            }}
                            autoComplete="current-password"
                            className="pr-11"
                            disabled={isLoading}
                            aria-invalid={Boolean(errors.password)}
                            aria-describedby={errors.password ? 'login-password-error' : undefined}
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
                    <FieldError id="login-password-error">{errors.password}</FieldError>
                </label>
            </div>

            {errors.form ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300" role="alert">
                    {errors.form}
                </div>
            ) : null}

            <LoadingButton type="submit" className="w-full" isLoading={isLoading} loadingText="Signing in...">
                Sign in
            </LoadingButton>
        </form>
    );
}
