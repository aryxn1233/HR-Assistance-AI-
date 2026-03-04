"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { CandidateSidebar } from "@/components/layout/CandidateSidebar";
import { Navbar } from "@/components/layout/Navbar";
import { Loader2 } from "lucide-react";
import { setAuthToken } from "@/lib/api";
import { setTokenGetter } from "@/lib/tokenManager";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn, user } = useUser();
    const { getToken } = useAuth();
    const [isSynced, setIsSynced] = useState(false);

    // Register the Clerk getToken function globally so api.ts interceptor can use it
    useEffect(() => {
        if (isSignedIn && getToken) {
            setTokenGetter(getToken);
        }
    }, [isSignedIn, getToken]);
    const router = useRouter();
    const pathname = usePathname();

    const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname === "/onboarding";
    const isPublicRoute = isAuthPage || pathname.startsWith("/public") || pathname === "/";

    // Explicit role checks
    const userRole = (user?.publicMetadata?.role || user?.unsafeMetadata?.role) as string | undefined;
    const isCandidate = userRole === 'candidate';
    const isRecruiter = userRole === 'recruiter';

    // Sync token with API client
    useEffect(() => {
        const syncToken = async () => {
            if (isSignedIn) {
                try {
                    const token = await getToken();
                    setAuthToken(token);
                    // Persist Clerk token so it survives page navigations
                    if (token) {
                        localStorage.setItem('clerk_token', token);
                    }
                    setIsSynced(true);
                } catch (err) {
                    console.error("Failed to sync auth token", err);
                    setIsSynced(true);
                }
            } else {
                // Clear Clerk token on sign out
                localStorage.removeItem('clerk_token');
                // Check legacy token
                const legacyToken = localStorage.getItem('token');
                if (legacyToken) {
                    setAuthToken(legacyToken);
                } else {
                    setAuthToken(null);
                }
                setIsSynced(true);
            }
        };
        syncToken();
    }, [isSignedIn, getToken, isLoaded]);

    // Role detection for legacy users
    const isBrowser = typeof window !== 'undefined';
    const legacyUser = isBrowser ? JSON.parse(localStorage.getItem('user') || 'null') : null;
    const isLegacySignedIn = isBrowser ? !!localStorage.getItem('token') : false;

    // Combined checks
    const currentIsSignedIn = isSignedIn || isLegacySignedIn;
    const currentUserRole = isSignedIn ? userRole : (legacyUser?.role);
    const currentIsCandidate = isSignedIn ? isCandidate : (currentUserRole === 'candidate');
    const currentIsRecruiter = isSignedIn ? isRecruiter : (currentUserRole === 'recruiter');

    useEffect(() => {
        if (isLoaded && currentIsSignedIn && isAuthPage) {
            router.push("/");
        }
    }, [isLoaded, currentIsSignedIn, isAuthPage, router]);

    // Missing role onboarding logic
    useEffect(() => {
        // Only Clerk users need onboarding since they don't have roles initially
        if (isLoaded && isSignedIn && !userRole && pathname !== "/onboarding") {
            router.push("/onboarding");
        }
    }, [isLoaded, isSignedIn, userRole, pathname, router]);

    // Root path and dashboard protection redirect logic
    useEffect(() => {
        if (!isLoaded || !currentIsSignedIn) return;

        // Root path redirect
        if (pathname === "/") {
            if (currentIsCandidate) {
                router.replace("/candidate");
            } else if (currentIsRecruiter) {
                router.replace("/recruiter");
            }
            return;
        }

        // Specific dashboard protection
        // Recruiters should be able to view candidate pages, but candidates CANNOT view recruiter pages
        if (pathname.startsWith("/recruiter") && currentIsCandidate) {
            router.replace("/candidate");
        }
        // If a candidate tries to access a recruiter route or if someone without a role tries to access candidate route
        else if (pathname.startsWith("/candidate") && !currentIsCandidate && !currentIsRecruiter) {
            router.replace("/onboarding");
        }
    }, [isLoaded, currentIsSignedIn, pathname, currentIsCandidate, currentIsRecruiter, router]);

    if (!isLoaded || (currentIsSignedIn && !isSynced)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Determine if we should show the content
    const needsRedirect = currentIsSignedIn && (
        (pathname === "/") ||
        (pathname.startsWith("/recruiter") && currentIsCandidate) ||
        (pathname.startsWith("/candidate") && !currentIsCandidate && !currentIsRecruiter)
    );

    if (needsRedirect) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isPublicRoute && !currentIsSignedIn) {
        return <>{children}</>;
    }

    if (!currentIsSignedIn) {
        return <>{children}</>;
    }

    return (
        <SidebarProvider>
            {currentIsRecruiter ? <AppSidebar /> : currentIsCandidate ? <CandidateSidebar /> : <AppSidebar />}
            <SidebarInset>
                <Navbar />
                <main className="flex flex-1 flex-col gap-4 p-4">
                    {/* Only use container for candidates or when recruiters view candidate paths */}
                    {pathname.startsWith("/candidate") ? (
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
