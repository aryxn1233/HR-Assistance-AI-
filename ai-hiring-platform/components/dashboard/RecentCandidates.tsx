"use client"

import { useState, useEffect } from "react"
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
import api from "@/lib/api"

interface Interview {
    id: string;
    candidate: {
        id: string;
        user: {
            firstName: string;
            lastName: string;
        };
    };
    job: {
        title: string;
    };
    score: number;
    status: string;
    createdAt: string;
}

export function RecentCandidates() {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInterviews = async () => {
            try {
                const response = await api.get('/interviews');
                setInterviews(response.data);
            } catch (error) {
                console.error("Failed to fetch interviews", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInterviews();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Recent Interviews</h2>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/recruiter/interviews">View All</Link>
                </Button>
            </div>
            <div className="border-border rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px]">Candidate</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>AI Score</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {interviews.map((interview) => {
                            const name = interview.candidate?.user ? `${interview.candidate.user.firstName} ${interview.candidate.user.lastName}` : 'Unknown';
                            const initials = name.split(" ").map(n => n[0]).join("");

                            return (
                                <TableRow key={interview.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/candidates/${interview.candidate?.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{initials}</AvatarFallback>
                                            </Avatar>
                                            <span>{name}</span>
                                        </Link>
                                    </TableCell>
                                    <TableCell>{interview.job?.title || 'Unknown Role'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold ${interview.score >= 90 ? "text-green-500" : interview.score >= 80 ? "text-blue-500" : "text-yellow-500"}`}>
                                                {interview.score}
                                            </span>
                                            <span className="text-muted-foreground text-xs">/ 100</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                interview.status === "completed"
                                                    ? "default"
                                                    : interview.status === "rejected"
                                                        ? "destructive"
                                                        : "secondary"
                                            }
                                        >
                                            {interview.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href="/recruiter/interviews">
                                                <ArrowUpRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
