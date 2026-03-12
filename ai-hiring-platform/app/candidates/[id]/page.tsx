/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
"use client"

import { useEffect, useState, use } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    ArrowLeft,
    Mail,
    MapPin,
    Linkedin,
    Globe,
    Briefcase,
    Calendar,
    Video,
    Loader2,
    MessageSquare,
    ChevronDown,
    MapPin as MapPinIcon,
    Clock,
    Download,
    TrendingUp,
    XCircle,
    CheckCircle2,
    FileText,
    SendHorizonal
} from "lucide-react"
import Link from "next/link"
import api from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { motion } from "framer-motion"

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const id = resolvedParams.id
    const [candidate, setCandidate] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [resumeText, setResumeText] = useState<string | null>(null)
    const [fetchingResume, setFetchingResume] = useState(false)
    // Track which applications already have invites sent (keyed by applicationId)
    const [invitedApps, setInvitedApps] = useState<Set<string>>(new Set())
    const [invitingApp, setInvitingApp] = useState<string | null>(null)

    const fetchDetails = async () => {
        try {
            const response = await api.get(`/candidates/${id}/details`)
            const data = response.data
            setCandidate(data)
            // Pre-populate invitedApps only from ACTIVE (non-completed) interviews.
            // Completed interviews should NOT block a fresh re-invite.
            const alreadyInvited = new Set<string>(
                data.interviews
                    ?.filter((iv: any) => iv.status === 'created' || iv.status === 'in_progress')
                    ?.map((iv: any) => iv.applicationId)
                    ?.filter(Boolean) || []
            )
            setInvitedApps(alreadyInvited)
        } catch (error) {
            console.error("Failed to fetch candidate details", error)
            toast.error("Failed to load candidate profile")
        } finally {
            setLoading(false)
        }
    }

    const fetchResume = async () => {
        if (resumeText || fetchingResume) return
        setFetchingResume(true)
        try {
            const response = await api.get(`/candidates/${id}/resume`)
            setResumeText(response.data.resumeText)
        } catch (error) {
            console.error("Failed to fetch resume", error)
            toast.error("Failed to load resume content")
        } finally {
            setFetchingResume(false)
        }
    }

    useEffect(() => {
        fetchDetails()
    }, [id])

    const handleStatusUpdate = async (applicationId: string, status: string) => {
        setUpdating(true)
        try {
            await api.post(`/candidates/applications/${applicationId}/status`, { status })
            toast.success(`Status updated to ${status}`)
            fetchDetails()
        } catch (error) {
            console.error("Failed to update status", error)
            toast.error("Status update failed")
        } finally {
            setUpdating(false)
        }
    }

    const handleInviteToInterview = async (applicationId: string, jobTitle: string) => {
        setInvitingApp(applicationId)
        try {
            await api.post('/interviews/invite', {
                candidateId: candidate.id,
                applicationId,
            })
            const name = `${candidate.user?.firstName ?? ''} ${candidate.user?.lastName ?? ''}`.trim() || 'the candidate'
            toast.success(
                `🎉 Interview invitation sent to ${name} for "${jobTitle}"! They can join from their dashboard.`,
                { duration: 6000 }
            )
            setInvitedApps(prev => new Set([...prev, applicationId]))
            fetchDetails()
        } catch (error: any) {
            console.error("Failed to send interview invitation", error)
            const msg = error?.response?.data?.message || "Failed to send interview invitation."
            toast.error(msg)
        } finally {
            setInvitingApp(null)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )

    if (!candidate) return <div className="p-20 text-center">Candidate not found</div>

    const name = `${candidate.user?.firstName} ${candidate.user?.lastName}`
    const initials = `${candidate.user?.firstName?.[0]}${candidate.user?.lastName?.[0]}`

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link href="/candidates">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Talent Profile</h1>
                    <p className="text-muted-foreground font-medium">Review and manage candidate applications.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* LEFT: Candidate Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-slate-100">
                        <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5" />
                        <CardHeader className="relative pt-0 pb-4">
                            <div className="-mt-12 flex flex-col items-center">
                                <Avatar className="h-24 w-24 border-4 border-white shadow-lg rounded-2xl">
                                    <AvatarImage src={candidate.avatarUrl} />
                                    <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="mt-4 text-center">
                                    <h2 className="text-2xl font-bold">{name}</h2>
                                    <p className="text-primary font-bold text-sm uppercase tracking-wider">{candidate.title || "Applicant"}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    {candidate.user?.email}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                    <MapPin className="h-4 w-4 text-slate-400" />
                                    {candidate.location || "Remote"}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                    <Briefcase className="h-4 w-4 text-slate-400" />
                                    {candidate.experienceYears} Years Exp.
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-3">Core Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {candidate.skills?.map((skill: string) => (
                                            <Badge key={skill} variant="secondary" className="rounded-lg px-2.5 py-1 font-bold bg-slate-100 text-slate-700">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {candidate.linkedinUrl && (
                                        <Button variant="outline" size="icon" asChild className="rounded-xl">
                                            <a href={candidate.linkedinUrl} target="_blank"><Linkedin className="h-4 w-4" /></a>
                                        </Button>
                                    )}
                                    {candidate.portfolioUrl && (
                                        <Button variant="outline" size="icon" asChild className="rounded-xl">
                                            <a href={candidate.portfolioUrl} target="_blank"><Globe className="h-4 w-4" /></a>
                                        </Button>
                                    )}

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="rounded-xl gap-2 font-bold text-xs flex-1"
                                                onClick={fetchResume}
                                            >
                                                <FileText className="h-4 w-4" /> View Resume
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Candidate Resume</DialogTitle>
                                            </DialogHeader>
                                            {fetchingResume ? (
                                                <div className="flex flex-col items-center justify-center p-12">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                                    <p className="text-sm font-medium text-slate-400">Loading resume content...</p>
                                                </div>
                                            ) : (
                                                <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed p-4 bg-slate-50 border border-slate-100 rounded-xl dark:bg-card dark:border-border dark:text-muted-foreground">
                                                    {resumeText || "No resume content available."}
                                                </div>
                                            )}
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-3xl p-6 bg-slate-900 text-white">
                        <div className="space-y-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <TrendingUp size={18} className="text-primary" />
                                About
                            </h3>
                            <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                {candidate.bio || "No bio provided by the candidate."}
                            </p>
                        </div>
                    </Card>
                </div>

                {/* RIGHT: Applications & History */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Work History */}
                    {candidate.experiences?.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Briefcase className="text-primary" size={20} />
                                Work History
                            </h3>
                            <div className="space-y-4">
                                {candidate.experiences.map((exp: any) => (
                                    <div key={exp.id} className="p-6 rounded-3xl bg-white ring-1 ring-slate-100 shadow-sm border-none">
                                        <div className="flex gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                                <Briefcase className="h-6 w-6 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                    <div>
                                                        <h4 className="font-bold text-lg">{exp.role}</h4>
                                                        <p className="text-primary font-bold">{exp.employer}</p>
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-wider">
                                                        {new Date(exp.startDate).toLocaleDateString()} - {exp.isCurrent ? "Present" : new Date(exp.endDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                {exp.description && (
                                                    <p className="mt-4 text-sm text-slate-600 font-medium leading-relaxed">
                                                        {exp.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Applications */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Briefcase className="text-primary" size={20} />
                            Active Applications
                        </h3>
                        {candidate.applications?.map((app: any) => {
                            const isInvited = invitedApps.has(app.id)
                            const isInviting = invitingApp === app.id
                            const canRejectOrHire = !['rejected', 'rejected_ai', 'rejected_post_interview', 'selected'].includes(
                                app.status.toLowerCase()
                            )

                            return (
                                <Card key={app.id} className="border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-slate-100">
                                    <CardHeader className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <CardTitle className="text-lg">{app.job?.title}</CardTitle>
                                                <CardDescription className="flex items-center gap-2 mt-1 font-medium">
                                                    <Calendar size={14} /> Applied on {new Date(app.createdAt).toLocaleDateString()}
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isInvited && (
                                                    <Badge className="rounded-full px-3 py-1 bg-green-100 text-green-700 border-green-200 font-bold text-[10px] uppercase">
                                                        Invited ✓
                                                    </Badge>
                                                )}
                                                <Badge className="w-fit rounded-full px-4 py-1 font-bold uppercase text-[10px]">
                                                    {app.status.replace(/_/g, ' ')}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 bg-slate-50/50 border-t border-slate-100">
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-8">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400">AI Resume Score</span>
                                                    <span className="text-xl font-bold text-primary">{app.resumeScore}%</span>
                                                </div>
                                                {app.interviewScore !== null && (
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400">Interview Score</span>
                                                        <span className="text-xl font-bold text-blue-600">{app.interviewScore}%</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap justify-end">
                                                {canRejectOrHire && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            className="flex-1 md:flex-none rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold"
                                                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                                            disabled={updating || isInviting}
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" /> Reject
                                                        </Button>
                                                        <Button
                                                            className="flex-1 md:flex-none rounded-xl font-bold shadow-lg shadow-primary/20"
                                                            onClick={() => handleStatusUpdate(app.id, 'selected')}
                                                            disabled={updating || isInviting}
                                                        >
                                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Hire Direct
                                                        </Button>
                                                    </>
                                                )}

                                                <Button
                                                    variant="outline"
                                                    className={`flex-1 md:flex-none rounded-xl font-bold transition-all ${isInvited
                                                        ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                                                        : 'border-primary/20 text-primary hover:bg-primary/5'
                                                        }`}
                                                    onClick={() => !isInvited && handleInviteToInterview(app.id, app.job?.title || 'Role')}
                                                    disabled={isInviting || updating || isInvited}
                                                >
                                                    {isInviting ? (
                                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                                                    ) : isInvited ? (
                                                        <><CheckCircle2 className="mr-2 h-4 w-4" /> Invited ✓</>
                                                    ) : (
                                                        <><SendHorizonal className="mr-2 h-4 w-4" /> Invite to Interview</>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Interview History */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Video className="text-primary" size={20} />
                            Interview Insights
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {candidate.interviews?.map((interview: any) => (
                                <Card key={interview.id} className="border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-slate-100 hover:shadow-md transition-shadow">
                                    <CardHeader className="p-5">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-sm">{interview.job?.title}</CardTitle>
                                                <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">
                                                    {new Date(interview.createdAt).toDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-primary">{interview.score / 10}/10</div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">AI Rating</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-500">Status</span>
                                            <Badge variant="secondary" className="rounded-full text-[10px] px-2 uppercase">
                                                {interview.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-500">Fit Decision</span>
                                            <Badge variant={interview.fitDecision === 'YES' ? 'default' : 'destructive'} className="rounded-full text-[10px] px-2">
                                                {interview.fitDecision || 'PENDING'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-500">Join probability</span>
                                            <span className="text-xs font-bold text-green-600">{interview.joinProbability}%</span>
                                        </div>
                                        <TranscriptToggle transcript={interview.transcript} />
                                    </CardContent>
                                </Card>
                            ))}
                            {candidate.interviews?.length === 0 && (
                                <div className="col-span-2 p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <Video className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                                    <p className="text-sm font-medium text-slate-500">No interviews conducted yet.</p>
                                    <p className="text-xs text-slate-400 mt-1">Use the "Invite to Interview" button above to send an invitation.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function TranscriptToggle({ transcript }: { transcript: any[] }) {
    const [isOpen, setIsOpen] = useState(false);

    if (!transcript || transcript.length === 0) return null;

    return (
        <div className="pt-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-2 mb-2"
            >
                <MessageSquare size={12} />
                {isOpen ? "Hide Transcript" : "View Transcript"}
                <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar animate-in slide-in-from-top-1 duration-200">
                    {transcript.map((msg: any, idx: number) => (
                        <div key={idx} className={`flex flex-col ${msg.speaker === 'Candidate' ? 'items-end' : 'items-start'}`}>
                            <span className="text-[9px] font-bold text-slate-400 uppercase mb-1 px-1">
                                {msg.speaker === 'AI' ? 'AI Recruiter' : 'Candidate'}
                            </span>
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed ${msg.speaker === 'Candidate'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-slate-100 text-slate-800 rounded-tl-none'
                                }`}>
                                {msg.message}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
