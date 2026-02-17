"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import {
    User,
    Mail,
    Linkedin,
    Globe,
    FileText,
    MapPin,
    Briefcase,
    GraduationCap,
    Loader2,
    Calendar,
    ChevronLeft
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import Link from "next/link"

export default function PublicProfilePage() {
    const { id } = useParams()
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get(`/candidates/${id}`)
                setProfile(response.data)
            } catch (error) {
                console.error("Failed to fetch public profile", error)
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchProfile()
    }, [id])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )

    if (!profile) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold">Profile not found</h2>
            <Link href="/candidate">
                <Button variant="link" className="mt-4">Return to Dashboard</Button>
            </Link>
        </div>
    )

    const user = profile.user

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <Link href="/candidate/profile">
                <Button variant="ghost" size="sm" className="gap-2 mb-4 hover:bg-muted/50 rounded-xl">
                    <ChevronLeft className="h-4 w-4" />
                    Back to Settings
                </Button>
            </Link>

            {/* Header / Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-gradient-to-br from-primary/5 via-background to-primary/5 rounded-[2.5rem] border border-primary/10 p-8 md:p-12 overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />

                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                    <div className="h-40 w-40 rounded-[2rem] bg-card border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User className="h-20 w-20 text-primary" />
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                                {user?.firstName} {user?.lastName}
                            </h1>
                            <p className="text-xl text-primary font-bold">{profile.title || "Professional Profile"}</p>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {profile.location || "Remote"}
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {user?.email}
                            </div>
                            {profile.linkedinUrl && (
                                <a href={profile.linkedinUrl} target="_blank" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <Linkedin className="h-4 w-4" />
                                    LinkedIn
                                </a>
                            )}
                            {profile.portfolioUrl && (
                                <a href={profile.portfolioUrl} target="_blank" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <Globe className="h-4 w-4" />
                                    Portfolio
                                </a>
                            )}
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                            {profile.skills?.map((skill: string) => (
                                <Badge key={skill} className="bg-white/80 dark:bg-muted/50 backdrop-blur-sm shadow-sm text-primary border-none px-4 py-1.5 rounded-xl font-bold">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Column: About & Info */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="space-y-4 px-4">
                        <h3 className="text-2xl font-bold">About</h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            {profile.bio || "No professional bio provided yet."}
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h3 className="text-2xl font-bold px-4">Experience</h3>
                        <Card className="border-none shadow-sm rounded-3xl p-8 bg-muted/20">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                    <Briefcase className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-lg">{profile.title || "Candidate"}</h4>
                                    <p className="text-muted-foreground">Years of Experience: {profile.experienceYears || 0} years</p>
                                    <p className="text-sm text-muted-foreground pt-2">
                                        Relevant skills: {profile.skills?.join(", ")}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </section>
                </div>

                {/* Right Column: Quick Stats & Resume */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm rounded-3xl p-8 space-y-6 bg-primary text-white">
                        <h3 className="text-xl font-bold">Profile Status</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="opacity-80">Experience</span>
                                <span className="font-bold">{profile.experienceYears || 0} Years</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="opacity-80">Skills</span>
                                <span className="font-bold">{profile.skills?.length || 0} Verified</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="opacity-80">Joined</span>
                                <span className="font-bold">{new Date(profile.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl font-bold h-12 shadow-xl shadow-primary/20">
                            Hire {user?.firstName}
                        </Button>
                    </Card>

                    <Card className="border-none shadow-sm rounded-3xl p-8 space-y-4">
                        <h3 className="text-xl font-bold">Full Resume</h3>
                        <p className="text-sm text-muted-foreground">Original resume text provided during application.</p>
                        <div className="p-4 bg-muted/50 rounded-2xl max-h-60 overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap font-sans text-muted-foreground leading-relaxed">
                                {profile.resumeText || "Resume text not available."}
                            </pre>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
