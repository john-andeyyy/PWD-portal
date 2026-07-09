'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appVersion } from '@/lib/release';

interface SidebarItem {
    key: 'dashboard' | 'members' | 'accounts';
    label: string;
    href: '/dashboard' | '/members' | '/accounts';
}

const sidebarItems: SidebarItem[] = [
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
    { key: 'members', label: 'Members', href: '/members' },
    { key: 'accounts', label: 'Accounts', href: '/accounts' }
];

interface SidebarProps {
    onLogout: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
    const pathname = usePathname();
    const sidebarClasses = 'hidden w-80 shrink-0 border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40 dark:border-slate-700 dark:bg-slate-950 dark:shadow-none lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col';

    return (
        <aside className={sidebarClasses}>
            <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Navigation</p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Workspace</h2>
            </div>

            <nav className="space-y-2 flex-1">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${isActive
                                ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/20 dark:bg-sky-500'
                                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                        >
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Version</p>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
                        {appVersion}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onLogout}
                    className="w-full rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                >
                    Logout
                </button>
            </div>
        </aside>
    );
}
