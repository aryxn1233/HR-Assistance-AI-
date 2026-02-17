"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { CandidateSidebar } from "@/components/layout/CandidateSidebar";
import { Navbar } from "@/components/layout/Navbar";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const isPublicRoute = pathname === "/login" || pathname === "/register";
    const isCandidate = user?.role === 'candidate';

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated && !isPublicRoute) {
                router.push("/login");
            } else if (isAuthenticated && isPublicRoute) {
                router.push("/");
            }
        }
    }, [isAuthenticated, loading, isPublicRoute, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (isPublicRoute) {
        return <>{children}</>;
    }

    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return (
        <SidebarProvider>
            {isCandidate ? <CandidateSidebar /> : <AppSidebar />}
            <SidebarInset>
                <Navbar />
                <main className="flex flex-1 flex-col gap-4 p-4">
                    {isCandidate ? (
                        <div className="container py-2">
                            {children}
                        </div>
                    ) : (
                        children
                    )}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
