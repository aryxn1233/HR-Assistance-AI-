"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Video, Calendar, Clock, ArrowRight, Brain, Zap, Loader2 } from "lucide-react"
import Link from "next/link"
import api from "@/lib/api"

export default function CandidateInterviewsPage() {
    const [interviews, setInterviews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchInterviews = async () => {
            try {
                const response = await api.get('/interviews')
                setInterviews(response.data)
            } catch (error) {
                console.error("Failed to fetch interviews", error)
            } finally {
                setLoading(false)
            }
        }
        fetchInterviews()
    }, [])

    const safeInterviews = Array.isArray(interviews) ? interviews : [];
    if (!Array.isArray(interviews)) {
        console.warn("Interviews data is not an array:", interviews);
    }
    const upcomingInterviews = safeInterviews.filter(i => i.status === 'Scheduled' || i.status === 'In Progress')
    const pastInterviews = safeInterviews.filter(i => i.status === 'Completed')

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Interviews</h1>
                <p className="text-muted-foreground">Prepare and participate in your scheduled AI video interviews.</p>
            </div>

            <section className="space-y-4">
                <h2 className="text-xl font-bold">Upcoming Sessions</h2>
                {upcomingInterviews.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {upcomingInterviews.map((interview) => (
                            <motion.div key={interview.id} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                                <Card className="border-none shadow-sm rounded-2xl overflow-hidden ring-1 ring-primary/20">
                                    <CardHeader className="bg-primary/5 pb-4">
                                        <div className="flex items-center justify-between">
                                            <Badge className="bg-primary text-primary-foreground rounded-full px-3 animate-pulse">
                                                {interview.status}
                                            </Badge>
                                            <div className="flex items-center gap-1 text-xs font-bold text-primary uppercase tracking-wider">
                                                <Video className="h-3 w-3" />
                                                Video
                                            </div>
                                        </div>
                                        <CardTitle className="pt-2">{interview.job?.title || "Role"}</CardTitle>
                                        <CardDescription className="font-semibold text-primary">{interview.job?.department || "Company"}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                            </div>
                                            <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                            </div>
                                            <span>Flexible Time</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-muted/30 pt-4 pb-4">
                                        <Button asChild className="w-full rounded-xl h-11 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                                            <Link href={`/candidate/interviews/${interview.id}`}>
                                                Join Interview Room
                                                <ArrowRight className="ml-2 h-4 w-4 font-bold" />
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 bg-muted/10 rounded-2xl border-2 border-dashed border-muted">
                        <Video className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-semibold">No upcoming interviews</p>
                        <p className="text-sm text-muted-foreground">New scheduled sessions will appear here.</p>
                    </div>
                )}
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-bold">Past Assessments</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pastInterviews.map((interview) => (
                        <Card key={interview.id} className="border-none shadow-sm rounded-2xl hover:shadow-md transition-all">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center font-bold text-muted-foreground">
                                        {interview.job?.department?.[0] || 'J'}
                                    </div>
                                    <Badge variant="secondary" className="rounded-full font-bold text-[10px] uppercase">
                                        {interview.status}
                                    </Badge>
                                </div>
                                <CardTitle className="text-base pt-3">{interview.job?.title}</CardTitle>
                                <CardDescription>{interview.job?.department}</CardDescription>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Brain className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-bold">{interview.score} / 100</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(interview.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${interview.score}%` }}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0">
                                <Button variant="ghost" size="sm" className="w-full rounded-lg text-primary hover:bg-primary/5 hover:text-primary font-bold" asChild>
                                    <Link href="/candidate/reports">
                                        View Evaluation Detail
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
        </motion.div>
    )
}
