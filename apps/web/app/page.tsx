import Link from 'next/link';

export default function HomePage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-900">
            <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12 lg:px-12">
                <div className="flex flex-col gap-10 rounded-[2rem] border border-slate-200 bg-white/90 p-10 shadow-2xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-slate-950/40 md:p-14">
                    <div className="space-y-6 text-center">
                        <p className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-slate-700 shadow-sm shadow-slate-200 dark:bg-slate-800 dark:text-slate-200">
                            Welcome to the PWD Portal
                        </p>
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                            Welcome to the PWD Bustos Portal
                        </h1>
                        <p className="mx-auto max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
                            Manage PWD member information, local services, and community support in one secure portal for Bustos, Bulacan.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center shadow-sm shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-950/70 dark:shadow-none">
                            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-2xl dark:bg-slate-800">
                                🤝
                            </span>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Community Support</h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                Built for local PWD care teams and service coordinators.
                            </p>
                        </article>
                        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center shadow-sm shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-950/70 dark:shadow-none">
                            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-2xl dark:bg-slate-800">
                                📊
                            </span>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Easy Management</h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                View and update member records with a clean, simple interface.
                            </p>
                        </article>
                        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center shadow-sm shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-950/70 dark:shadow-none">
                            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-2xl dark:bg-slate-800">
                                🔒
                            </span>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Secure Access</h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                Authorized users can sign in safely and access member tools.
                            </p>
                        </article>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row sm:justify-center">
                        <Link href={'/login' as const} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white transition hover:bg-slate-800">
                            Login to continue
                        </Link>
                        <Link href={'/login' as const} className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-900 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-slate-500">
                            Proceed to login
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
