"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/auth-context"
import { useEffect, useState } from "react"
import api from "@/lib/api"

export function HeroSection() {
    const { user } = useAuth()
    const name = user?.firstName || "Alex"
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
        { label: "Under Review", count: stats?.statusCounts?.underReview || 0, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
        { label: "Shortlisted", count: stats?.statusCounts?.shortlisted || 0, color: "bg-green-500/10 text-green-500 border-green-500/20" },
        { label: "Interview Scheduled", count: stats?.statusCounts?.interviewScheduled || 0, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    ]

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-2">
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
                    You have {stats?.totalApplications || 0} active applications and {stats?.statusCounts?.interviewScheduled || 0} interview scheduled for this week.
                </motion.p>
            </div>

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
