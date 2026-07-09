'use client';

import { AppShell } from '@/components/AppShell';
import { MembersManager } from '@/components/MembersManager';

export default function MembersPage() {
    return (
        <AppShell title="Members" description="Manage all registered PWD members.">
            {(token) => <MembersManager token={token} />}
        </AppShell>
    );
}
