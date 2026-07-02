'use client';

import { ThemeProvider } from './theme-provider';
import { Navbar } from '@/components/Navbar';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function LayoutClient({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined);
    const pathname = usePathname();
    const isProtectedRoute = pathname?.startsWith('/members');

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('auth_token');
            setIsAuthenticated(!!token);
        };
        checkAuth();
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        setIsAuthenticated(!!token);
    }, [pathname]);

    if (isProtectedRoute && isAuthenticated === undefined) {
        return (
            <ThemeProvider>
                <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
                    <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        Loading...
                    </div>
                </div>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <div className="flex flex-col min-h-screen">
                <Navbar isAuthenticated={isAuthenticated ?? false} />
                <div className="flex-1">{children}</div>
            </div>
        </ThemeProvider>
    );
}
