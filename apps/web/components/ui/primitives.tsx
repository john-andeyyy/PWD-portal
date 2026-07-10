'use client';

import { cn } from '@pwd/ui';
import { Loader2, X } from 'lucide-react';
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
                'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition',
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

export function LoadingButton({
    isLoading,
    loadingText = 'Saving...',
    children,
    disabled,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean; loadingText?: string }) {
    return (
        <Button disabled={disabled || isLoading} aria-busy={isLoading || undefined} {...props}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {isLoading ? loadingText : children}
        </Button>
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
                'aria-[invalid=true]:border-rose-500 aria-[invalid=true]:focus:border-rose-500 aria-[invalid=true]:focus:ring-rose-200 dark:aria-[invalid=true]:focus:ring-rose-950',
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
                'aria-[invalid=true]:border-rose-500 aria-[invalid=true]:focus:border-rose-500 aria-[invalid=true]:focus:ring-rose-200 dark:aria-[invalid=true]:focus:ring-rose-950',
                className,
            )}
            {...props}
        />
    );
}

export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
    if (!children) return null;
    return <p id={id} className="text-sm font-medium text-rose-600 dark:text-rose-400" role="alert">{children}</p>;
}

export function RequiredMark() {
    return <span className="text-rose-600 dark:text-rose-400" aria-label="required">*</span>;
}

export function Modal({ title, description, children, onClose, className }: { title: string; description?: string; children: ReactNode; onClose: () => void; className?: string }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
                aria-describedby={description ? 'dialog-description' : undefined}
                className={cn('max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950', className)}
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div>
                        <h2 id="dialog-title" className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>
                        {description ? <p id="dialog-description" className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
                    </div>
                    <button type="button" onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:hover:bg-slate-900 dark:hover:text-white" aria-label="Close dialog">
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
                <div className="max-h-[calc(100vh-9rem)] overflow-y-auto p-5">{children}</div>
            </div>
        </div>
    );
}

export function StatusMessage({ tone = 'info', children }: { tone?: 'info' | 'success' | 'danger'; children?: ReactNode }) {
    if (!children) return null;
    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                'rounded-lg border px-4 py-3 text-sm',
                tone === 'info' && 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
                tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
                tone === 'danger' && 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300',
            )}
        >
            {children}
        </div>
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
