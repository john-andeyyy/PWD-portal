'use client';

import Link from 'next/link';
import { Accessibility, ArrowLeft, ShieldCheck } from 'lucide-react';
import { LoginForm } from '@/components/LoginForm';
import { Card } from '@/components/ui/primitives';

export default function LoginPage() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
            <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
                <section className="flex flex-col justify-between gap-10 rounded-lg border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 lg:min-h-[640px]">
                    <Link href="/" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                        <ArrowLeft size={16} />
                        Back to home
                    </Link>

                    <div className="max-w-2xl">
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                            <Accessibility size={24} />
                        </div>
                        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">PWD Bustos Bulacan</p>
                        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                            Secure access for PWD records and local service coordination.
                        </h1>
                        <p className="mt-5 max-w-xl text-base leading-7 text-slate-500 dark:text-slate-400">
                            Sign in to manage member profiles, presidents, roles, and disability records from a focused administrative workspace.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {['Member records', 'Role-based access', 'Profile updates'].map((item) => (
                            <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                                {item}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="flex items-center justify-center">
                    <Card className="w-full max-w-md p-6 shadow-lg sm:p-8">
                        <div className="mb-7">
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                <ShieldCheck size={20} />
                            </div>
                            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Welcome back</h2>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Use your president account credentials to continue.</p>
                        </div>
                        <LoginForm />
                    </Card>
                </section>
            </div>
        </main>
    );
}
