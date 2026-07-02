'use client';

import { useTheme } from '@/app/theme-provider';
import { useRouter } from 'next/navigation';

export function Navbar() {
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();

    return (
        <nav className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        PWD Bustos Bulacan
                    </h1>
                </div>

                <button
                    onClick={toggleTheme}
                    className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
                </button>
            </div>
        </nav>
    );
}
