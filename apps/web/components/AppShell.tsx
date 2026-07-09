'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Button, Card } from '@/components/ui/primitives';

type AppShellProps = {
    title: string;
    description: string;
    children: (token: string) => ReactNode;
    actions?: ReactNode;
};

export function AppShell({ title, description, children, actions }: AppShellProps) {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        if (!storedToken) {
            router.replace('/login');
            return;
        }

        setToken(storedToken);
    }, [router]);

    const confirmLogout = () => {
        localStorage.removeItem('auth_token');
        setIsLogoutOpen(false);
        router.push('/');
    };

    if (!token) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
                <Card className="w-full max-w-sm p-6 text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 dark:border-slate-800 dark:border-t-white" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Checking your session...</p>
                </Card>
            </main>
        );
    }

    return (
        <main className="h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
            <div className="lg:flex lg:h-full lg:overflow-hidden">
                <Sidebar onLogout={() => setIsLogoutOpen(true)} />

                <section className="flex-1 overflow-y-auto lg:ml-72">
                    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6 lg:px-8">
                        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h1>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
                            </div>
                            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
                        </div>
                    </header>

                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {children(token)}
                    </div>
                </section>
            </div>

            {isLogoutOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <Card className="w-full max-w-sm p-6 shadow-xl">
                        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Logout?</h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Your current session token will be removed from this browser.
                        </p>
                        <div className="mt-6 flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => setIsLogoutOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="button" variant="danger" onClick={confirmLogout}>
                                Logout
                            </Button>
                        </div>
                    </Card>
                </div>
            ) : null}
        </main>
    );
}
