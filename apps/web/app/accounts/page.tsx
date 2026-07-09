'use client';

import { AccountsManager } from '@/components/AccountsManager';
import { AppShell } from '@/components/AppShell';

export default function AccountsPage() {
    return (
        <AppShell title="Accounts" description="Manage president accounts, roles, and access settings.">
            {(token) => <AccountsManager token={token} />}
        </AppShell>
    );
}
