'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ThemeProvider } from './theme-provider';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export function LayoutClient({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const isProtectedRoute =
        pathname?.startsWith('/dashboard') ||
        pathname?.startsWith('/accounts') ||
        pathname?.startsWith('/members') ||
        pathname?.startsWith('/roles') ||
        pathname?.startsWith('/profile');

    const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined);
    const [hasPortalAccess, setHasPortalAccess] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;

        const verifyAccess = async () => {
            const token = localStorage.getItem('auth_token');
            setIsAuthenticated(!!token);

            if (!isProtectedRoute) {
                if (!cancelled) {
                    setHasPortalAccess(undefined);
                }
                return;
            }

            if (!token) {
                if (!cancelled) {
                    setHasPortalAccess(false);
                }
                router.replace('/login');
                return;
            }

            try {
                const response = await fetch(`${apiBaseUrl}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) {
                    throw new Error('Unable to verify access');
                }

                if (!cancelled) {
                    setHasPortalAccess(true);
                }
            } catch {
                localStorage.removeItem('auth_token');
                if (!cancelled) {
                    setHasPortalAccess(false);
                }
                router.replace('/login');
            }
        };

        verifyAccess();
        window.addEventListener('storage', verifyAccess);

        return () => {
            cancelled = true;
            window.removeEventListener('storage', verifyAccess);
        };
    }, [isProtectedRoute, pathname, router]);

    if (isProtectedRoute && hasPortalAccess !== true) {
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
            <div className="flex min-h-screen flex-col">
                <Navbar isAuthenticated={isAuthenticated ?? false} />
                <div className="flex-1">{children}</div>
            </div>
        </ThemeProvider>
    );
}
