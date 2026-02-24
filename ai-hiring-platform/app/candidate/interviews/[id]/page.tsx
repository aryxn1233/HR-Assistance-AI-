"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Phone, PhoneOff, Loader2, Volume2, CheckCircle2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useWebSpeech } from "@/hooks/useWebSpeech";
import { WebcamPreview } from "@/components/interview/WebcamPreview";

export default function InterviewRoomPage() {
    const params = useParams();
    const router = useRouter();
    const interviewId = params.id as string;

    const [interview, setInterview] = useState<any>(null);
    const [status, setStatus] = useState<"Disconnected" | "Connected" | "Interview Ended">("Disconnected");
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [answerText, setAnswerText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Hooks
    const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();
    const { transcript, interimTranscript, isListening, isSupported, startListening, stopListening, resetTranscript } = useWebSpeech();

    // Sync speech transcript into answer text
    useEffect(() => {
        if (transcript) {
            setAnswerText(transcript);
        }
    }, [transcript]);

    // Auto-scroll messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, answerText, interimTranscript]);

    // Silence auto-submit: if mic is on and no new speech for 4s, submit
    useEffect(() => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (isListening && (transcript || interimTranscript) && !processing) {
            silenceTimerRef.current = setTimeout(() => {
                const currentAnswer = answerText.trim();
                if (currentAnswer.length > 5 && isListening) {
                    stopListening();
                    handleAnswerSubmitWithText(currentAnswer);
                }
            }, 4000);
        }
        return () => { if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current); };
    }, [transcript, interimTranscript, isListening, answerText]);

    // Auto-start mic after AI finishes speaking
    useEffect(() => {
        if (!isSpeaking && status === "Connected" && !processing && isSupported) {
            const timer = setTimeout(() => {
                if (!isListening) startListening();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isSpeaking, status, processing]);

    // On mount: load interview state
    useEffect(() => {
        const fetchInterview = async () => {
            try {
                const response = await api.get(`/interviews/${interviewId}`);
                setInterview(response.data);
                setMessages(response.data.transcript || []);
                if (response.data.status === 'completed') {
                    setStatus("Interview Ended");
                } else if (response.data.status === 'in_progress') {
                    setStatus("Connected");
                    const sessionData = await api.post(`/interviews/${interviewId}/start`);
                    if (sessionData.data.question) {
                        setCurrentQuestion(sessionData.data.question);
                        speak(sessionData.data.question.questionText);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch interview", error);
            } finally {
                setLoading(false);
            }
        };
        if (interviewId) fetchInterview();
        return () => { stopSpeaking(); stopListening(); };
    }, [interviewId]);

    const connectCall = async () => {
        setProcessing(true);
        try {
            const response = await api.post(`/interviews/${interviewId}/start`);
            const data = response.data;
            setStatus("Connected");
            if (data.question) {
                setCurrentQuestion(data.question);
                setMessages(prev => {
                    if (prev.some(m => m.message === data.question.questionText)) return prev;
                    return [...prev, { speaker: 'AI', message: data.question.questionText, timestamp: new Date() }];
                });
                speak(data.question.questionText);
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Failed to connect. Please try again.";
            alert(msg);
        } finally {
            setProcessing(false);
        }
    };

    const handleAnswerSubmitWithText = useCallback(async (text: string) => {
        if (!text.trim() || status !== "Connected") return;
        setProcessing(true);
        stopSpeaking();
        stopListening();
        resetTranscript();
        setAnswerText("");

        setMessages(prev => [...prev, { speaker: 'Candidate', message: text, timestamp: new Date() }]);

        try {
            const response = await api.post(`/interviews/${interviewId}/answer`, { answer: text });
            const data = response.data;

            if (data.status === 'completed') {
                setStatus("Interview Ended");
                return;
            }

            if (data.question) {
                setCurrentQuestion(data.question);
                setMessages(prev => [...prev, { speaker: 'AI', message: data.question.questionText, timestamp: new Date() }]);
                speak(data.question.questionText);
            }
        } catch (error: any) {
            console.error("Failed to submit answer", error);
            const msg = error?.response?.data?.message || "Error submitting answer.";
            alert(msg);
        } finally {
            setProcessing(false);
        }
    }, [interviewId, status]);

    const handleAnswerSubmit = () => {
        const text = answerText.trim();
        if (!text) return;
        handleAnswerSubmitWithText(text);
    };

    const toggleMic = () => {
        if (isListening) {
            stopListening();
        } else {
            resetTranscript();
            setAnswerText("");
            startListening();
        }
    };

    const liveText = answerText || (interimTranscript ? `${interimTranscript}…` : "");

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-slate-900"><Loader2 className="animate-spin h-10 w-10 text-blue-500" /></div>;
    }

    return (
        <div className="flex h-screen bg-slate-900 overflow-hidden">
            {/* LEFT: Avatar + Controls */}
            <div className="w-1/2 flex flex-col border-r border-slate-800 relative">
                {/* Avatar area */}
                <div className="flex-1 flex items-center justify-center bg-black relative">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-800 to-black">
                        <div className="flex flex-col items-center gap-4 text-slate-500">
                            <div className={`w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center border-2 transition-all duration-300 ${isSpeaking ? 'border-blue-500 shadow-lg shadow-blue-500/30 scale-105' : 'border-slate-700'}`}>
                                <Phone size={48} className={isSpeaking ? 'text-blue-400' : ''} />
                            </div>
                            <p className="text-sm font-medium uppercase tracking-widest">
                                {isSpeaking ? 'AI Speaking...' : 'AI Interviewer'}
                            </p>
                        </div>
                    </div>

                    {/* PIP Webcam */}
                    <div className="absolute bottom-6 right-6 w-48 aspect-video bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 shadow-2xl">
                        <WebcamPreview />
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-6 left-6">
                        <Badge variant={status === "Connected" ? "default" : status === "Interview Ended" ? "secondary" : "outline"} className="px-4 py-1.5 text-sm gap-2">
                            <div className={`h-2 w-2 rounded-full ${status === "Connected" ? "bg-green-500 animate-pulse" : status === "Interview Ended" ? "bg-blue-500" : "bg-red-500"}`} />
                            {status}
                        </Badge>
                    </div>
                </div>

                {/* Bottom controls */}
                {/* Bottom controls: Fully Automated Voice Flow */}
                <div className="p-8 bg-slate-900 border-t border-slate-800 flex flex-col items-center gap-5">
                    {status === "Disconnected" ? (
                        <div className="text-center space-y-4">
                            <h3 className="text-xl font-bold text-white">Ready for your Interview?</h3>
                            <p className="text-slate-400 max-w-sm text-sm">Click Connect to begin. The interview is fully voice-automated.</p>
                            <Button onClick={connectCall} disabled={processing} size="lg" className="rounded-full px-12 py-7 bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-xl shadow-blue-900/40">
                                {processing ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Phone className="mr-3 h-6 w-6" />}
                                Connect Call
                            </Button>
                        </div>
                    ) : status === "Connected" ? (
                        <div className="flex flex-col items-center gap-6 w-full">
                            {/* Visual State Indicator */}
                            <div className="relative flex items-center justify-center">
                                {/* Pulse rings for Listening state */}
                                {isListening && !processing && (
                                    <>
                                        <div className="absolute w-24 h-24 bg-red-500/20 rounded-full animate-ping" />
                                        <div className="absolute w-20 h-20 bg-red-500/40 rounded-full animate-pulse" />
                                    </>
                                )}
                                {/* Pulse rings for AI Speaking state */}
                                {isSpeaking && (
                                    <>
                                        <div className="absolute w-24 h-24 bg-blue-500/20 rounded-full animate-ping" />
                                        <div className="absolute w-20 h-20 bg-blue-500/40 rounded-full animate-pulse" />
                                    </>
                                )}

                                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-500 z-10 ${processing ? 'bg-slate-700' :
                                        isSpeaking ? 'bg-blue-600' :
                                            isListening ? 'bg-red-600' : 'bg-slate-800'
                                    }`}>
                                    {processing ? (
                                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                                    ) : isSpeaking ? (
                                        <Volume2 className="h-8 w-8 text-white" />
                                    ) : isListening ? (
                                        <Mic className="h-8 w-8 text-white" />
                                    ) : (
                                        <MicOff className="h-8 w-8 text-slate-500" />
                                    )}
                                </div>
                            </div>

                            <div className="text-center space-y-1">
                                <p className={`text-lg font-bold tracking-tight uppercase ${processing ? 'text-yellow-500' :
                                        isSpeaking ? 'text-blue-400' :
                                            isListening ? 'text-red-500 animate-pulse' : 'text-slate-500'
                                    }`}>
                                    {processing ? 'Processing Answer...' :
                                        isSpeaking ? 'AI is Speaking...' :
                                            isListening ? 'Listening to You...' : 'Waiting...'}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {isListening ? 'Speak naturally. Pausing for 4s auto-submits.' :
                                        isSpeaking ? 'Listen to the question carefully.' : ''}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-2">
                            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Completed</Badge>
                            <h3 className="text-xl font-bold text-white">Interview Complete!</h3>
                            <p className="text-slate-400 text-sm">Your responses have been saved.</p>
                            <Button onClick={() => router.push('/candidate/interviews')} className="mt-4 rounded-xl">Back to Dashboard</Button>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Live Transcript */}
            <div className="w-1/2 flex flex-col bg-slate-50">
                <div className="p-6 border-b bg-white flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{interview?.job?.title || "AI Interview Room"}</h2>
                        <p className="text-sm text-slate-500">Live Transcript</p>
                    </div>
                    {status === "Connected" && (
                        <Badge variant="outline" className="rounded-full px-4 py-1 border-green-200 text-green-700 bg-green-50">
                            Live
                        </Badge>
                    )}
                </div>

                <ScrollArea className="flex-1 p-8">
                    <div className="max-w-2xl mx-auto space-y-8">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center space-y-4">
                                <AlertCircle size={40} className="opacity-20" />
                                <p>Connect the call to begin the interview transcript.</p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.speaker === 'Candidate' ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-2 mb-1.5 px-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        {msg.speaker === 'AI' ? 'AI Interviewer' : 'You'}
                                    </span>
                                    <span className="text-[10px] text-slate-300">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className={`max-w-[85%] rounded-2xl p-5 shadow-sm text-base leading-relaxed ${msg.speaker === 'Candidate'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                    }`}>
                                    <p>{msg.message}</p>
                                </div>
                            </div>
                        ))}

                        {/* Live voice ghosting */}
                        {liveText && !processing && (
                            <div className="flex flex-col items-end">
                                <div className="max-w-[85%] rounded-2xl p-5 bg-blue-50 border border-blue-200 text-blue-600 rounded-tr-none">
                                    <p>{liveText}<span className="inline-block w-0.5 h-4 bg-blue-400 ml-1 animate-ping">|</span></p>
                                </div>
                                <p className="text-[10px] text-blue-400 mt-1 italic">Live voice input...</p>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* Text input fallback */}
                {status === "Connected" && (
                    <div className="p-5 bg-white border-t border-slate-200">
                        <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-2xl">
                            <input
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !processing && handleAnswerSubmit()}
                                placeholder={isListening ? "Listening... or type here" : "Type your answer or use the mic →"}
                                disabled={processing}
                                className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-slate-700 placeholder:text-slate-400 outline-none"
                            />
                            <Button
                                onClick={handleAnswerSubmit}
                                disabled={processing || !answerText.trim()}
                                size="icon"
                                className="rounded-xl bg-blue-600 hover:bg-blue-700 h-10 w-10 shrink-0"
                            >
                                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                            </Button>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center mt-2 uppercase tracking-tighter">
                            {isListening ? 'Silence for 4s auto-submits • or click ✓ to submit now' : 'Press Enter or ✓ to submit'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
