"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

const candidates = [
    {
        id: "1",
        name: "Alex Johnson",
        role: "Senior React Developer",
        aiScore: 92,
        rank: 1,
        status: "Interview",
        date: "2024-02-15",
        avatar: "/avatars/02.png",
    },
    {
        id: "2",
        name: "Maria Garcia",
        role: "UX Designer",
        aiScore: 88,
        rank: 2,
        status: "Pending",
        date: "2024-02-14",
        avatar: "/avatars/03.png",
    },
    {
        id: "3",
        name: "David Kim",
        role: "Backend Engineer",
        aiScore: 75,
        rank: 5,
        status: "Rejected",
        date: "2024-02-12",
        avatar: "/avatars/04.png",
    },
    {
        id: "4",
        name: "Emily Chen",
        role: "Product Manager",
        aiScore: 95,
        rank: 1,
        status: "Offer",
        date: "2024-02-10",
        avatar: "/avatars/05.png",
    },
    {
        id: "5",
        name: "James Wilson",
        role: "DevOps Engineer",
        aiScore: 82,
        rank: 3,
        status: "Screening",
        date: "2024-02-16",
        avatar: "/avatars/06.png",
    },
]

export function RecentCandidates() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Recent Candidates</h2>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/candidates">View All</Link>
                </Button>
            </div>
            <div className="border-border rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px]">Candidate</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>AI Score</TableHead>
                            <TableHead>Rank</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {candidates.map((candidate) => (
                            <TableRow key={candidate.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={candidate.avatar} alt={candidate.name} />
                                            <AvatarFallback>{candidate.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                                        </Avatar>
                                        <span>{candidate.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{candidate.role}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold ${candidate.aiScore >= 90 ? "text-green-500" : candidate.aiScore >= 80 ? "text-blue-500" : "text-yellow-500"}`}>
                                            {candidate.aiScore}
                                        </span>
                                        <span className="text-muted-foreground text-xs">/ 100</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">#{candidate.rank}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            candidate.status === "Offer"
                                                ? "default"
                                                : candidate.status === "Rejected"
                                                    ? "destructive"
                                                    : "secondary"
                                        }
                                    >
                                        {candidate.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" asChild>
                                        <Link href={`/candidates/${candidate.id}`}>
                                            <ArrowUpRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
