import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Mail, MapPin, Phone, Download, ExternalLink } from "lucide-react"

interface CandidateProfileCardProps {
    interview: any;
}

export function CandidateProfileCard({ interview }: CandidateProfileCardProps) {
    if (!interview) return null;

    const candidate = interview.candidate;
    const user = candidate?.user || {};
    const name = user.firstName ? `${user.firstName} ${user.lastName}` : "Unknown Candidate";
    const initials = name.split(" ").map((n: string) => n[0]).join("");
    const role = interview.job?.title || "Unknown Role";
    const skills = candidate?.skills || ["React", "TypeScript", "Node.js"]; // Fallback if no skills in DB yet

    return (
        <Card className="overflow-hidden">
            <div className="h-32 bg-linear-to-r from-blue-500 to-purple-500" />
            <CardHeader className="relative pt-0">
                <div className="-mt-16 mb-4 flex flex-col items-center sm:flex-row sm:items-end sm:space-x-4">
                    <Avatar className="h-32 w-32 border-4 border-white dark:border-zinc-950">
                        <AvatarImage src="/avatars/02.png" alt={name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="mt-4 text-center sm:mt-0 sm:text-left">
                        <h1 className="text-2xl font-bold">{name}</h1>
                        <p className="text-muted-foreground">{role}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="h-4 w-4" />
                        {user.email || "email@example.com"}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        {candidate.location || "Remote"}
                    </div>
                </div>
                <div className="mt-6">
                    <h3 className="mb-2 text-sm font-semibold">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill: string) => (
                            <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                    </div>
                </div>
                <div className="mt-6">
                    <h3 className="mb-2 text-sm font-semibold">AI Summary</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {interview.feedback?.summary || "No AI summary available yet."}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
