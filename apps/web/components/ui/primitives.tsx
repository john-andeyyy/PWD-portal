'use client';

import { cn } from '@pwd/ui';
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
    className,
    variant = 'primary',
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
    return (
        <button
            className={cn(
                'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50',
                variant === 'primary' && 'bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200',
                variant === 'secondary' && 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900',
                variant === 'ghost' && 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900',
                variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-700',
                className,
            )}
            {...props}
        />
    );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950',
                className,
            )}
            {...props}
        />
    );
}

export function Badge({
    className,
    tone = 'neutral',
    ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                tone === 'neutral' && 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
                tone === 'success' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                tone === 'warning' && 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
                tone === 'danger' && 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
                tone === 'info' && 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
                className,
            )}
            {...props}
        />
    );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={cn(
                'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition',
                'placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200',
                'dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800',
                className,
            )}
            {...props}
        />
    );
}

export function SelectInput({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            className={cn(
                'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition',
                'focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100',
                'dark:focus:border-slate-600 dark:focus:ring-slate-800',
                className,
            )}
            {...props}
        />
    );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
    return (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
            {description ? <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
            {action ? <div className="mt-5">{action}</div> : null}
        </div>
    );
}

export function Skeleton({ className }: { className?: string }) {
    return <div className={cn('animate-pulse rounded-md bg-slate-200 dark:bg-slate-800', className)} />;
}
