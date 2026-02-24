"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/lib/api"
import { Loader2, Users } from "lucide-react"

export function JobApplications({ jobId }: { jobId: string }) {
    const [applications, setApplications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const response = await api.get(`/jobs/${jobId}/applications`);
                setApplications(response.data);
            } catch (error) {
                console.error("Failed to fetch applications", error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, [jobId])

    if (loading) return (
        <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
    )

    if (applications.length === 0) return (
        <div className="text-center p-8 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
            <p className="text-sm text-muted-foreground font-medium">No candidates have applied yet.</p>
        </div>
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Applicants</h4>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none rounded-full h-5 min-w-[20px] flex items-center justify-center font-bold text-[10px]">
                    {applications.length}
                </Badge>
            </div>

            <div className="rounded-2xl border border-muted/50 overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-muted/50">
                            <TableHead className="text-[10px] font-bold uppercase py-3">Candidate</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase py-3">AI Score</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase py-3">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications.map((app) => (
                            <TableRow key={app.id} className="hover:bg-muted/10 border-muted/50">
                                <TableCell className="font-bold text-sm py-4">{app.candidateName}</TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`text-sm font-black px-2 py-1 rounded-lg ${app.resumeScore >= 70 ? "bg-green-500/10 text-green-600" :
                                                app.resumeScore >= 40 ? "bg-amber-500/10 text-amber-600" :
                                                    "bg-red-500/10 text-red-600"
                                            }`}>
                                            {app.resumeScore}%
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4 text-right">
                                    <Badge
                                        className="rounded-full px-2 py-0.5 font-bold text-[10px] uppercase border-none"
                                        variant={app.shortlisted ? "default" : "destructive"}
                                    >
                                        {app.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
