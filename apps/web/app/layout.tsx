import type { Metadata } from 'next';
import './globals.css';
import { LayoutClient } from './layout-client';

export const metadata: Metadata = {
    title: 'PWD Bustos Bulacan',
    description: 'Login and manage PWD members in a monorepo portal.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <LayoutClient>{children}</LayoutClient>
            </body>
        </html>
    );
}
