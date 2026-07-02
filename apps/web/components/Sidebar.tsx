'use client';

interface SidebarItem {
    key: 'dashboard' | 'list' | 'accounts';
    label: string;
}

const sidebarItems: SidebarItem[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'list', label: 'List' },
    { key: 'accounts', label: 'Accounts' }
];

interface SidebarProps {
    selected: SidebarItem['key'];
    onSelect: (key: SidebarItem['key']) => void;
    onLogout: () => void;
}

export function Sidebar({ selected, onSelect, onLogout }: SidebarProps) {
    return (
        <aside className="hidden w-80 shrink-0 border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40 dark:border-slate-700 dark:bg-slate-950 dark:shadow-none lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:block">
            <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Navigation</p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Workspace</h2>
            </div>

            <nav className="space-y-2 flex-1">
                {sidebarItems.map((item) => {
                    const isActive = selected === item.key;
                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => onSelect(item.key)}
                            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${isActive
                                ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/20 dark:bg-sky-500'
                                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                        >
                            <span>{item.label}</span>
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {item.key}
                            </span>
                        </button>
                    );
                })}
            </nav>

            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
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
