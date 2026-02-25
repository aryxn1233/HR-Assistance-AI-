"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Send, Loader2, Volume2, VolumeX } from "lucide-react";
import api from "@/lib/api";
import DIdAvatar from "@/components/interview/DIdAvatar";
import { WebcamPreview } from "@/components/interview/WebcamPreview";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useWebSpeech } from "@/hooks/useWebSpeech";
import { avatarStateManager } from "@/lib/InterviewAvatarStateManager";

export default function InterviewRoomPage() {
    const params = useParams();
    const router = useRouter();
    const interviewId = params.id as string;

    const [interview, setInterview] = useState<any>(null);
    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);

    // Hooks
    const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();
    const { transcript, isListening, startListening, stopListening } = useWebSpeech();

    // Local transcript state to handle manual edits if needed (optional) 
    // or just to hold the value before submitting
    const [answerText, setAnswerText] = useState("");

    // Update answer text from speech transcript
    useEffect(() => {
        if (transcript) {
            setAnswerText(prev => prev ? prev + " " + transcript : transcript);
        }
    }, [transcript]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, answerText]);

    const [hasStarted, setHasStarted] = useState(false);

    // Initial Load
    useEffect(() => {
        const initSession = async () => {
            try {
                // Check status first or directly start/resume
                const response = await api.post(`/interviews/${interviewId}/start`);
                const data = response.data;

                if (data.status === 'completed') {
                    router.push(`/candidates/interviews/${interviewId}/report`); // Redirect to report
                    return;
                }

                if (data.question) {
                    setCurrentQuestion(data.question);
                    // Add to message history if not there
                    setMessages(prev => {
                        if (prev.find(m => m.id === data.question.id)) return prev;
                        return [...prev, { role: 'ai', content: data.question.questionText, id: data.question.id }];
                    });

                    // Delay auto-speak until user clicks Start
                }

                // Fetch full interview details for context if needed
                const details = await api.get(`/interviews/${interviewId}`);
                setInterview(details.data);

            } catch (error) {
                console.error("Failed to start session", error);
                // Handle error (e.g. invalid ID)
            } finally {
                setLoading(false);
            }
        };

        if (interviewId) {
            initSession();
        }

        return () => {
            stopSpeaking();
            stopListening();
        };
    }, [interviewId]);

    const startInterview = () => {
        setHasStarted(true);
        if (currentQuestion) {
            window.dispatchEvent(new CustomEvent("did-speak", { detail: { text: currentQuestion.questionText } }));
        }
    };

    const handleAnswerSubmit = async () => {
        if (!answerText.trim()) return;

        const submissionText = answerText;
        setProcessing(true);
        stopSpeaking(); // Ensure AI stops talking

        // Add user answer to UI immediately
        const userMsg = { role: 'user', content: submissionText };
        setMessages(prev => [...prev, userMsg]);
        setAnswerText(""); // Clear input

        try {
            avatarStateManager.setTHINKING();
            const response = await api.post(`/interviews/${interviewId}/answer`, { answer: userMsg.content });
            const data = response.data;

            if (data.status === 'completed') {
                router.push(`/candidates/interviews/${interviewId}/report`);
                return;
            }

            if (data.question) {
                setCurrentQuestion(data.question);
                setMessages(prev => [...prev, { role: 'ai', content: data.question.questionText, id: data.question.id }]);

                // Trigger D-ID Avatar to speak
                window.dispatchEvent(new CustomEvent("did-speak", { detail: { text: data.question.questionText } }));
            }

        } catch (error) {
            console.error("Failed to submit answer", error);
            avatarStateManager.setIDLE();
        } finally {
            setProcessing(false);
        }
    };

    const toggleRecording = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden relative">
            {!hasStarted && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white p-4">
                    <h1 className="text-3xl font-bold mb-4">Ready for your Interview?</h1>
                    <p className="text-gray-300 mb-8 max-w-md text-center">
                        You are about to start a voice-based interview with our AI Avatar.
                        Please ensure your microphone is enabled and your volume is up.
                    </p>
                    <Button onClick={startInterview} size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 rounded-full">
                        Start Interview
                    </Button>
                </div>
            )}

            {/* Left: Avatar */}
            <div className="w-1/2 bg-black relative flex items-center justify-center border-r border-border">
                <DIdAvatar interviewId={interviewId} />

                {/* Status Overlay */}
                <div className="absolute top-6 left-6 z-10">
                    <Badge variant={isSpeaking ? "default" : "secondary"} className="text-sm px-3 py-1">
                        {isSpeaking ? <span className="flex items-center gap-2"><Volume2 className="h-4 w-4" /> AI Speaking</span> : <span className="flex items-center gap-2"><VolumeX className="h-4 w-4" /> AI Idle</span>}
                    </Badge>
                </div>

                {/* Candidate Webcam (PIP) */}
                <div className="absolute bottom-6 right-6 z-20 w-64 shadow-2xl rounded-xl overflow-hidden border-2 border-slate-800">
                    <WebcamPreview />
                </div>
            </div>

            {/* Right: Interaction */}
            <div className="w-1/2 flex flex-col h-full bg-slate-50 dark:bg-slate-950">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm z-10">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">{interview?.job?.title || "Interview Session"}</h2>
                        <p className="text-sm text-muted-foreground mt-1">Candidate: {interview?.candidate?.user?.firstName}</p>
                    </div>
                    <Badge variant="outline" className="text-lg px-3 py-1">Q{currentQuestion?.orderNumber || 1}</Badge>
                </div>

                {/* Chat/Transcript Area */}
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-5 shadow-sm text-base leading-relaxed ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                                    }`}>
                                    <p>{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* Controls */}
                <div className="p-6 border-t bg-white dark:bg-slate-900">
                    <div className="mb-4 relative">
                        <textarea
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            className="w-full h-32 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 resize-none focus:ring-2 focus:ring-primary focus:outline-none text-base"
                            placeholder={isListening ? "Listening..." : "Type your answer or use microphone..."}
                            disabled={processing}
                        />
                        {isListening && (
                            <div className="absolute bottom-4 right-4 animate-pulse text-red-500">
                                <Mic className="h-5 w-5" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <Button
                            variant={isListening ? "destructive" : "outline"}
                            onClick={toggleRecording}
                            disabled={processing}
                            className="w-[160px] h-12 text-base"
                        >
                            {isListening ? <><MicOff className="mr-2 h-5 w-5" /> Stop Rec</> : <><Mic className="mr-2 h-5 w-5" /> Start Rec</>}
                        </Button>

                        <div className="text-sm font-medium text-muted-foreground hidden md:block">
                            {isListening ? "Listening..." : "Ready to answer"}
                        </div>

                        <Button
                            onClick={handleAnswerSubmit}
                            disabled={!answerText.trim() || processing}
                            className="w-[160px] h-12 text-base"
                        >
                            {processing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                            Submit
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
