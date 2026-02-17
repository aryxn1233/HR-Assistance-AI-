"use client"

import { CandidateNavbar } from "@/components/layout/CandidateNavbar";

export function CandidateLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">
            <CandidateNavbar />
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
