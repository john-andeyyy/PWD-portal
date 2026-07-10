import Link from 'next/link';
import { Accessibility, ArrowRight, ClipboardCheck, LockKeyhole, UsersRound } from 'lucide-react';
import { appVersion } from '@/lib/release';

const portalScope = [
    'Member registry',
    'Disability records',
    'Account access',
    'Local reporting',
];

const highlights = [
    {
        icon: UsersRound,
        title: 'Central records',
        description: 'A single workspace for PWD profiles, classifications, and contact details.',
    },
    {
        icon: ClipboardCheck,
        title: 'Operational focus',
        description: 'Designed around daily encoding, updates, review, and coordination work.',
    },
    {
        icon: LockKeyhole,
        title: 'Controlled access',
        description: 'Role-based permissions keep sensitive records available only to authorized users.',
    },
];

export default function HomePage() {
    return (
        <main className="min-h-screen bg-stone-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
            <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8">
                    <div className="max-w-3xl">
                        <div className="mb-8 inline-flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                                <Accessibility size={19} aria-hidden="true" />
                            </span>
                            <span>PWD Bustos Bulacan</span>
                        </div>

                        <p className="text-sm font-medium uppercase text-slate-500 dark:text-slate-400">
                            Municipal PWD records portal
                        </p>
                        <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                            Clear records for accessible local service.
                        </h1>
                        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
                            A focused administrative system for managing PWD member information, account access, and service coordination in Bustos, Bulacan.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Link
                                href={'/login' as const}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                            >
                                Sign in
                                <ArrowRight size={16} aria-hidden="true" />
                            </Link>
                            <span className="inline-flex h-11 items-center text-sm text-slate-500 dark:text-slate-400">
                                Version {appVersion}
                            </span>
                        </div>
                    </div>
                   
                </div>
            </section>

            <section className="bg-stone-50 dark:bg-slate-950">
                <div className="mx-auto grid max-w-7xl gap-4 px-6 py-10 sm:grid-cols-3 lg:px-8">
                    {highlights.map(({ icon: Icon, title, description }) => (
                        <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                <Icon size={18} aria-hidden="true" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-950 dark:text-white">{title}</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}
