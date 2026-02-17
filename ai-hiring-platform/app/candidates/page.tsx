"use client"

import { useState } from "react"
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

// Mock Data
const candidates = [
    {
        id: 1,
        name: "Alex Johnson",
        role: "Senior Frontend Engineer",
        stage: "Interview",
        score: 88,
        appliedDate: "2023-10-15",
        avatar: "/avatars/01.png",
        initials: "AJ",
    },
    {
        id: 2,
        name: "Maria Garcia",
        role: "Product Designer",
        stage: "Screening",
        score: 92,
        appliedDate: "2023-10-18",
        avatar: "/avatars/02.png",
        initials: "MG",
    },
    {
        id: 3,
        name: "David Smith",
        role: "Backend Developer",
        stage: "Applied",
        score: 0,
        appliedDate: "2023-10-20",
        avatar: "/avatars/03.png",
        initials: "DS",
    },
    {
        id: 4,
        name: "Emily Chen",
        role: "Data Scientist",
        stage: "Offer",
        score: 95,
        appliedDate: "2023-10-10",
        avatar: "/avatars/04.png",
        initials: "EC",
    },
    {
        id: 5,
        name: "Michael Brown",
        role: "Marketing Manager",
        stage: "Hired",
        score: 85,
        appliedDate: "2023-09-25",
        avatar: "/avatars/05.png",
        initials: "MB",
    },
    {
        id: 6,
        name: "Sarah Wilson",
        role: "HR Specialist",
        stage: "Interview",
        score: 78,
        appliedDate: "2023-10-12",
        avatar: "/avatars/06.png",
        initials: "SW",
    },
]

export default function CandidatesPage() {
    const [filterStage, setFilterStage] = useState("all")

    const filteredCandidates =
        filterStage === "all"
            ? candidates
            : candidates.filter((candidate) => candidate.stage.toLowerCase() === filterStage.toLowerCase())

    return (
        <div className="flex flex-col gap-4 p-4 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Candidates</h2>
                    <p className="text-muted-foreground">
                        View and manage candidate applications.
                    </p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Candidate
                </Button>
            </div>

            <Separator />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
                        <Input
                            placeholder="Search candidates..."
                            className="pl-8 w-[250px] md:w-[300px]"
                        />
                    </div>
                    <Select value={filterStage} onValueChange={setFilterStage}>
                        <SelectTrigger className="w-[180px]">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <SelectValue placeholder="Stage" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Stages</SelectItem>
                            <SelectItem value="applied">Applied</SelectItem>
                            <SelectItem value="screening">Screening</SelectItem>
                            <SelectItem value="interview">Interview</SelectItem>
                            <SelectItem value="offer">Offer</SelectItem>
                            <SelectItem value="hired">Hired</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-muted-foreground text-sm">
                    Showing <strong>{filteredCandidates.length}</strong> candidates
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Candidates</CardTitle>
                    <CardDescription>
                        A list of all candidates and their current status.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Candidate</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Stage</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Applied Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCandidates.map((candidate) => (
                                <TableRow key={candidate.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={candidate.avatar} alt={candidate.name} />
                                                <AvatarFallback>{candidate.initials}</AvatarFallback>
                                            </Avatar>
                                            <div className="font-medium">{candidate.name}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{candidate.role}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                candidate.stage === "Hired"
                                                    ? "default"
                                                    : candidate.stage === "Offer"
                                                        ? "secondary"
                                                        : candidate.stage === "Interview"
                                                            ? "outline"
                                                            : "secondary"
                                            }
                                            className={
                                                candidate.stage === "Interview" ? "border-primary text-primary" : ""
                                            }
                                        >
                                            {candidate.stage}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {candidate.score > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <div className="bg-muted h-2 w-16 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${candidate.score >= 90
                                                                ? "bg-green-500"
                                                                : candidate.score >= 80
                                                                    ? "bg-yellow-500"
                                                                    : "bg-red-500"
                                                            }`}
                                                        style={{ width: `${candidate.score}%` }}
                                                    />
                                                </div>
                                                <span className="text-muted-foreground text-sm">{candidate.score}%</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="text-muted-foreground h-4 w-4" />
                                            <span>{candidate.appliedDate}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                                <DropdownMenuItem>Schedule Interview</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive">
                                                    Reject Candidate
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
