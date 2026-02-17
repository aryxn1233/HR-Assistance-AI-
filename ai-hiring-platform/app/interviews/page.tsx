"use client"

import { useState, useEffect } from "react"
import {
    MoreHorizontal,
    Video,
    Calendar,
    Search,
    Filter,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import api from "@/lib/api"
import Link from "next/link"

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

export default function InterviewsPage() {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchInterviews();
    }, []);

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

    const filteredInterviews = interviews.filter(i => {
        const candidateName = `${i.candidate?.user?.firstName} ${i.candidate?.user?.lastName}`.toLowerCase();
        return candidateName.includes(searchQuery.toLowerCase()) ||
            i.job?.title.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    }

    return (
        <div className="flex flex-col gap-4 p-4 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Interviews</h2>
                    <p className="text-muted-foreground">
                        Monitor and manage all AI interview sessions.
                    </p>
                </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
                        <Input
                            placeholder="Search interviews by candidate or job..."
                            className="pl-8 w-[250px] md:w-[400px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="text-muted-foreground text-sm">
                    Showing <strong>{filteredInterviews.length}</strong> interviews
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Interview Sessions</CardTitle>
                    <CardDescription>
                        All scheduled, in-progress, and completed interviews.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Candidate</TableHead>
                                <TableHead>Job Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Performance</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">Loading interviews...</TableCell>
                                </TableRow>
                            ) : filteredInterviews.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">No interviews found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredInterviews.map((interview) => {
                                    const name = interview.candidate?.user ? `${interview.candidate.user.firstName} ${interview.candidate.user.lastName}` : 'Unknown';
                                    const initials = name.split(" ").map(n => n[0]).join("");

                                    return (
                                        <TableRow key={interview.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarFallback>{initials}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="font-medium">{name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{interview.job?.title || 'General Role'}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        interview.status === "Completed"
                                                            ? "default"
                                                            : interview.status === "Scheduled"
                                                                ? "secondary"
                                                                : "outline"
                                                    }
                                                >
                                                    {interview.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {interview.status === "Completed" ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-muted h-1.5 w-12 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${interview.score >= 80 ? "bg-green-500" : "bg-yellow-500"}`}
                                                                style={{ width: `${interview.score}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-semibold">{interview.score}%</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs italic">Pending</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(interview.createdAt)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/interview/room/${interview.id}`}>
                                                                <Video className="mr-2 h-4 w-4" />
                                                                Enter Room
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {interview.status === "Completed" && (
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/candidates/${interview.id}`}>
                                                                    View Evaluation
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive">
                                                            Cancel Interview
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
