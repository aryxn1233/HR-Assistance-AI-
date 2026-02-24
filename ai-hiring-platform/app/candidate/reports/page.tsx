"use client"

import { motion } from "framer-motion"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import {
    ResponsiveContainer,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis
} from 'recharts'
import {
    Download,
    Brain,
    Sparkles,
    Target,
    Lightbulb,
    Loader2
} from "lucide-react"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function CandidateReportsPage() {
    const [report, setReport] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchReport = async () => {
            try {
                // Get the most recent completed interview
                const response = await api.get('/interviews')
                const completed = response.data.filter((i: any) => i.status === 'completed')
                if (completed.length > 0) {
                    setReport(completed[0])
                }
            } catch (error) {
                console.error("Failed to fetch report", error)
            } finally {
                setLoading(false)
            }
        }
        fetchReport()
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )

    if (!report) return (
        <div className="text-center p-20 space-y-4">
            <Brain className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
            <h2 className="text-2xl font-bold">No reports available yet.</h2>
            <p className="text-muted-foreground">Complete an interview to see your AI analysis here.</p>
        </div>
    )

    // Map backend feedback to radarData structure
    const analysis = report.report?.detailedAnalysis || report.feedback;

    const radarData = [
        { subject: 'Communication', A: (analysis?.communication_score * 10) || (analysis?.scores?.communication) || 80, fullMark: 100 },
        { subject: 'Technical skills', A: (analysis?.technical_score * 10) || (analysis?.scores?.technical) || 70, fullMark: 100 },
        { subject: 'Problem Solving', A: (analysis?.problem_solving_score * 10) || (analysis?.scores?.problemSolving) || 65, fullMark: 100 },
        { subject: 'Behavioral', A: (analysis?.behavioral_score * 10) || (analysis?.scores?.behavioral) || 75, fullMark: 100 },
        { subject: 'Culture Fit', A: (analysis?.culture_fit_score * 10) || (analysis?.scores?.culture) || 85, fullMark: 100 },
    ]
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Reports & Feedback</h1>
                    <p className="text-muted-foreground">Deep dive into your AI-generated interview performance analysis.</p>
                </div>
                <Button className="rounded-xl h-11 font-bold shadow-lg shadow-primary/20">
                    <Download className="mr-2 h-4 w-4" />
                    Download Full Report
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                {/* Left: Chart */}
                <Card className="lg:col-span-3 border-none shadow-sm rounded-3xl overflow-hidden p-6 bg-white dark:bg-card">
                    <CardHeader className="px-0 pt-0 pb-6">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Brain className="h-5 w-5 text-primary" />
                            Performance Breakdown
                        </CardTitle>
                    </CardHeader>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
                                />
                                <PolarRadiusAxis
                                    angle={30}
                                    domain={[0, 100]}
                                    tick={false}
                                    axisLine={false}
                                />
                                <Radar
                                    name="Performance"
                                    dataKey="A"
                                    stroke="hsl(var(--primary))"
                                    fill="hsl(var(--primary))"
                                    fillOpacity={0.4}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Right: AI Summary */}
                <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl p-8 space-y-6 bg-primary text-primary-foreground relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Sparkles className="h-32 w-32" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="space-y-2">
                            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md px-3 font-bold">AI EXECUTIVE SUMMARY</Badge>
                            <h2 className="text-3xl font-bold pt-2">
                                {report.score > 80 ? "Exceptional potential." : "Growing consistently."}
                            </h2>
                        </div>
                        <p className="text-primary-foreground/90 leading-relaxed text-lg italic">
                            "{analysis?.detailed_feedback || analysis?.summary || "Your AI analysis is being processed. Check back soon for deep insights into your performance."}"
                        </p>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-white/60 mb-1">Overall Rating</p>
                                <p className="text-2xl font-bold font-mono">{report.score}/100</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-white/60 mb-1">Fit for Role</p>
                                <p className="text-2xl font-bold font-mono">{report.fitDecision || "PENDING"}</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-sm rounded-3xl p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Target className="h-5 w-5 text-green-500" />
                        Key Strengths
                    </h3>
                    <ul className="space-y-4">
                        {(analysis?.strengths || [
                            "Articulate communication of design rationale.",
                            "Strong grasp of technical constraints and feasibility.",
                        ]).map((strength: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm font-medium p-4 rounded-2xl bg-green-500/5 text-green-700 dark:text-green-400">
                                <span className="flex-shrink-0 h-5 w-5 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">✓</span>
                                {strength}
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card className="border-none shadow-sm rounded-3xl p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-amber-500" />
                        Areas for Improvement
                    </h3>
                    <ul className="space-y-4">
                        {(analysis?.weaknesses || [
                            "Further deep dive into data-driven design metrics.",
                            "Exploring more divergent ideation during whiteboarding.",
                        ]).map((growth: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm font-medium p-4 rounded-2xl bg-amber-500/5 text-amber-700 dark:text-amber-400">
                                <span className="flex-shrink-0 h-5 w-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">!</span>
                                {growth}
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </motion.div>
    )

}
