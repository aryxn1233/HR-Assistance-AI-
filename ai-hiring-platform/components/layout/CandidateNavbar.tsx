"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Search, User, LogOut, Settings, LayoutDashboard, Briefcase, Video, FileText } from "lucide-react"
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { motion } from "framer-motion"

const navItems = [
    { title: "Dashboard", href: "/candidate", icon: LayoutDashboard },
    { title: "My Applications", href: "/candidate/applications", icon: Briefcase },
    { title: "Interviews", href: "/candidate/interviews", icon: Video },
    { title: "Profile", href: "/candidate/profile", icon: User },
    { title: "Reports", href: "/candidate/reports", icon: FileText },
]

export function CandidateNavbar() {
    const pathname = usePathname()
    const { isLoaded, isSignedIn, user: clerkUser } = useUser()

    // Legacy Auth Detection
    const isBrowser = typeof window !== 'undefined';
    const legacyUser = isBrowser ? JSON.parse(localStorage.getItem('user') || 'null') : null;
    const isLegacySignedIn = isBrowser ? !!localStorage.getItem('token') : false;

    const currentIsSignedIn = isSignedIn || isLegacySignedIn;
    const fullName = isSignedIn ? (clerkUser?.fullName || "User") : (legacyUser?.name || legacyUser?.fullName || "User");

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/candidate" className="flex items-center gap-2">
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg font-bold">
                            AI
                        </div>
                        <span className="hidden font-bold sm:inline-block">HireMe</span>
                    </Link>

                    <nav className="hidden items-center gap-6 md:flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`text-sm font-medium transition-colors hover:text-primary relative py-1 ${pathname === item.href ? "text-foreground" : "text-muted-foreground"
                                    }`}
                            >
                                {item.title}
                                {pathname === item.href && (
                                    <motion.div
                                        layoutId="nav-underline"
                                        className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-primary"
                                    />
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                    </Button>

                    <ModeToggle />

                    {!isLoaded ? (
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : !currentIsSignedIn ? (
                        <div className="flex items-center gap-2">
                            <SignInButton mode="modal">
                                <Button variant="ghost" size="sm">Sign In</Button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <Button size="sm">Sign Up</Button>
                            </SignUpButton>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {isSignedIn ? (
                                <UserButton />
                            ) : (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src="" alt={fullName} />
                                                <AvatarFallback>{fullName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end" forceMount>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">{fullName}</p>
                                                <p className="text-muted-foreground text-xs leading-none">
                                                    {legacyUser?.email || "Signed in with Legacy"}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => {
                                            localStorage.removeItem('token');
                                            localStorage.removeItem('user');
                                            window.location.href = "/login";
                                        }} className="text-destructive focus:text-destructive">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Log out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Nav */}
            <div className="md:hidden border-t px-4 py-2 flex justify-between overflow-x-auto whitespace-nowrap">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`text-xs font-medium px-2 py-1 ${pathname === item.href ? "text-primary bg-primary/10 rounded-md" : "text-muted-foreground"
                            }`}
                    >
                        {item.title}
                    </Link>
                ))}
            </div>
        </header>
    )
}
