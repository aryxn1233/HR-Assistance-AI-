"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { CheckCircle2, Calendar, Video, Clock, Loader2, ArrowUpRight, Zap } from "lucide-react"

export function RecentActivity() {
    const [activities, setActivities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const response = await api.get('/candidates/applications')
                const active = response.data.map((app: any) => {
                    const isEligible = app.status === 'interview_eligible';
                    return {
                        id: app.id,
                        title: isEligible ? `Eligible for Interview: ${app.job?.title}` : `Applied for ${app.job?.title}`,
                        company: app.job?.department || "",
                        time: new Date(app.createdAt).toLocaleDateString(),
                        icon: isEligible ? Zap : CheckCircle2,
                        color: isEligible ? "text-yellow-500" : "text-green-500",
                        bg: isEligible ? "bg-yellow-500/10" : "bg-green-500/10",
                    };
                }).slice(0, 5)
                setActivities(active)
            } catch (error) {
                console.error("Failed to fetch activity", error)
            } finally {
                setLoading(false)
            }
        }
        fetchActivity()
    }, [])

    if (loading) return (
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden h-full">
            <CardHeader>
                <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </CardContent>
        </Card>
    )

    return (
        <Card className="rounded-2xl border-none shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5">
                    View All
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {activities.length > 0 ? activities.map((activity, index) => (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between group cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl ${activity.bg}`}>
                                    <activity.icon className={`h-4 w-4 ${activity.color}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">{activity.title}</p>
                                    <p className="text-xs text-muted-foreground">{activity.company} • {activity.time}</p>
                                </div>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </motion.div>
                    )) : (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                            No recent activity found.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
