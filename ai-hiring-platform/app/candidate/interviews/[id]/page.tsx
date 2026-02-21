"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Send, Loader2, Volume2, VolumeX, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import HeyGenAvatar from "@/components/interview/HeyGenAvatar";
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
            speak(currentQuestion.questionText, currentQuestion.audioUrl);
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
                // Auto-speak new question
                setTimeout(() => speak(data.question.questionText, data.question.audioUrl), 500);
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



    // Auto-start listening when AI stops speaking
    useEffect(() => {
        if (!isSpeaking && hasStarted && !processing && !messages[messages.length - 1]?.role.includes('user')) {
            // Small delay to ensure it doesn't pick up AI's last word
            const timer = setTimeout(() => {
                startListening();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isSpeaking, hasStarted, processing, messages]);

    // Silence Detection & Auto-Submit
    useEffect(() => {
        let silenceTimer: NodeJS.Timeout;

        if (isListening && transcript) {
            // If listening and user has spoken, wait for silence
            // 3 seconds silence threshold
            silenceTimer = setTimeout(() => {
                if (answerText.trim().length > 5 && !processing) { // Minimum length check
                    handleAnswerSubmit();
                }
            }, 3000);
        }

        return () => clearTimeout(silenceTimer);
    }, [transcript, isListening, answerText, processing]);


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
                <HeyGenAvatar />

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
                        {/* Live Transcript Bubble */}
                        {answerText && (
                            <div className="flex justify-end">
                                <div className="max-w-[80%] rounded-2xl p-5 shadow-sm text-base leading-relaxed bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 text-slate-600 dark:text-slate-300 rounded-tr-none animate-pulse">
                                    <p>{answerText} <span className="inline-block w-2 h-4 bg-blue-500 animate-bounce ml-1">|</span></p>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* Controls */}
                <div className="p-6 border-t bg-white dark:bg-slate-900">
                    {/* Visualizer / Status for Voice Mode */}
                    <div className="flex flex-col items-center justify-center mb-6 h-24">
                        {isListening ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex gap-1 items-center h-8">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="w-1.5 bg-red-500 rounded-full animate-music" style={{ height: Math.random() * 20 + 10 + 'px', animationDuration: '0.5s' }} />
                                    ))}
                                </div>
                                <p className="text-sm font-medium text-red-500 animate-pulse">
                                    {transcript ? "Listening..." : "Speak now..."}
                                </p>
                                {transcript && <p className="text-xs text-muted-foreground">Auto-submits after silence</p>}
                            </div>
                        ) : isSpeaking ? (
                            <p className="text-sm font-medium text-blue-500">AI is speaking...</p>
                        ) : processing ? (
                            <div className="flex items-center gap-2 text-blue-600">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm font-medium">Processing your answer...</span>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Waiting...</p>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        {/* Manual Override if needed, but mostly hidden/minimized */}
                        {/* Or just show status only */}
                        <div className="text-sm text-slate-400">
                            Speak clearly. The AI will detect when you are finished.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
