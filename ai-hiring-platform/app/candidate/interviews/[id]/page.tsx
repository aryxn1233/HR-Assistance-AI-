"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Mic,
    Video as VideoIcon,
    VideoOff,
    MicOff,
    Send,
    Timer,
    Brain,
    Zap,
    Play,
    ChevronRight,
    CheckCircle2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function CandidateInterviewRoom({ params }: { params: { id: string } }) {
    const [isStarted, setIsStarted] = useState(false)
    const [isFinished, setIsFinished] = useState(false)
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [timeLeft, setTimeLeft] = useState(180) // 3 mins per question
    const [micEnabled, setMicEnabled] = useState(true)
    const [videoEnabled, setVideoEnabled] = useState(true)

    const questions = [
        "Tell us about a time you had to lead a complex project under a tight deadline. How did you manage the team's expectations?",
        "How do you handle disagreements within a cross-functional team, specifically when it comes to technical architecture?",
        "Describe your process for identifying and mitigating risks in a new product launch.",
        "What is your approach to mentoring junior designers and how do you ensure their long-term growth?",
        "Where do you see the intersection of AI and Product Design evolving in the next 5 years?"
    ]

    useEffect(() => {
        let timer: NodeJS.Timeout
        if (isStarted && !isFinished && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
        } else if (timeLeft === 0) {
            handleNext()
        }
        return () => clearInterval(timer)
    }, [isStarted, isFinished, timeLeft])

    const handleStart = () => setIsStarted(true)

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1)
            setTimeLeft(180)
        } else {
            setIsFinished(true)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`
    }

    if (isFinished) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto space-y-8 py-12"
            >
                <div className="text-center space-y-4">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-500 mb-4">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Interview Completed!</h1>
                    <p className="text-xl text-muted-foreground">Great job! The AI has analyzed your responses. Here is your preliminary breakdown.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: "Communication", score: 92, icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { label: "Confidence", score: 88, icon: Play, color: "text-purple-500", bg: "bg-purple-500/10" },
                        { label: "Technical", score: 85, icon: Brain, color: "text-green-500", bg: "bg-green-500/10" },
                        { label: "Overall Rating", score: 88, icon: CheckCircle2, color: "text-amber-500", bg: "bg-amber-500/10" },
                    ].map((stat) => (
                        <Card key={stat.label} className="border-none shadow-sm rounded-2xl overflow-hidden p-6 text-center">
                            <div className={`mx-auto h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center mb-4`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                            <p className="text-3xl font-bold">{stat.score}</p>
                        </Card>
                    ))}
                </div>

                <div className="flex justify-center gap-4 pt-8">
                    <Button variant="outline" className="rounded-xl h-12 px-8 font-bold" asChild>
                        <a href="/candidate">Back to Dashboard</a>
                    </Button>
                    <Button className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20" asChild>
                        <a href="/candidate/reports">View Detailed Report</a>
                    </Button>
                </div>
            </motion.div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-primary text-primary-foreground p-2 rounded-xl">
                        <VideoIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Senior Product Designer Interview</h1>
                        <p className="text-sm text-muted-foreground">Meta • AI Video Interview Session</p>
                    </div>
                </div>
                {isStarted && (
                    <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-full shadow-sm border border-primary/20">
                        <Timer className="h-4 w-4 text-primary animate-pulse" />
                        <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
                    </div>
                )}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left: AI Question & Controls */}
                <div className="lg:col-span-2 space-y-6">
                    <AnimatePresence mode="wait">
                        {!isStarted ? (
                            <motion.div
                                key="intro"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="h-[500px] flex items-center justify-center"
                            >
                                <Card className="max-w-md w-full border-none shadow-xl rounded-3xl p-8 text-center space-y-6">
                                    <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Brain className="h-10 w-10 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold">Ready to start?</h2>
                                    <p className="text-muted-foreground">
                                        This interview consists of 5 questions. You will have 3 minutes to answer each. Ensure your camera and mic are working.
                                    </p>
                                    <Button onClick={handleStart} className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 group">
                                        Start Interview
                                        <Play className="ml-2 h-5 w-5 fill-current group-hover:scale-110 transition-transform" />
                                    </Button>
                                </Card>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="question"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <Card className="border-none shadow-lg rounded-3xl bg-primary text-primary-foreground p-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 transform scale-150 rotate-12">
                                        <Brain className="h-32 w-32" />
                                    </div>
                                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md mb-6 px-3 py-1 font-bold">
                                        Question {currentQuestion + 1} of {questions.length}
                                    </Badge>
                                    <h2 className="text-3xl font-medium leading-relaxed mb-4">
                                        {questions[currentQuestion]}
                                    </h2>
                                    <div className="flex gap-2">
                                        <motion.div
                                            animate={{ width: ["0%", "100%"] }}
                                            transition={{ duration: 180, ease: "linear" }}
                                            className="h-1 bg-white/30 rounded-full w-full"
                                        />
                                    </div>
                                </Card>

                                <div className="flex justify-between items-center bg-card p-6 rounded-3xl shadow-sm border">
                                    <div className="flex gap-3">
                                        <Button
                                            variant={micEnabled ? "outline" : "destructive"}
                                            size="icon"
                                            className="h-12 w-12 rounded-2xl transition-all"
                                            onClick={() => setMicEnabled(!micEnabled)}
                                        >
                                            {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                                        </Button>
                                        <Button
                                            variant={videoEnabled ? "outline" : "destructive"}
                                            size="icon"
                                            className="h-12 w-12 rounded-2xl transition-all"
                                            onClick={() => setVideoEnabled(!videoEnabled)}
                                        >
                                            {videoEnabled ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                                        </Button>
                                    </div>

                                    <Button onClick={handleNext} className="h-12 px-8 rounded-2xl font-bold group">
                                        {currentQuestion === questions.length - 1 ? "Submit Interview" : "Next Question"}
                                        <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right: Camera Feed & Status */}
                <div className="space-y-6">
                    <Card className="border-none shadow-lg rounded-3xl overflow-hidden aspect-[4/3] relative bg-black flex items-center justify-center">
                        {videoEnabled ? (
                            <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center">
                                <span className="text-slate-400 text-sm font-medium animate-pulse">Camera Feed Active...</span>
                                {/* Mock User Silhouette */}
                                <div className="absolute inset-0 flex items-end justify-center pointer-events-none opacity-20">
                                    <div className="w-32 h-32 rounded-full bg-white mb-2" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-slate-500">
                                <VideoOff className="h-12 w-12" />
                                <span className="text-sm">Video feed paused</span>
                            </div>
                        )}
                        <Badge className="absolute top-4 left-4 bg-red-500 border-none px-2 py-0.5 animate-pulse font-bold text-[10px]">
                            LIVE
                        </Badge>
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white/70 text-[10px] font-bold tracking-widest uppercase">
                            <span>ISO 800</span>
                            <span>f/2.8</span>
                            <span>1/60</span>
                        </div>
                    </Card>

                    <Card className="border-none shadow-sm rounded-3xl p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-bold">Session Tips</span>
                        </div>
                        <ul className="text-xs space-y-3 text-muted-foreground list-disc pl-4">
                            <li>Maintain eye contact with the camera.</li>
                            <li>Speak clearly and at a moderate pace.</li>
                            <li>Keep your answers concise but comprehensive.</li>
                            <li>Ensure you are in a well-lit environment.</li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    )
}
