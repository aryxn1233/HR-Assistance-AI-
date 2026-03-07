"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Video, User, ArrowRight, Loader2, Signal } from "lucide-react"
import Link from "next/link"
import api from "@/lib/api"
import { getFreshToken } from "@/lib/tokenManager"
import { io, Socket } from "socket.io-client"

interface ActiveInterview {
    interviewId: string
    candidateName: string
    jobRole: string
    startedAt: string
    status: string
}

export default function LiveInterviews() {
    const [activeInterviews, setActiveInterviews] = useState<ActiveInterview[]>([])
    const [loading, setLoading] = useState(true)
    const [socket, setSocket] = useState<Socket | null>(null)

    useEffect(() => {
        const fetchActive = async () => {
            try {
                const response = await api.get('/interview-agent/active')
                setActiveInterviews(response.data)
            } catch (error) {
                console.error("Failed to fetch active interviews", error)
            } finally {
                setLoading(false)
            }
        }

        fetchActive()

        let activeSocket: any = null

        const connectSocket = async () => {
            const token = await getFreshToken()
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003').replace(/\/api$/, '')
            activeSocket = io(`${baseUrl}/recruiter-monitor`, {
                auth: { token },
                transports: ['websocket']
            })

            activeSocket.on('connect', () => {
                console.log('Socket: Connected to recruiter monitor')
            })

            activeSocket.on('interview:started', (data: ActiveInterview) => {
                setActiveInterviews(prev => {
                    if (prev.find(i => i.interviewId === data.interviewId)) return prev
                    return [data, ...prev]
                })
            })

            activeSocket.on('interview:status', (data: { interviewId: string, status: string }) => {
                if (data.status === 'completed' || data.status === 'terminated' || data.status === 'FAILED_INTERVIEW') {
                    setActiveInterviews(prev => prev.filter(i => i.interviewId !== data.interviewId))
                }
            })

            setSocket(activeSocket)
        }

        connectSocket()

        return () => {
            if (activeSocket) activeSocket.disconnect()
        }
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center p-8 bg-slate-50/50 rounded-3xl border-2 border-dashed">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
    )

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Signal className="h-5 w-5 text-red-500 animate-pulse" />
                    <h2 className="text-xl font-bold">Live Interviews</h2>
                </div>
                {activeInterviews.length > 0 && (
                    <Badge variant="outline" className="rounded-full bg-red-50 text-red-600 border-red-100 font-bold px-3">
                        {activeInterviews.length} ACTIVE NOW
                    </Badge>
                )}
            </div>

            <AnimatePresence mode="popLayout">
                {activeInterviews.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-12 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200"
                    >
                        <Video className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                        <h3 className="font-bold text-slate-400">No live sessions currently</h3>
                        <p className="text-sm text-slate-400">Interviews will appear here in real-time when candidates start them.</p>
                    </motion.div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {activeInterviews.map((interview) => (
                            <motion.div
                                key={interview.interviewId}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <Card className="border-none shadow-sm rounded-2xl ring-1 ring-red-100 overflow-hidden hover:shadow-md transition-all">
                                    <CardHeader className="p-4 bg-red-50/50 pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-primary font-bold shadow-sm">
                                                    {interview.candidateName?.[0] || <User size={18} />}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-sm">{interview.candidateName}</CardTitle>
                                                    <CardDescription className="text-[10px] font-medium">{interview.jobRole}</CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Started {new Date(interview.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <Button size="sm" variant="default" className="bg-red-600 hover:bg-red-700 text-white rounded-full px-4 text-xs font-bold gap-2 shadow-lg shadow-red-200" asChild>
                                            <Link href={`/recruiter/monitor/${interview.interviewId}`}>
                                                Watch Live <ArrowRight size={14} />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </section>
    )
}
