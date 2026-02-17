"use client"

import { useState, useEffect } from "react"
import {
    Calendar,
    ChevronDown,
    Filter,
    MoreHorizontal,
    Plus,
    Search,
    User,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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

interface Candidate {
    id: string;
    userId: string;
    skills: string[];
    experience: number;
    education: string[];
    location: string;
    user: {
        firstName: string;
        lastName: string;
        email: string;
    };
    createdAt: string;
}

import { AddCandidateDialog } from "@/components/candidates/AddCandidateDialog"
import { useRouter } from "next/navigation"

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            const response = await api.get('/candidates');
            setCandidates(response.data);
        } catch (error) {
            console.error("Failed to fetch candidates", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartInterview = async (candidateId: string) => {
        try {
            // In a real app, we'd select a job. For MVP, we'll try to find an existing job or use a placeholder.
            const jobsResponse = await api.get('/jobs');
            const job = jobsResponse.data[0]; // Use the first available job

            if (!job) {
                alert("Please create a job first before starting an interview.");
                return;
            }

            const response = await api.post('/interviews', {
                candidateId: candidateId,
                jobId: job.id,
                status: 'Scheduled'
            });

            alert("Interview started!");
            router.push(`/interview/room/${response.data.id}`);
        } catch (error) {
            console.error("Failed to start interview", error);
            alert("Failed to start interview.");
        }
    };

    const filteredCandidates = candidates.filter(c => {
        const fullName = `${c.user?.firstName} ${c.user?.lastName}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase()) ||
            c.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.skills && c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    }

    return (
        <div className="flex flex-col gap-4 p-4 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Candidates</h2>
                    <p className="text-muted-foreground">
                        Manage your candidate database and initiate AI interviews.
                    </p>
                </div>
                <AddCandidateDialog onCandidateAdded={fetchCandidates} />
            </div>

            <Separator />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
                        <Input
                            placeholder="Search candidates by name, email, or skill..."
                            className="pl-8 w-[250px] md:w-[400px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="text-muted-foreground text-sm">
                    Showing <strong>{filteredCandidates.length}</strong> candidates
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Candidates</CardTitle>
                    <CardDescription>
                        A list of all candidates in your system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Candidate</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Experience</TableHead>
                                <TableHead>Skills</TableHead>
                                <TableHead>Added Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">Loading candidates...</TableCell>
                                </TableRow>
                            ) : filteredCandidates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">No candidates found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredCandidates.map((candidate) => {
                                    const name = candidate.user ? `${candidate.user.firstName} ${candidate.user.lastName}` : 'Unknown';
                                    const initials = name.split(" ").map(n => n[0]).join("");

                                    return (
                                        <TableRow key={candidate.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarFallback>{initials}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{name}</div>
                                                        <div className="text-xs text-muted-foreground">{candidate.user?.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{candidate.location}</TableCell>
                                            <TableCell>{candidate.experience} years</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {candidate.skills?.slice(0, 3).map(skill => (
                                                        <Badge key={skill} variant="outline" className="text-[10px] px-1 py-0">{skill}</Badge>
                                                    ))}
                                                    {(candidate.skills?.length || 0) > 3 && <span className="text-[10px] text-muted-foreground">+{(candidate.skills?.length || 0) - 3} more</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatDate(candidate.createdAt)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleStartInterview(candidate.id)}>
                                                            Start AI Interview
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive">
                                                            Delete Profile
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
