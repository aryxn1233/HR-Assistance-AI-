"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Briefcase, Video, Brain, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import api from "@/lib/api"

export function StatsCards() {
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/candidates/stats')
                setData(response.data)
            } catch (error) {
                console.error("Failed to fetch stats", error)
            }
        }
        fetchStats()
    }, [])

    const stats = [
        {
            title: "Total Applications",
            value: data?.totalApplications || "0",
            icon: Briefcase,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            title: "Interviews Completed",
            value: data?.interviewsCompleted || "0",
            icon: Video,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
        {
            title: "Average AI Score",
            value: data?.avgScore || "0",
            icon: Brain,
            color: "text-green-500",
            bg: "bg-green-500/10",
        },
        {
            title: "Profile Strength",
            value: `${data?.profileStrength || 50}%`,
            icon: Zap,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
        },
    ]
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    )
}
