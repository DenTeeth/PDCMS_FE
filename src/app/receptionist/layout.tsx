'use client';

import { ReactNode } from 'react';

interface ReceptionistLayoutProps {
    children: ReactNode;
}

export default function ReceptionistLayout({ children }: ReceptionistLayoutProps) {
    return <>{children}</>;
}
