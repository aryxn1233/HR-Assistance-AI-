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
import { getFreshToken } from "@/lib/tokenManager"

export default function CandidateInterviewsPage() {
    const [interviews, setInterviews] = useState<any[]>([])
    const [applications, setApplications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [startingId, setStartingId] = useState<string | null>(null)

    useEffect(() => {
        const fetchInterviews = async () => {
            try {
                const [interRes, appsRes] = await Promise.all([
                    api.get('/interviews'),
                    api.get('/candidates/applications')
                ])
                setInterviews(interRes.data)
                setApplications(appsRes.data)
            } catch (error) {
                console.error("Failed to fetch interviews or applications", error)
            } finally {
                setLoading(false)
            }
        }
        fetchInterviews()
    }, [])

    const handleStartInterview = async (applicationId: string) => {
        setStartingId(applicationId)
        try {
            const response = await api.post(`/interviews/start-with-app/${applicationId}`)
            const data = response.data
            // The response is { status, question } where question contains interviewId
            const interviewId = data.question?.interviewId || data.id
            if (!interviewId) {
                alert("Interview started but could not get interview ID. Please refresh and check Interviews page.")
                return
            }
            // Redirect to the standalone D-ID interview project with sync context
            const token = await getFreshToken();
            const streamUrl = process.env.NEXT_PUBLIC_DID_STREAMING_URL || 'http://localhost:3001';
            window.location.href = `${streamUrl}?applicationId=${applicationId}&interviewId=${interviewId}&token=${token}`;
        } catch (error: any) {
            console.error("Failed to start interview", error)
            const msg = error?.response?.data?.message || "Failed to start interview. Please try again."
            alert(msg)
        } finally {
            setStartingId(null)
        }
    }

    const safeInterviews = Array.isArray(interviews) ? interviews : [];
    const upcomingInterviews = safeInterviews.filter(i => i.status === 'created' || i.status === 'in_progress')
    const pastInterviews = safeInterviews.filter(i => i.status === 'completed')

    const rejectedStatuses = ['rejected', 'rejected_ai', 'rejected_post_interview', 'selected', 'hold', 'completed']
    // Show interview opportunity for any active application that doesn't have an interview session yet
    const eligibleApplications = Array.isArray(applications)
        ? applications.filter(app =>
            !rejectedStatuses.includes(app.status.toLowerCase()) &&
            !safeInterviews.find(i => i.applicationId === app.id)
        )
        : []

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

            {/* New Invitations Section */}
            {eligibleApplications.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <h2 className="text-xl font-bold">Interview Opportunities</h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        {eligibleApplications.map((app) => (
                            <motion.div key={app.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                <Card className="border-none shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-l-4 border-primary">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <Badge className="bg-yellow-500 text-white rounded-full px-3 font-bold border-none shadow-sm">
                                                ELIGIBLE
                                            </Badge>
                                            <Brain className="h-5 w-5 text-primary opacity-50" />
                                        </div>
                                        <CardTitle className="pt-2 text-xl">{app.job?.title || "Role"}</CardTitle>
                                        <CardDescription className="font-bold text-primary">{app.job?.department || "Company"}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="py-4">
                                        <p className="text-sm text-foreground/70 leading-relaxed">
                                            Great news! Your profile matched the requirements. You are invited to take the AI interview for this position.
                                        </p>
                                    </CardContent>
                                    <CardFooter className="pt-2 pb-6">
                                        <Button
                                            onClick={() => handleStartInterview(app.id)}
                                            disabled={startingId === app.id}
                                            className="w-full rounded-xl h-12 font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 transition-all gap-2"
                                        >
                                            {startingId === app.id ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <>
                                                    Start AI Interview
                                                    <ArrowRight className="h-5 w-5" />
                                                </>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            <section className="space-y-4">
                <h2 className="text-xl font-bold">Upcoming Sessions</h2>
                {upcomingInterviews.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {upcomingInterviews.map((interview) => (
                            <motion.div key={interview.id} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                                <Card className="border-none shadow-sm rounded-2xl overflow-hidden ring-1 ring-primary/20">
                                    <CardHeader className="bg-primary/5 pb-4">
                                        <div className="flex items-center justify-between">
                                            <Badge className="bg-primary text-primary-foreground rounded-full px-3">
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
                                        <Button 
                                            onClick={async () => {
                                                const token = await getFreshToken() || '';
                                                window.location.href = `${process.env.NEXT_PUBLIC_DID_STREAMING_URL || 'http://localhost:3001'}?applicationId=${interview.applicationId}&interviewId=${interview.id}&token=${token}`;
                                            }}
                                            className="w-full rounded-xl h-11 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                                                Join Interview Room
                                                <ArrowRight className="ml-2 h-4 w-4 font-bold" />
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
