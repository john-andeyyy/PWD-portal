import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'PWD President Portal',
    description: 'Login and manage PWD members in a monorepo portal.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
