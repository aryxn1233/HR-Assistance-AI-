"use client"

import { useState, useEffect } from "react"
import {
    Briefcase,
    Calendar,
    Filter,
    MapPin,
    MoreHorizontal,
    Plus,
    Search,
    Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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
import api from "@/lib/api"
import Link from "next/link"

interface Job {
    id: string;
    title: string;
    department: string;
    location: string;
    type: string;
    status: string;
    createdAt: string;
    // candidates count not in basic entity yet
}

import { CreateJobDialog } from "@/components/jobs/CreateJobDialog"

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState("all")

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await api.get('/jobs');
            setJobs(response.data);
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleJobCreated = () => {
        fetchJobs();
    };

    const filteredJobs =
        filterStatus === "all"
            ? jobs
            : jobs.filter((job) => job.status.toLowerCase() === filterStatus)

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
            Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            'day'
        );
    }

    if (loading) return <div className="p-8">Loading jobs...</div>

    return (
        <div className="flex flex-col gap-4 p-4 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
                    <p className="text-muted-foreground">
                        Manage your open positions and track candidates.
                    </p>
                </div>
                <CreateJobDialog onJobCreated={handleJobCreated} />
            </div>

            <Separator />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
                        <Input
                            placeholder="Search jobs..."
                            className="pl-8 w-[250px] md:w-[300px]"
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[180px]">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-muted-foreground text-sm">
                    Showing <strong>{filteredJobs.length}</strong> jobs
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.map((job) => (
                    <Card key={job.id} className="transition-all hover:shadow-md">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl">{job.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-1">
                                        <Briefcase className="h-3 w-3" /> {job.department || 'Engineering'}
                                    </CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem>Edit Job</DropdownMenuItem>
                                        <DropdownMenuItem>View Candidates</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive">
                                            Delete Job
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> {job.location}
                                    </div>
                                    <Badge variant="outline">{job.type}</Badge>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <Badge
                                        variant={
                                            job.status === "PUBLISHED" // Assuming backend uses PUBLISHED
                                                ? "default"
                                                : job.status === "DRAFT"
                                                    ? "secondary"
                                                    : "destructive"
                                        }
                                    >
                                        {job.status}
                                    </Badge>
                                    <div className="text-muted-foreground text-xs flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> {formatDate(job.createdAt)}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/50 flex items-center justify-between px-6 py-3">
                            <div className="text-muted-foreground text-sm flex items-center gap-1">
                                <Users className="h-4 w-4" /> 0 Candidates
                            </div>
                            <Button variant="ghost" size="sm">
                                View Details
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
