"use client"

import * as React from "react"
import {
    LayoutDashboard,
    Briefcase,
    Video,
    FileText,
    User,
    Settings,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"

const items = [
    {
        title: "Dashboard",
        url: "/candidate",
        icon: LayoutDashboard,
    },
    {
        title: "Find Jobs",
        url: "/candidate/jobs",
        icon: Briefcase,
    },
    {
        title: "My Applications",
        url: "/candidate/applications",
        icon: FileText,
    },
    {
        title: "Interviews",
        url: "/candidate/interviews",
        icon: Video,
    },
    {
        title: "Reports",
        url: "/candidate/reports",
        icon: FileText,
    },
    {
        title: "Profile",
        url: "/candidate/profile",
        icon: User,
    },
    {
        title: "Settings",
        url: "/candidate/settings",
        icon: Settings,
    },
]

export function CandidateSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { user } = useAuth();
    const fullName = user ? `${user.firstName} ${user.lastName}` : "Alex Johnson";
    const role = "Candidate";
    const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "AJ";

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-1">
                    <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg font-bold">
                        AI
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                        <span className="font-semibold">HireX AI</span>
                        <span className="text-muted-foreground text-xs">Candidate Portal</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:justify-center">
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user?.avatarUrl || "/avatars/candidate.png"} alt="User" />
                                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                <span className="truncate font-semibold">{fullName}</span>
                                <span className="truncate text-xs">{role}</span>
                            </div>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
