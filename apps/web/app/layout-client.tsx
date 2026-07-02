'use client';

import { ThemeProvider } from './theme-provider';
import { Navbar } from '@/components/Navbar';

export function LayoutClient({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <Navbar />
            {children}
        </ThemeProvider>
    );
}
