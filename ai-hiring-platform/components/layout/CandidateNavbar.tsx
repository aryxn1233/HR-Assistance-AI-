"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Search, User, LogOut, Settings, LayoutDashboard, Briefcase, Video, FileText } from "lucide-react"
import { useAuth } from "@/context/auth-context"
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
    const { user, logout } = useAuth()

    const fullName = user ? `${user.firstName} ${user.lastName}` : "Alex Johnson"
    const email = user?.email || "alex@example.com"
    const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "AJ"

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/candidate" className="flex items-center gap-2">
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg font-bold">
                            AI
                        </div>
                        <span className="hidden font-bold sm:inline-block">HireX AI</span>
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

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src="/avatars/candidate.png" alt={fullName} />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium">{fullName}</p>
                                    <p className="text-xs text-muted-foreground">{email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Link href="/candidate/profile">
                                <DropdownMenuItem>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                            </Link>
                            <Link href="/candidate/settings">
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
