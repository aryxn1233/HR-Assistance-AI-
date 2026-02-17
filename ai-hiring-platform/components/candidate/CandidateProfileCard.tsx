import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Mail, MapPin, Phone, Download, ExternalLink } from "lucide-react"

export function CandidateProfileCard() {
    return (
        <Card className="overflow-hidden">
            <div className="h-32 bg-linear-to-r from-blue-500 to-purple-500" />
            <CardHeader className="relative pt-0">
                <div className="-mt-16 mb-4 flex flex-col items-center sm:flex-row sm:items-end sm:space-x-4">
                    <Avatar className="h-32 w-32 border-4 border-white dark:border-zinc-950">
                        <AvatarImage src="/avatars/02.png" alt="Alex Johnson" />
                        <AvatarFallback>AJ</AvatarFallback>
                    </Avatar>
                    <div className="mt-4 text-center sm:mt-0 sm:text-left">
                        <h1 className="text-2xl font-bold">Alex Johnson</h1>
                        <p className="text-muted-foreground">Senior React Developer</p>
                    </div>
                    <div className="mt-4 flex flex-1 justify-center gap-2 sm:mt-0 sm:justify-end">
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Resume
                        </Button>
                        <Button size="sm">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Portfolio
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="h-4 w-4" />
                        alex.johnson@example.com
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="h-4 w-4" />
                        +1 (555) 012-3456
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        San Francisco, CA
                    </div>
                </div>
                <div className="mt-6">
                    <h3 className="mb-2 text-sm font-semibold">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {["React", "TypeScript", "Next.js", "Node.js", "GraphQL", "Tailwind CSS"].map((skill) => (
                            <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                    </div>
                </div>
                <div className="mt-6">
                    <h3 className="mb-2 text-sm font-semibold">AI Summary</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Alex demonstrates exceptional technical proficiency in React ecosystem. His problem-solving approach is structured and logical. Communication skills are strong, with clear articulation of complex concepts. Fits well with the engineering culture of innovation and collaboration.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
