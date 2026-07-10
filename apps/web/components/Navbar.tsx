'use client';

import { useTheme } from '@/app/theme-provider';
import { LogIn, Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NavbarProps {
    isAuthenticated?: boolean;
}

export function Navbar({ isAuthenticated = false }: NavbarProps) {
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();

    if (isAuthenticated) {
        return null;
    }

    return (
        <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-base font-semibold tracking-tight text-slate-950 dark:text-white sm:text-lg">
                        PWD Bustos Bulacan
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/login')}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                        <LogIn size={16} aria-hidden="true" />
                        Sign in
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
                    </button>
                </div>
            </div>
        </nav>
    );
}
