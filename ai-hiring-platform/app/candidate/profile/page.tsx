"use client"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/auth-context"
import {
    User,
    Mail,
    Linkedin,
    Globe,
    FileText,
    Plus,
    X,
    Briefcase,
    GraduationCap,
    CheckCircle2,
    Loader2,
    MapPin,
    Camera,
    Calendar
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import api from "@/lib/api"
import Link from "next/link"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function CandidateProfilePage() {
    const { user, refreshUser } = useAuth()
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [resumeUploading, setResumeUploading] = useState(false)
    const [stats, setStats] = useState<any>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const resumeFileInputRef = useRef<HTMLInputElement>(null)

    // Form State
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        title: "",
        bio: "",
        location: "",
        linkedinUrl: "",
        portfolioUrl: "",
        avatarUrl: "",
        resumeUrl: "",
        skills: [] as string[]
    })
    const [experiences, setExperiences] = useState<any[]>([])
    const [experienceForm, setExperienceForm] = useState({
        employer: "",
        role: "",
        startDate: "",
        endDate: "",
        description: "",
        isCurrent: false
    })
    const [isAddingExperience, setIsAddingExperience] = useState(false)
    const [editingExpId, setEditingExpId] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const profileRes = await api.get('/candidates/profile')
                const data = profileRes.data
                setProfile(data)
                setFormData({
                    firstName: data.user?.firstName || "",
                    lastName: data.user?.lastName || "",
                    title: data.title || "",
                    bio: data.bio || "",
                    location: data.location || "Remote",
                    linkedinUrl: data.linkedinUrl || "",
                    portfolioUrl: data.portfolioUrl || "",
                    avatarUrl: data.user?.avatarUrl || "",
                    resumeUrl: data.resumeUrl || "",
                    skills: data.skills || []
                })
            } catch (error) {
                console.error("Failed to fetch profile", error)
            }

            try {
                const statsRes = await api.get('/candidates/stats')
                setStats(statsRes.data)
            } catch (error) {
                console.error("Failed to fetch stats", error)
            }

            try {
                const expRes = await api.get('/candidates/experiences')
                setExperiences(expRes.data)
            } catch (error) {
                console.error("Failed to fetch experiences", error)
            }

            setLoading(false)
        }
        fetchData()
    }, [])

    const fetchStats = async () => {
        try {
            const statsRes = await api.get('/candidates/stats')
            setStats(statsRes.data)
        } catch (error) {
            console.error("Failed to fetch stats", error)
        }
    }

    const handleSave = async () => {
        console.log("Saving profile, auth context:", { user, refreshUser })
        setSaving(true)
        try {
            await api.post('/candidates/profile', formData)
            await fetchStats() // Refresh stats after save
            if (typeof refreshUser === 'function') {
                refreshUser({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    avatarUrl: formData.avatarUrl
                })
            } else {
                console.warn("refreshUser is not available in AuthContext")
            }
            alert("Profile saved successfully!")
        } catch (error) {
            console.error("Failed to save profile", error)
            alert("Error saving profile. Please check console.")
        } finally {
            setSaving(false)
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const uploadData = new FormData()
        uploadData.append('file', file)

        try {
            const response = await api.post('/candidates/avatar-upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            const newUrl = response.data.avatarUrl
            setFormData({ ...formData, avatarUrl: newUrl })
            if (typeof refreshUser === 'function') {
                refreshUser({ avatarUrl: newUrl })
            }
            alert("Avatar uploaded successfully!")
        } catch (error) {
            console.error("Upload failed", error)
            alert("Failed to upload avatar")
        } finally {
            setUploading(false)
        }
    }

    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.type !== 'application/pdf') {
            alert("Please upload a PDF file")
            return
        }

        setResumeUploading(true)
        const uploadData = new FormData()
        uploadData.append('file', file)

        try {
            const response = await api.post('/candidates/resume-upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            const updatedProfile = response.data
            setFormData({
                ...formData,
                resumeUrl: updatedProfile.resumeUrl,
                skills: updatedProfile.skills || formData.skills
            })
            await fetchStats() // Refresh stats after resume parsing
            alert("Resume uploaded and parsed successfully!")
        } catch (error) {
            console.error("Resume upload failed", error)
            alert("Failed to upload resume. Please ensure it is a valid PDF.")
        } finally {
            setResumeUploading(false)
        }
    }

    const fetchExperiences = async () => {
        try {
            const response = await api.get('/candidates/experiences')
            setExperiences(response.data)
        } catch (error) {
            console.error("Failed to fetch experiences", error)
        }
    }

    const handleAddExperience = async () => {
        setSaving(true)
        try {
            if (editingExpId) {
                await api.patch(`/candidates/experiences/${editingExpId}`, experienceForm)
            } else {
                await api.post('/candidates/experiences', experienceForm)
            }
            toast.success(editingExpId ? "Experience updated" : "Experience added")
            setIsAddingExperience(false)
            setEditingExpId(null)
            setExperienceForm({ employer: "", role: "", startDate: "", endDate: "", description: "", isCurrent: false })
            fetchExperiences()
            fetchStats()
        } catch (error) {
            console.error("Failed to save experience", error)
            toast.error("Failed to save experience")
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteExperience = async (id: string) => {
        if (!confirm("Are you sure you want to delete this experience?")) return
        try {
            await api.delete(`/candidates/experiences/${id}`)
            toast.success("Experience deleted")
            fetchExperiences()
            fetchStats()
        } catch (error) {
            console.error("Failed to delete experience", error)
            toast.error("Failed to delete experience")
        }
    }

    const addSkill = (skill: string) => {
        if (skill && !formData.skills.includes(skill)) {
            setFormData({ ...formData, skills: [...formData.skills, skill] })
        }
    }

    const removeSkill = (skillToRemove: string) => {
        setFormData({ ...formData, skills: formData.skills.filter(s => s !== skillToRemove) })
    }

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
            className="grid gap-8 lg:grid-cols-3"
        >
            {/* Left: Sidebar-like Profile Card */}
            <div className="space-y-6">
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-card p-8 text-center space-y-6">
                    <div
                        className="relative mx-auto h-32 w-32 rounded-3xl overflow-hidden ring-4 ring-primary/10 cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            {uploading ? (
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            ) : formData.avatarUrl ? (
                                <img
                                    src={formData.avatarUrl}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        // Show the icon instead
                                        const parent = e.currentTarget.parentElement;
                                        if (parent) {
                                            const icon = document.createElement('div');
                                            icon.className = 'flex items-center justify-center h-full w-full';
                                            icon.innerHTML = '<svg ...></svg>'; // Simplified, better to handle in state
                                        }
                                    }}
                                />
                            ) : (
                                <User className="h-16 w-16 text-primary" />
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                    />
                    <div>
                        <h2 className="text-2xl font-bold">{formData.firstName} {formData.lastName}</h2>
                        <p className="text-sm text-primary font-semibold">{formData.title || "Career Profile"}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <span>Profile Strength</span>
                                <span>{stats?.profileStrength || 0}%</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats?.profileStrength || 0}%` }}
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                            {stats?.profileStrength < 100
                                ? `Improve your profile by adding ${!formData.portfolioUrl ? "a portfolio link" : "more details"} to reach 100%.`
                                : "Your profile is fully complete! Excellent work."}
                        </p>
                    </div>

                    <hr className="border-muted/50" />

                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            className="w-full rounded-xl gap-2 font-bold h-11"
                            disabled={resumeUploading}
                            onClick={() => resumeFileInputRef.current?.click()}
                        >
                            {resumeUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileText className="h-4 w-4" />
                            )}
                            {resumeUploading ? "Uploading..." : "Update Resume (PDF)"}
                        </Button>
                        <input
                            type="file"
                            ref={resumeFileInputRef}
                            className="hidden"
                            accept="application/pdf"
                            onChange={handleResumeUpload}
                        />
                        <Button className="w-full rounded-xl gap-2 font-bold h-11 shadow-lg shadow-primary/20" asChild>
                            <Link href={`/candidates/view/${profile?.id}`}>
                                View Public Profile
                            </Link>
                        </Button>
                    </div>
                </Card>

                <Card className="border-none shadow-sm rounded-3xl p-8 space-y-6">
                    <h3 className="text-lg font-bold">Social & Links</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">LinkedIn</Label>
                            <div className="relative">
                                <Linkedin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={formData.linkedinUrl}
                                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                                    placeholder="linkedin.com/in/username"
                                    className="pl-9 bg-muted/50 border-none rounded-xl h-11"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">Portfolio</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={formData.portfolioUrl}
                                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                                    placeholder="portfolio.com"
                                    className="pl-9 bg-muted/50 border-none rounded-xl h-11"
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Right: Main Content */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-sm rounded-3xl p-8 space-y-8">
                    <div>
                        <h3 className="text-xl font-bold">Personal Information</h3>
                        <p className="text-sm text-muted-foreground">Details shown to recruiters when they view your profile.</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="bg-muted/50 border-none h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="bg-muted/50 border-none h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Professional Title</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Senior Product Designer"
                                className="bg-muted/50 border-none h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Avatar URL</Label>
                            <Input
                                value={formData.avatarUrl}
                                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                                placeholder="https://example.com/photo.jpg"
                                className="bg-muted/50 border-none h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Location</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="pl-9 bg-muted/50 border-none h-11 rounded-xl"
                                />
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Professional Bio</Label>
                            <Textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Tell us about your experience and what you're looking for..."
                                className="bg-muted/50 border-none rounded-2xl min-h-[120px]"
                            />
                        </div>
                    </div>
                </Card>

                <Card className="border-none shadow-sm rounded-3xl p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">Work Experience</h3>
                        <Button
                            variant="outline"
                            className="rounded-xl gap-2 font-bold"
                            onClick={() => {
                                setEditingExpId(null)
                                setExperienceForm({ employer: "", role: "", startDate: "", endDate: "", description: "", isCurrent: false })
                                setIsAddingExperience(true)
                            }}
                        >
                            <Plus className="h-4 w-4" /> Add Experience
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {experiences.map((exp) => (
                            <div key={exp.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 group relative">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                                            <Briefcase className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">{exp.role}</h4>
                                            <p className="text-primary font-bold">{exp.employer}</p>
                                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(exp.startDate).toLocaleDateString()} - {exp.isCurrent ? "Present" : new Date(exp.endDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 rounded-lg hover:bg-white"
                                            onClick={() => {
                                                setEditingExpId(exp.id)
                                                setExperienceForm({
                                                    employer: exp.employer,
                                                    role: exp.role,
                                                    startDate: exp.startDate.split('T')[0],
                                                    endDate: exp.endDate ? exp.endDate.split('T')[0] : "",
                                                    description: exp.description || "",
                                                    isCurrent: exp.isCurrent
                                                })
                                                setIsAddingExperience(true)
                                            }}
                                        >
                                            <Globe className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 rounded-lg hover:bg-white text-destructive"
                                            onClick={() => handleDeleteExperience(exp.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                {exp.description && (
                                    <p className="mt-4 text-sm text-slate-600 font-medium leading-relaxed">
                                        {exp.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Experience Dialog */}
                <Dialog open={isAddingExperience} onOpenChange={setIsAddingExperience}>
                    <DialogContent className="sm:max-w-[500px] rounded-3xl border-none p-8">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">{editingExpId ? "Edit Experience" : "Add Experience"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Employer / Company</Label>
                                    <Input
                                        className="bg-muted/50 border-none h-11 rounded-xl"
                                        value={experienceForm.employer}
                                        onChange={(e) => setExperienceForm({ ...experienceForm, employer: e.target.value })}
                                        placeholder="e.g. Acme Corp"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role / Title</Label>
                                    <Input
                                        className="bg-muted/50 border-none h-11 rounded-xl"
                                        value={experienceForm.role}
                                        onChange={(e) => setExperienceForm({ ...experienceForm, role: e.target.value })}
                                        placeholder="e.g. Frontend Engineer"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        className="bg-muted/50 border-none h-11 rounded-xl"
                                        value={experienceForm.startDate}
                                        onChange={(e) => setExperienceForm({ ...experienceForm, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Input
                                        type="date"
                                        className="bg-muted/50 border-none h-11 rounded-xl"
                                        value={experienceForm.endDate}
                                        onChange={(e) => setExperienceForm({ ...experienceForm, endDate: e.target.value })}
                                        disabled={experienceForm.isCurrent}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isCurrent"
                                    checked={experienceForm.isCurrent}
                                    onChange={(e) => setExperienceForm({ ...experienceForm, isCurrent: e.target.checked })}
                                />
                                <Label htmlFor="isCurrent" className="text-sm font-medium">I am currently working in this role</Label>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    className="bg-muted/50 border-none rounded-2xl min-h-[100px]"
                                    value={experienceForm.description}
                                    onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })}
                                    placeholder="Describe your responsibilities and achievements..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" className="rounded-xl h-12 px-6 font-bold" onClick={() => setIsAddingExperience(false)}>Cancel</Button>
                            <Button
                                className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20"
                                onClick={handleAddExperience}
                                disabled={saving}
                            >
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingExpId ? "Save Changes" : "Add Experience"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Card className="border-none shadow-sm rounded-3xl p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">Skills & Expertise</h3>
                        <div className="flex gap-2">
                            <Input
                                id="new-skill"
                                placeholder="Add skill..."
                                className="h-8 w-32 bg-muted/50 border-none rounded-lg text-xs"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        addSkill(e.currentTarget.value)
                                        e.currentTarget.value = ""
                                    }
                                }}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:bg-primary/5 rounded-lg h-8 px-2"
                                onClick={() => {
                                    const input = document.getElementById('new-skill') as HTMLInputElement
                                    addSkill(input.value)
                                    input.value = ""
                                }}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill: string) => (
                            <Badge key={skill} className="bg-primary/10 text-primary border-none hover:bg-primary hover:text-white transition-all cursor-pointer px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 group">
                                {skill}
                                <X className="h-3 w-3 opacity-50 group-hover:opacity-100" onClick={(e) => {
                                    e.stopPropagation()
                                    removeSkill(skill)
                                }} />
                            </Badge>
                        ))}
                    </div>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" className="rounded-xl h-12 px-8 font-bold" onClick={() => window.location.reload()}>Discard Changes</Button>
                    <Button
                        className="rounded-xl h-12 px-10 font-bold shadow-lg shadow-primary/20"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Profile
                    </Button>
                </div>
            </div>
        </motion.div>
    )
}
