import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Message {
    role: 'ai' | 'user';
    content: string;
}

interface InterviewTranscriptProps {
    history: Message[];
}

export function InterviewTranscript({ history }: InterviewTranscriptProps) {
    if (!history || history.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Interview Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground italic text-sm">No transcript available for this interview.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Interview Transcript</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-[400px] pr-4">
                    <div className="flex flex-col gap-4">
                        {history.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex gap-3 ${msg.role === 'user' ? "flex-row-reverse" : ""
                                    }`}
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                        {msg.role === 'user' ? "ME" : "AI"}
                                    </AvatarFallback>
                                    <AvatarImage src={msg.role === 'ai' ? "/ai-avatar.png" : undefined} />
                                </Avatar>
                                <div
                                    className={`rounded-lg p-3 text-sm max-w-[80%] ${msg.role === 'user'
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "bg-muted shadow-sm"
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
