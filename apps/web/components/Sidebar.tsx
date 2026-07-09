'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appVersion } from '@/lib/release';
import { Accessibility, BriefcaseBusiness, LayoutDashboard, LogOut, Shield, UserCircle2, Users } from 'lucide-react';

interface SidebarItem {
    key: 'dashboard' | 'members' | 'accounts' | 'roles' | 'profile';
    label: string;
    href: '/dashboard' | '/members' | '/accounts' | '/roles' | '/profile';
    icon: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'members', label: 'Members', href: '/members', icon: <Users size={18} /> },
    { key: 'accounts', label: 'Accounts', href: '/accounts', icon: <BriefcaseBusiness size={18} /> },
    { key: 'roles', label: 'Roles', href: '/roles', icon: <Shield size={18} /> },
    { key: 'profile', label: 'Profile', href: '/profile', icon: <UserCircle2 size={18} /> },
];

interface SidebarProps {
    onLogout: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-950 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col">
            <div className="mb-6 flex items-center gap-3 px-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                    <Accessibility size={20} />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-slate-950 dark:text-white">PWD Portal</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Bustos, Bulacan</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${isActive
                                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
                <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Version</p>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800">
                        {appVersion}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </aside>
    );
}
