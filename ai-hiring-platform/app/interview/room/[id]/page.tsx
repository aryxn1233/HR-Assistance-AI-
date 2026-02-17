"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { io, Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mic, Send, Video as VideoIcon, VideoOff } from "lucide-react"

interface Message {
    role: 'ai' | 'user';
    content: string;
}

export default function InterviewRoom() {
    const params = useParams();
    const id = params?.id as string;
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [connected, setConnected] = useState(false);
    const [status, setStatus] = useState("Connecting...");

    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!id) return;

        // Connect to WebSocket
        const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket');
            setConnected(true);
            setStatus("Connected");
            newSocket.emit('joinRoom', { interviewId: id });
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected');
            setConnected(false);
            setStatus("Disconnected");
        });

        newSocket.on('question', (data: { text: string }) => {
            setMessages(prev => [...prev, { role: 'ai', content: data.text }]);
            setStatus("Waiting for your answer...");
        });

        newSocket.on('interviewEnd', (data: { message: string }) => {
            setMessages(prev => [...prev, { role: 'ai', content: data.message }]);
            setStatus("Interview Completed");
            newSocket.disconnect();
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        }
    }, [id]);

    useEffect(() => {
        // Scroll to bottom
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !socket) return;

        // Add user message immediately for UI responsiveness
        setMessages(prev => [...prev, { role: 'user', content: input }]);

        // Send to backend
        socket.emit('submitAnswer', { interviewId: id, answer: input });

        setInput("");
        setStatus("AI is thinking...");
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4 md:grid md:grid-cols-3 md:gap-8 md:p-8">
            <div className="md:col-span-2 flex flex-col gap-4 h-full">
                {/* Video Area (Placeholder) */}
                <Card className="flex-1 bg-black relative overflow-hidden flex items-center justify-center">
                    <div className="absolute top-4 right-4 flex gap-2">
                        <div className="bg-red-500 w-3 h-3 rounded-full animate-pulse"></div>
                        <span className="text-white text-xs font-mono">REC</span>
                    </div>
                    <div className="text-white/50 flex flex-col items-center">
                        <VideoIcon className="h-16 w-16 mb-4 opacity-50" />
                        <p>Camera Feed Preview</p>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4">
                        <Button variant="secondary" size="icon" className="rounded-full">
                            <Mic className="h-4 w-4" />
                        </Button>
                        <Button variant="secondary" size="icon" className="rounded-full">
                            <VideoOff className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>

                {/* Current Question Display */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Current Question</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold leading-relaxed">
                            {messages.filter(m => m.role === 'ai').slice(-1)[0]?.content || "Waiting for interviewer..."}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col h-full gap-4">
                <Card className="flex-1 flex flex-col shadow-lg border-l-4 border-l-blue-500/20">
                    <CardHeader className="border-b bg-muted/20">
                        <CardTitle className="flex items-center justify-between">
                            <span>Interview Chat</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {status}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden relative">
                        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                            <div className="flex flex-col gap-4 pb-4">
                                {messages.map((msg, i) => (
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
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <div className="p-4 border-t mt-auto">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="flex gap-2"
                        >
                            <Input
                                placeholder="Type your answer..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={!connected || status.includes("thinking")}
                            />
                            <Button type="submit" size="icon" disabled={!connected || status.includes("thinking")}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </Card>
            </div>
        </div>
    )
}
