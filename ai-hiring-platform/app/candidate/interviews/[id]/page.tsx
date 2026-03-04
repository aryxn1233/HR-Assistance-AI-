"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Send, Loader2, Volume2, VolumeX } from "lucide-react";
import api from "@/lib/api";
import DIdAvatar from "@/components/interview/DIdAvatar";
import { WebcamPreview } from "@/components/interview/WebcamPreview";
import { useWebSpeech } from "@/hooks/useWebSpeech";
import { avatarStateManager } from "@/lib/InterviewAvatarStateManager";

export default function InterviewRoomPage() {
    const params = useParams();
    const router = useRouter();
    const interviewId = params.id as string;

    useEffect(() => {
        const redirectWithContext = async () => {
            try {
                // Get token from localStorage
                const token = localStorage.getItem('token');

                // Fetch interview details to get applicationId
                const response = await api.get(`/interviews/${interviewId}`);
                const interviewData = response.data;
                const applicationId = interviewData.applicationId;

                // Build query params
                const params = new URLSearchParams({
                    interviewId: interviewId,
                    token: token || "",
                    applicationId: applicationId || ""
                });

                // Redirect to standalone D-ID project with context
                window.location.href = `http://localhost:3001?${params.toString()}`;
            } catch (err) {
                console.error("Failed to redirect with context:", err);
                // Fallback redirect if API fails
                window.location.href = "http://localhost:3001";
            }
        };

        if (interviewId) {
            redirectWithContext();
        }
    }, [interviewId]);

    const [interview, setInterview] = useState<any>(null);
    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [answerText, setAnswerText] = useState("");
    const [hasStarted, setHasStarted] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const { transcript, interimTranscript, isListening, startListening, stopListening, resetTranscript } = useWebSpeech();

    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, answerText, interimTranscript]);

    useEffect(() => {
        if (transcript) {
            setAnswerText(transcript);
        }
    }, [transcript]);

    // HANDS-FREE AUTOMATION: Control microphone based on AI status
    useEffect(() => {
        if (hasStarted && !isSpeaking && !processing && !isListening) {
            console.log("Automation: AI stopped speaking. Starting microphone...");
            startListening();
        } else if ((isSpeaking || processing) && isListening) {
            console.log("Automation: AI speaking or processing. Stopping microphone...");
            stopListening();
        }
    }, [isSpeaking, processing, hasStarted, isListening]);

    // HANDS-FREE AUTOMATION: Silence detection (4s of inactivity triggers submission)
    useEffect(() => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        if (isListening && (transcript || interimTranscript) && !processing) {
            silenceTimerRef.current = setTimeout(() => {
                const finalAnswer = (transcript || answerText || interimTranscript).trim();
                // Only submit if we have meaningful content (> 5 chars)
                if (finalAnswer.length > 5) {
                    console.log("Automation: Silence detected. Submitting answer...");
                    handleAnswerSubmit(finalAnswer);
                }
            }, 4000);
        }

        return () => { if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current); };
    }, [transcript, interimTranscript, isListening, processing, answerText]);

    useEffect(() => {
        const initSession = async () => {
            try {
                const response = await api.post(`/interviews/${interviewId}/start`);
                const data = response.data;

                if (data.status === 'completed') {
                    router.push(`/candidates/interviews/${interviewId}/report`);
                    return;
                }

                if (data.question) {
                    setCurrentQuestion(data.question);
                    setMessages(prev => {
                        if (prev.find(m => m.id === data.question.id)) return prev;
                        return [...prev, { role: 'ai', content: data.question.questionText, id: data.question.id }];
                    });
                }

                const details = await api.get(`/interviews/${interviewId}`);
                setInterview(details.data);

            } catch (error) {
                console.error("Failed to start session", error);
            } finally {
                setLoading(false);
            }
        };

        if (interviewId) {
            initSession();
        }

        return () => {
            stopListening();
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        };
    }, [interviewId]);

    const startInterview = async () => {
        setHasStarted(true);
        setProcessing(true);
        try {
            const response = await api.post(`/interviews/${interviewId}/start`);
            const data = response.data;
            if (data.question) {
                setCurrentQuestion(data.question);
                setMessages([{ role: 'ai', content: data.question.questionText, id: data.question.id }]);
            }
        } catch (err) {
            console.error("Start interview failed", err);
        } finally {
            setProcessing(false);
        }
    };

    const handleAnswerSubmit = async (textToSubmit?: string) => {
        const finalContent = textToSubmit || answerText;
        if (!finalContent.trim() || processing) return;

        setProcessing(true);
        stopListening();
        resetTranscript();
        setAnswerText("");

        const userMsg = { role: 'user', content: finalContent };
        setMessages(prev => [...prev, userMsg]);

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
            }

        } catch (error) {
            console.error("Failed to submit answer", error);
            avatarStateManager.setIDLE();
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-slate-950"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>;
    }

    return (
        <div className="flex h-screen bg-[#020617] overflow-hidden relative font-sans text-slate-200">
            {!hasStarted && (
                <div className="absolute inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center text-white p-4">
                    <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-8 animate-pulse shadow-[0_0_50px_rgba(37,99,235,0.4)]">
                        <Mic className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4 tracking-tight">AI Interview Room</h1>
                    <p className="text-slate-400 mb-12 max-w-sm text-center leading-relaxed text-lg">
                        Meet your interviewer, Alex. This session is automated and voice-activated for your convenience.
                    </p>
                    <Button onClick={startInterview} size="lg" className="bg-blue-600 hover:bg-blue-700 text-xl px-16 py-10 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 border-b-4 border-blue-800">
                        Enter Interview
                    </Button>
                </div>
            )}

            {/* Stage Area (Avatar) */}
            <div className="flex-1 relative flex flex-col items-center justify-center p-12 bg-gradient-to-b from-[#020617] to-[#0f172a] overflow-hidden border-r border-white/5">
                {/* Header Overlay */}
                <div className="absolute top-8 left-12 right-12 flex justify-between items-start z-10">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            <span className="text-xs font-bold tracking-wider uppercase text-blue-100/80">Alex • Senior Interviewer</span>
                        </div>
                    </div>
                </div>

                {/* Avatar Frame */}
                <div className="relative h-full aspect-square rounded-[2.5rem] overflow-hidden shadow-[0_0_150px_rgba(0,0,0,0.8),0_0_50px_rgba(30,41,59,0.3)] border border-white/10 bg-black group flex items-center justify-center">
                    <DIdAvatar
                        interviewId={interviewId}
                        onStatusChange={(speaking) => setIsSpeaking(speaking)}
                        onStop={() => setIsSpeaking(false)}
                    />

                    {/* Status Overlays */}
                    <div className="absolute bottom-6 left-6 flex items-center gap-3 z-20">
                        <div className={`px-4 py-2 rounded-xl flex items-center gap-3 transition-all duration-700 backdrop-blur-xl border ${isListening ? 'bg-red-500/20 border-red-500/40 text-red-100' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                            <div className={`h-2 w-2 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                                {processing ? 'Analyzing' : isListening ? 'Listening' : 'Ready'}
                            </span>
                        </div>
                    </div>

                    {/* Self Preview */}
                    <div className="absolute bottom-6 right-6 w-44 aspect-video shadow-2xl rounded-2xl overflow-hidden border border-white/10 ring-1 ring-white/20 transition-transform hover:scale-105 duration-300">
                        <WebcamPreview />
                    </div>
                </div>

                {/* Progress Bar (at the bottom of the stage) */}
                <div className="absolute bottom-12 left-24 right-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    {isListening && !processing && (
                        <div className="h-full bg-blue-500 animate-progress w-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ animationDuration: '4s' }} />
                    )}
                </div>
            </div>

            {/* Sidebar (Transcript) */}
            <div className="w-[400px] flex flex-col h-full bg-[#020617] border-l border-white/5">
                <div className="p-8 border-b border-white/5 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                                <Mic className="h-4 w-4 text-blue-500" />
                            </div>
                            <h2 className="text-sm font-bold text-white tracking-tight leading-none">Conversation</h2>
                        </div>
                        <Badge className="bg-white/5 border-white/10 text-white text-[10px] tracking-widest uppercase">Question {currentQuestion?.orderNumber || 1}</Badge>
                    </div>
                </div>

                <ScrollArea className="flex-1 px-6 py-8">
                    <div className="space-y-8 pb-20">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                                <div className={`flex items-center gap-2 mb-2 text-[9px] font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-blue-500' : 'text-slate-500'}`}>
                                    {msg.role === 'user' ? 'You' : 'Alex'}
                                </div>
                                <div className={`max-w-[90%] rounded-2xl p-4 text-sm font-medium leading-relaxed transition-all ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20'
                                    : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none'
                                    }`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}

                        {(isListening || processing) && (
                            <div className="flex flex-col items-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className={`max-w-[90%] w-full rounded-2xl p-4 border transition-all duration-500 rounded-tr-none ${processing ? 'bg-white/5 border-white/10 text-slate-500' :
                                    'bg-blue-600/10 border-blue-500/30 text-blue-100'}`}>
                                    <p className="text-sm italic leading-relaxed">
                                        {answerText || (interimTranscript ? `${interimTranscript}...` : "...")}
                                    </p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-blue-500/70">
                                            {processing ? 'Processing' : 'Listening...'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
