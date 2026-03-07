"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Video,
    MessageSquare,
    Loader2,
    X,
    User,
    ShieldAlert,
    Clock,
    Signal,
    Power
} from "lucide-react"
import api from "@/lib/api"
import { getFreshToken } from "@/lib/tokenManager"
import { io, Socket } from "socket.io-client"
import { toast } from "sonner"

export default function RecruiterMonitorPage() {
    const params = useParams()
    const router = useRouter()
    const interviewId = params.id as string

    const [interview, setInterview] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [socket, setSocket] = useState<Socket | null>(null)
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [isTerminating, setIsTerminating] = useState(false)

    const videoRef = useRef<HTMLVideoElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (remoteStream && videoRef.current) {
            videoRef.current.srcObject = remoteStream
        }
    }, [remoteStream])

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await api.get(`/interviews/${interviewId}`)
                setInterview(response.data)
                setMessages(response.data.transcript || [])
            } catch (error) {
                console.error("Failed to fetch interview details", error)
                toast.error("Cloud not find this interview session")
            } finally {
                setLoading(false)
            }
        }

        fetchDetails()

        let activeSocket: any = null

        const connectSocket = async () => {
            const token = await getFreshToken()
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003').replace(/\/api$/, '')
            activeSocket = io(`${baseUrl}/recruiter-monitor`, {
                auth: { token },
                transports: ['websocket']
            })

            activeSocket.on('connect', () => {
                console.log('Socket: Connected as recruiter')
                activeSocket.emit('join-room', { interviewId, role: 'recruiter' })
            })

            activeSocket.on('candidate-offer', async (data: any) => {
                console.log('Socket: Received offer from candidate')
                const pc = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                })

                pc.ontrack = (event) => {
                    console.log('WebRTC: Received remote track')
                    setRemoteStream(event.streams[0])
                }

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        activeSocket.emit('ice-candidate', { interviewId, candidate: event.candidate })
                    }
                }

                await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
                const answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)

                activeSocket.emit('recruiter-answer', { interviewId, answer })
                setPeerConnection(pc)
            })

            activeSocket.on('ice-candidate', async (data: any) => {
                if (peerConnection) {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
                }
            })

            activeSocket.on('interview:question', (data: any) => {
                setMessages(prev => [...prev, { speaker: 'AI', message: msgText(data), timestamp: new Date() }])
            })

            activeSocket.on('interview:answer', (data: any) => {
                setMessages(prev => [...prev, { speaker: 'Candidate', message: msgText(data), timestamp: new Date() }])
            })

            activeSocket.on('interview:status', (data: any) => {
                if (data.status === 'completed' || data.status === 'terminated' || data.status === 'FAILED_INTERVIEW') {
                    toast.info(`Interview has ended: ${data.status}`)
                    setTimeout(() => router.push('/recruiter/interviews'), 2000)
                }
            })

            setSocket(activeSocket)
        }

        const msgText = (data: any) => data.text || data.question || data.answer || ""

        connectSocket()

        return () => {
            if (activeSocket) activeSocket.disconnect()
            peerConnection?.close()
        }
    }, [interviewId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleTerminate = async () => {
        if (!confirm("Are you sure you want to manually end this interview?")) return
        setIsTerminating(true)
        try {
            await api.post(`/interview-agent/${interviewId}/terminate`, {
                reason: 'RECRUITER_MANUAL_TERMINATION',
                message: 'This interview has been ended by the recruiter. You will be redirected shortly.'
            })
            toast.success("Interview terminated session")
            router.push('/recruiter/interviews')
        } catch (error) {
            console.error("Failed to terminate", error)
            toast.error("Failed to terminate interview")
        } finally {
            setIsTerminating(false)
        }
    }

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-slate-900">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )

    return (
        <div className="flex flex-col h-screen bg-[#0a0f1c] text-slate-200">
            {/* Top Navigation Bar */}
            <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0a0f1c]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-2xl hover:bg-white/5 text-slate-400">
                        <X size={20} />
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold tracking-tight">Live Interview Monitor</h1>
                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 rounded-full flex items-center gap-1.5 px-3 py-1 animate-pulse">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                LIVE
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Session ID: {interviewId}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                        <Signal size={14} className="text-green-500" />
                        <span className="text-xs font-bold text-slate-400">Stable Connection</span>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={handleTerminate}
                        disabled={isTerminating}
                        className="rounded-2xl h-12 px-6 bg-red-600 hover:bg-red-700 font-bold shadow-xl shadow-red-900/20 flex gap-2"
                    >
                        {isTerminating ? <Loader2 className="animate-spin h-4 w-4" /> : <Power size={18} />}
                        Terminate Interview
                    </Button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Left Side: Video & Stats */}
                <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto">
                    {/* Live Stream Card */}
                    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-black overflow-hidden aspect-video relative ring-1 ring-white/10">
                        {!remoteStream && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
                                <Video size={64} className="text-slate-700 mb-4 animate-pulse" />
                                <p className="text-slate-500 font-bold">Waiting for candidate video stream...</p>
                            </div>
                        )}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-8 left-8 flex items-center gap-3">
                            <div className="px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                                    Candidate Active
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Meta Info Grid */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="border-none shadow-sm rounded-3xl bg-white/5 border border-white/10 p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-2xl">
                                    <User size={20} className="text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Candidate</p>
                                    <p className="font-bold text-white">{interview?.candidate?.user?.firstName} {interview?.candidate?.user?.lastName}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="border-none shadow-sm rounded-3xl bg-white/5 border border-white/10 p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-purple-500/10 rounded-2xl">
                                    <ShieldAlert size={20} className="text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</p>
                                    <p className="font-bold text-white">{interview?.job?.title}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="border-none shadow-sm rounded-3xl bg-white/5 border border-white/10 p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-orange-500/10 rounded-2xl">
                                    <Clock size={20} className="text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Elapsed Time</p>
                                    <p className="font-bold text-white">Live Session</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Right Side: Live Transcript */}
                <aside className="w-[450px] border-l border-white/5 bg-[#0a0f1c] flex flex-col">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-500/10 rounded-xl">
                                <MessageSquare size={18} className="text-blue-500" />
                            </div>
                            <h2 className="font-bold text-lg text-white">Live Transcript</h2>
                        </div>
                        <Badge variant="outline" className="rounded-full border-white/10 text-slate-400">Real-time sync</Badge>
                    </div>

                    <ScrollArea className="flex-1 p-8">
                        <div className="space-y-8">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 opacity-30">
                                    <MessageSquare size={40} />
                                    <p className="text-sm font-medium">Listening for live dialogue...</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: msg.speaker === 'Candidate' ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex flex-col ${msg.speaker === 'Candidate' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
                                                {msg.speaker === 'AI' ? 'Alex (Interviewer)' : 'Candidate'}
                                            </span>
                                        </div>
                                        <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${msg.speaker === 'Candidate'
                                            ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-900/20'
                                            : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none'
                                            }`}>
                                            {msg.message}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>
                </aside>
            </main>
        </div>
    )
}
