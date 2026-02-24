"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/auth-context"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Video, ArrowRight, Zap } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
    const { user } = useAuth()
    const name = user?.firstName || "User"
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/candidates/stats')
                setStats(response.data)
            } catch (error) {
                console.error("Failed to fetch stats", error)
            }
        }
        fetchStats()
    }, [])

    const statuses = [
        { label: "Applied", count: stats?.statusCounts?.underReview || 0, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
        { label: "Eligible for Interview", count: stats?.statusCounts?.eligible || 0, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
        { label: "Interviewing", count: stats?.statusCounts?.interviews || 0, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
        { label: "Selected", count: stats?.statusCounts?.selected || 0, color: "bg-green-500/10 text-green-500 border-green-500/20" },
    ]

    const hasEligible = (stats?.statusCounts?.eligible || 0) > 0;

    return (
        <section className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl font-bold tracking-tight"
                    >
                        Welcome back, {name} 👋
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground"
                    >
                        You have {stats?.totalApplications || 0} active applications focus on.
                    </motion.p>
                </div>

                {hasEligible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                    >
                        <Link href="/candidate/interviews">
                            <button className="flex items-center gap-3 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-primary/30 hover:shadow-primary/40 transition-all hover:scale-105 group">
                                <div className="p-1.5 bg-white/20 rounded-lg">
                                    <Video className="h-5 w-5" />
                                </div>
                                <span>Start Your AI Interview</span>
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                    </motion.div>
                )}
            </div>

            {hasEligible && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-yellow-500/10 to-primary/10 border border-yellow-500/20 p-4 rounded-2xl flex items-center gap-4"
                >
                    <div className="h-10 w-10 rounded-xl bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                        <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">Action Required: Interview Ready</p>
                        <p className="text-xs text-muted-foreground">You are eligible for {stats.statusCounts.eligible} interview(s). Start now to proceed.</p>
                    </div>
                </motion.div>
            )}

            <div className="flex flex-wrap gap-3">
                {statuses.map((status, index) => (
                    <motion.div
                        key={status.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + (index * 0.1) }}
                    >
                        <Badge variant="outline" className={`px-4 py-1.5 rounded-full text-sm font-medium ${status.color}`}>
                            {status.label}: {status.count}
                        </Badge>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}
