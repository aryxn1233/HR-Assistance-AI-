"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import api from "@/lib/api"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Search, Filter, ArrowUpRight, FileText } from "lucide-react"

export default function MyApplicationsPage() {
    const [search, setSearch] = useState("")
    const [applications, setApplications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const response = await api.get('/candidates/applications')
                setApplications(response.data)
            } catch (error) {
                console.error("Failed to fetch applications", error)
            } finally {
                setLoading(false)
            }
        }
        fetchApplications()
    }, [])

    const filteredApplications = applications.filter(app =>
        app.job?.title.toLowerCase().includes(search.toLowerCase()) ||
        app.job?.department?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
                <p className="text-muted-foreground">Track and manage all your active job applications in one place.</p>
            </div>

            <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-[300px]">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by role or company..."
                                className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary h-10 rounded-xl"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Select defaultValue="all">
                                <SelectTrigger className="w-[140px] bg-muted/50 border-none h-10 rounded-xl">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="applied">Applied</SelectItem>
                                    <SelectItem value="interviewing">Interviewing</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" className="rounded-xl h-10 border-dashed border-2 px-4 italic hover:bg-muted/50">
                                <Filter className="mr-2 h-4 w-4" />
                                More Filters
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="border-none hover:bg-transparent">
                                <TableHead className="pl-6 font-bold">Company</TableHead>
                                <TableHead className="font-bold">Role</TableHead>
                                <TableHead className="font-bold">Applied Date</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="font-bold">AI Score</TableHead>
                                <TableHead className="text-right pr-6 font-bold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredApplications.map((app) => (
                                <TableRow key={app.id} className="group border-b border-muted/50 hover:bg-muted/20 transition-colors">
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                {app.job?.department?.[0] || 'J'}
                                            </div>
                                            <span className="font-semibold">{app.job?.department || "N/A"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium text-foreground/80">{app.job?.title}</TableCell>
                                    <TableCell className="text-muted-foreground">{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={`rounded-full px-3 py-0.5 font-semibold text-[10px] uppercase tracking-wider ${app.status === "Interviewing" ? "bg-purple-500/10 text-purple-600 border-purple-500/20" :
                                                    app.status === "Screening" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                                        app.status === "Rejected" ? "bg-destructive/10 text-destructive border-destructive/20" :
                                                            app.status === "Shortlisted" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                                                                "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                                }`}
                                        >
                                            {app.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${app.aiScore >= 80 ? "bg-green-500" : app.aiScore >= 70 ? "bg-amber-500" : "bg-destructive"}`}
                                                    style={{ width: `${app.aiScore}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold">{app.aiScore}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                                            <ArrowUpRight className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </motion.div>
    )
}
