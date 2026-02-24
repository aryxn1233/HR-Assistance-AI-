"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Briefcase,
    MapPin,
    Clock,
    Calendar,
    CheckCircle2,
    ArrowRight,
    Building2,
    GraduationCap,
    Users
} from "lucide-react"
import { JobApplications } from "./JobApplications"

interface Job {
    id: string
    title: string
    description: string
    department?: string
    location?: string
    type?: string
    requiredSkills?: string[] | string
    minExperience?: number
    createdAt: string
}

interface JobDetailsDialogProps {
    job: Job
    trigger: React.ReactNode
    isApplied?: boolean
    onApply?: (jobId: string) => void
    isApplying?: boolean
    userRole?: 'candidate' | 'recruiter'
}

export function JobDetailsDialog({
    job,
    trigger,
    isApplied,
    onApply,
    isApplying,
    userRole = 'candidate'
}: JobDetailsDialogProps) {
    const skills = Array.isArray(job.requiredSkills)
        ? job.requiredSkills
        : typeof job.requiredSkills === 'string'
            ? job.requiredSkills.split(',')
            : []

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl">
                <DialogHeader>
                    <div className="flex justify-between items-start">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary mb-4">
                            <Briefcase className="h-6 w-6" />
                        </div>
                        <Badge variant="outline" className="rounded-full px-3 py-1 font-bold text-[10px] uppercase">
                            {job.type || "Full Time"}
                        </Badge>
                    </div>
                    <DialogTitle className="text-2xl font-bold">{job.title}</DialogTitle>
                    <DialogDescription className="text-primary font-semibold flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {job.department || "Engineering"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Key Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-2xl">
                            <MapPin className="h-4 w-4 text-primary" />
                            <div>
                                <p className="text-[10px] font-bold uppercase opacity-50 text-black">Location</p>
                                <p className="font-semibold text-black">{job.location || "Remote"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-2xl">
                            <GraduationCap className="h-4 w-4 text-primary" />
                            <div>
                                <p className="text-[10px] font-bold uppercase opacity-50 text-black">Experience</p>
                                <p className="font-semibold text-black">{job.minExperience || 0}+ Years</p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">About the role</h4>
                        <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                            {job.description}
                        </div>
                    </div>

                    {/* Skills */}
                    {skills.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Required Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {skills.map(skill => (
                                    <Badge key={skill} variant="secondary" className="bg-primary/5 text-primary border-none rounded-full px-3 py-1 font-semibold">
                                        {skill.trim()}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="flex items-center gap-4 pt-4 border-t border-muted/50 text-[10px] font-bold uppercase text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Posted {new Date(job.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                {userRole === 'recruiter' && (
                    <div className="mt-6 pt-6 border-t border-muted/50">
                        <JobApplications jobId={job.id} />
                    </div>
                )}

                {userRole === 'candidate' && (
                    <div className="mt-4">
                        {isApplied ? (
                            <Button disabled className="w-full rounded-2xl h-12 bg-green-500/10 text-green-600 border-none font-bold gap-2">
                                <CheckCircle2 className="h-5 w-5" />
                                Applied
                            </Button>
                        ) : (
                            <Button
                                className="w-full rounded-2xl h-12 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all gap-2"
                                onClick={() => onApply?.(job.id)}
                            >
                                {isApplying ? "Applying..." : "Apply for this Position"}
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
