"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Search,
    MapPin,
    Briefcase,
    Building2,
    Clock,
    ArrowRight,
    Filter,
    CheckCircle2,
    Loader2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import api from "@/lib/api"

interface Job {
    id: string
    title: string
    description: string
    department?: string
    location?: string
    type?: string
    salaryRange?: string
    skills: string[]
    createdAt: string
}

export default function FindJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [applying, setApplying] = useState<string | null>(null)
    const [appliedJobs, setAppliedJobs] = useState<string[]>([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [jobsRes, appsRes] = await Promise.all([
                    api.get('/jobs'),
                    api.get('/candidates/applications')
                ])
                const safeJobs = Array.isArray(jobsRes.data) ? jobsRes.data : [];
                if (!Array.isArray(jobsRes.data)) {
                    console.warn("Jobs data is not an array:", jobsRes.data);
                }
                setJobs(safeJobs)
                const safeApps = Array.isArray(appsRes.data) ? appsRes.data : [];
                if (!Array.isArray(appsRes.data)) {
                    console.warn("Applications data is not an array:", appsRes.data);
                }
                setAppliedJobs(safeApps.map((app: any) => app.jobId))
            } catch (error) {
                console.error("Failed to fetch jobs", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleApply = async (jobId: string) => {
        setApplying(jobId)
        try {
            await api.post(`/candidates/apply/${jobId}`)
            setAppliedJobs(prev => [...prev, jobId])
            alert("Application submitted successfully!")
        } catch (error) {
            console.error("Failed to apply", error)
            alert("Failed to submit application. You might have already applied for this role.")
        } finally {
            setApplying(null)
        }
    }

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.department?.toLowerCase().includes(search.toLowerCase()) ||
        (job.skills && job.skills.some(s => s.toLowerCase().includes(search.toLowerCase())))
    )

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Open Opportunities</h1>
                    <p className="text-muted-foreground">Find the perfect role that matches your skills and career goals.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search jobs, skills, or departments..."
                            className="pl-9 bg-muted/50 border-none rounded-xl h-11"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-muted">
                        <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="font-semibold text-xl">No jobs found matching your criteria.</p>
                        <p className="text-muted-foreground">Try adjusting your search or check back later.</p>
                    </div>
                ) : filteredJobs.map((job, index) => (
                    <motion.div
                        key={job.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden group flex flex-col">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                        <Briefcase className="h-6 w-6" />
                                    </div>
                                    <Badge variant="outline" className="rounded-full bg-muted/50 border-none px-3 py-1 font-bold text-[10px] uppercase">
                                        {job.type || "Full Time"}
                                    </Badge>
                                </div>
                                <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{job.title}</CardTitle>
                                <CardDescription className="font-semibold text-primary">{job.department || "Engineering"}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4" />
                                        {job.location || "Remote"}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-4 w-4" />
                                        {new Date(job.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm line-clamp-3 text-muted-foreground leading-relaxed">
                                        {job.description}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {job.skills?.slice(0, 3).map(skill => (
                                        <Badge key={skill} variant="outline" className="text-[10px] bg-muted/30 border-none rounded-full px-2 py-0.5 font-bold">
                                            {skill}
                                        </Badge>
                                    ))}
                                    {(job.skills?.length || 0) > 3 && (
                                        <span className="text-[10px] text-muted-foreground font-bold">+{(job.skills?.length || 0) - 3}</span>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4 border-t border-muted/50 bg-muted/10">
                                {appliedJobs.includes(job.id) ? (
                                    <Button disabled className="w-full rounded-2xl h-11 bg-green-500/10 text-green-600 border-none hover:bg-green-500/10 font-bold gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Applied
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full rounded-2xl h-11 font-bold shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all gap-2"
                                        onClick={() => handleApply(job.id)}
                                        disabled={applying === job.id}
                                    >
                                        {applying === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                                        Apply Now
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}
