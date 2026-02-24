"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import Link from "next/link"
import api from "@/lib/api"

export function ApplicationsList() {
    const [applications, setApplications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [startingId, setStartingId] = useState<string | null>(null)

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const response = await api.get('/candidates/applications')
                setApplications(response.data)
            } catch (error) {
                console.error("Failed to fetch applications", error)
            } finally {
                setLoading(false)
            }
        }
        fetchApps()
    }, [])

    const handleStartInterview = async (applicationId: string) => {
        setStartingId(applicationId)
        try {
            const response = await api.post(`/interviews/start-with-app/${applicationId}`)
            const interview = response.data
            window.location.href = `/candidate/interviews/${interview.id || interview.question?.interviewId}`
        } catch (error) {
            console.error("Failed to start interview", error)
            alert("Failed to start interview. Please try again.")
        } finally {
            setStartingId(null)
        }
    }

    if (loading) return <div className="p-10 text-center text-muted-foreground animate-pulse">Loading your applications...</div>

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Your Applications</h2>
            {applications.length === 0 ? (
                <Card className="rounded-2xl border-none shadow-sm p-8 text-center text-muted-foreground italic">
                    You haven't applied for any jobs yet.
                </Card>
            ) : applications.map((app) => {
                const isEligible = app.status === 'interview_eligible';
                const hasScore = app.resumeScore !== undefined;

                return (
                    <Card key={app.id} className={`rounded-2xl border-none shadow-sm transition-all ${isEligible ? "ring-2 ring-primary bg-primary/5" : ""}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-bold">
                                {app.job?.title || "Role"}
                            </CardTitle>
                            <Badge
                                variant={isEligible ? "default" : "secondary"}
                                className={isEligible ? "bg-green-500 text-white animate-pulse" : ""}
                            >
                                {app.status?.replace('_', ' ').toUpperCase()}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mt-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">{app.job?.department || ""}</p>
                                    {hasScore && (
                                        <p className="text-sm font-semibold mt-1">
                                            Resume Score: <span className="text-primary">{app.resumeScore}</span>
                                        </p>
                                    )}
                                </div>
                                {isEligible ? (
                                    <Button
                                        size="sm"
                                        className="gap-2 rounded-xl font-bold shadow-lg shadow-primary/20"
                                        onClick={() => handleStartInterview(app.id)}
                                        disabled={startingId === app.id}
                                    >
                                        {startingId === app.id ? "Loading..." : (
                                            <>
                                                <Play className="h-4 w-4" /> Start Interview
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <Button variant="ghost" size="sm" asChild className="text-xs">
                                        <Link href="/candidate/applications">View Details</Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    )
}
