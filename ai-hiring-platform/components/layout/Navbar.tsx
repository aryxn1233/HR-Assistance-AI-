"use client"

import * as React from "react"
import { Bell, Search } from "lucide-react"
import Link from "next/link"
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
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/ui/mode-toggle"

export function Navbar() {
    const { isLoaded, isSignedIn, user: clerkUser } = useUser();

    // Legacy Auth Detection
    const isBrowser = typeof window !== 'undefined';
    const legacyUser = isBrowser ? JSON.parse(localStorage.getItem('user') || 'null') : null;
    const isLegacySignedIn = isBrowser ? !!localStorage.getItem('token') : false;

    const currentIsSignedIn = isSignedIn || isLegacySignedIn;
    const fullName = isSignedIn ? (clerkUser?.fullName || "User") : (legacyUser?.name || legacyUser?.fullName || "User");
    const role = isSignedIn
        ? (clerkUser?.publicMetadata?.role as string || 'recruiter')
        : (legacyUser?.role || 'recruiter');

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex flex-1 items-center gap-4">
                <form className="ml-auto flex-1 sm:flex-initial">
                    <div className="relative">
                        <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
                        <Input
                            type="search"
                            placeholder={role === 'candidate' ? "Search for jobs..." : "Search candidates..."}
                            className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                        />
                    </div>
                </form>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="bg-primary absolute top-2 right-2 h-2 w-2 rounded-full" />
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
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                )}
            </div>
        </header>
    )
}
