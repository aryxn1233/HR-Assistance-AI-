"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    ChevronDown,
    ChevronUp,
    Briefcase,
    Calendar,
    Brain,
    User,
    CheckCircle2,
    XCircle,
    TrendingUp,
    MessageSquare,
    FileText,
    Loader2
} from "lucide-react"
import api from "@/lib/api"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function InterviewsPage() {
    const [interviews, setInterviews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    useEffect(() => {
        const fetchInterviews = async () => {
            try {
                const response = await api.get('/interviews')
                setInterviews(response.data.filter((i: any) => i.status === 'completed'))
            } catch (error) {
                console.error("Failed to fetch interviews", error)
            } finally {
                setLoading(false)
            }
        }
        fetchInterviews()
    }, [])

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id)
    }

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Interview Intelligence</h1>
                <p className="text-muted-foreground">Review AI-evaluated candidate sessions and hiring recommendations.</p>
            </div>

            <div className="grid gap-6">
                {interviews.length === 0 ? (
                    <Card className="p-20 text-center border-dashed border-2">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                        <h2 className="text-xl font-bold">No completed interviews yet</h2>
                        <p className="text-muted-foreground">Once candidates finish their AI interviews, they will appear here.</p>
                    </Card>
                ) : (
                    interviews.map((interview) => (
                        <Card key={interview.id} className="border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all ring-1 ring-slate-100">
                            <CardHeader className="p-6 cursor-pointer" onClick={() => toggleExpand(interview.id)}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {interview.candidate?.user?.firstName?.[0] || <User size={20} />}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">
                                                {interview.candidate?.user?.firstName} {interview.candidate?.user?.lastName}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-1.5 font-medium">
                                                <Briefcase size={12} /> {interview.job?.title}
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex flex-col items-center px-4 border-l border-r border-slate-100">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overall Rating</span>
                                            <span className="text-xl font-bold text-primary">{interview.score / 10}/10</span>
                                        </div>
                                        <div className="flex flex-col items-center px-4">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fit Decision</span>
                                            <Badge variant={interview.fitDecision === 'YES' ? 'default' : 'destructive'} className="mt-1 rounded-full px-3">
                                                {interview.fitDecision || 'N/A'}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-col items-center px-4 border-l border-slate-100">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Join Probability</span>
                                            <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-700">
                                                <TrendingUp size={14} className="text-green-500" />
                                                {interview.joinProbability}%
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="rounded-full ml-2">
                                            {expandedId === interview.id ? <ChevronUp /> : <ChevronDown />}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <AnimatePresence>
                                {expandedId === interview.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <Separator />
                                        <CardContent className="p-8 bg-slate-50/50">
                                            <div className="grid lg:grid-cols-2 gap-8">
                                                {/* AI Report Section */}
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Brain className="text-primary h-5 w-5" />
                                                        <h3 className="font-bold text-lg">AI Comprehensive Report</h3>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <Card className="p-4 border-none shadow-sm rounded-2xl bg-white">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Technical Core</p>
                                                            <div className="text-2xl font-bold">{interview.report?.detailedAnalysis?.technical_score}/10</div>
                                                        </Card>
                                                        <Card className="p-4 border-none shadow-sm rounded-2xl bg-white">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Communication</p>
                                                            <div className="text-2xl font-bold">{interview.report?.detailedAnalysis?.communication_score}/10</div>
                                                        </Card>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="p-4 rounded-2xl bg-white border border-slate-100">
                                                            <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                                                <CheckCircle2 size={16} className="text-green-500" /> Strengths
                                                            </h4>
                                                            <ul className="text-sm text-slate-600 space-y-1 ml-6 list-disc">
                                                                {interview.report?.detailedAnalysis?.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                                            </ul>
                                                        </div>
                                                        <div className="p-4 rounded-2xl bg-white border border-slate-100">
                                                            <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                                                <XCircle size={16} className="text-red-500" /> Areas to Watch
                                                            </h4>
                                                            <ul className="text-sm text-slate-600 space-y-1 ml-6 list-disc">
                                                                {interview.report?.detailedAnalysis?.weaknesses?.map((w: string, i: number) => <li key={i}>{w}</li>)}
                                                            </ul>
                                                        </div>
                                                    </div>

                                                    <div className="p-6 rounded-2xl bg-primary text-primary-foreground space-y-3">
                                                        <h4 className="font-bold flex items-center gap-2">
                                                            <FileText size={18} /> Joining Reasoning
                                                        </h4>
                                                        <p className="text-sm opacity-90 leading-relaxed">
                                                            {interview.report?.detailedAnalysis?.joining_reasoning}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Transcript Section */}
                                                <div className="flex flex-col h-[500px]">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <MessageSquare className="text-primary h-5 w-5" />
                                                            <h3 className="font-bold text-lg">Interview Transcript</h3>
                                                        </div>
                                                        <Badge variant="outline" className="rounded-full">Full Session</Badge>
                                                    </div>
                                                    <Card className="flex-1 border-none shadow-sm rounded-3xl bg-white flex flex-col overflow-hidden">
                                                        <ScrollArea className="flex-1 p-6">
                                                            <div className="space-y-6">
                                                                {interview.transcript?.map((msg: any, i: number) => (
                                                                    <div key={i} className={`flex flex-col ${msg.speaker === 'Candidate' ? 'items-end' : 'items-start'}`}>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                                                {msg.speaker === 'AI' ? 'AI Recruiter' : 'Candidate'}
                                                                            </span>
                                                                        </div>
                                                                        <div className={`max-w-[90%] p-4 rounded-2xl text-sm ${msg.speaker === 'Candidate'
                                                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                                                            : 'bg-slate-100 text-slate-800 rounded-tl-none'
                                                                            }`}>
                                                                            {msg.message}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </ScrollArea>
                                                    </Card>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}

