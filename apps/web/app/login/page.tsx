'use client';

import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-6">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 shadow-lg shadow-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950">
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Login</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Sign in to manage PWD members</p>
                </div>
                <LoginForm />
            </div>
        </main>
    );
}
