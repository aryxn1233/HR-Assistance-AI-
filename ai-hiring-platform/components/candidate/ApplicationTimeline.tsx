import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import api from "@/lib/api"

export function ApplicationTimeline() {
    const [latestApp, setLatestApp] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLatest = async () => {
            try {
                const response = await api.get('/candidates/applications')
                if (response.data && response.data.length > 0) {
                    // Sort by date and take most recent
                    const sorted = response.data.sort((a: any, b: any) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                    setLatestApp(sorted[0])
                }
            } catch (error) {
                console.error("Failed to fetch latest application", error)
            } finally {
                setLoading(false)
            }
        }
        fetchLatest()
    }, [])

    const getSteps = (status: string) => {
        const baseSteps = [
            { title: "Applied", completed: true, current: false },
            { title: "Screening", completed: false, current: false },
            { title: "Interview", completed: false, current: false },
            { title: "Review", completed: false, current: false },
            { title: "Result", completed: false, current: false },
        ]

        if (status === 'interview_eligible') {
            baseSteps[1].completed = true;
            baseSteps[2].current = true;
        } else if (status === 'interviewed') {
            baseSteps[1].completed = true;
            baseSteps[2].completed = true;
            baseSteps[3].current = true;
        } else if (status === 'selected' || status === 'hold' || status === 'rejected_post_interview') {
            baseSteps[1].completed = true;
            baseSteps[2].completed = true;
            baseSteps[3].completed = true;
            baseSteps[4].completed = true;
        } else if (status === 'rejected' || status === 'rejected_ai') {
            baseSteps[1].completed = false;
            baseSteps[1].current = true;
            baseSteps[1].title = "Rejected";
        } else {
            baseSteps[1].current = true;
        }

        return baseSteps;
    }

    if (loading) return <Card className="rounded-2xl border-none shadow-sm h-full flex items-center justify-center py-20"><Loader2 className="animate-spin" /></Card>
    if (!latestApp) return <Card className="rounded-2xl border-none shadow-sm h-full p-8 text-center text-muted-foreground italic">No active application timeline.</Card>

    const steps = getSteps(latestApp.status);

    return (
        <Card className="rounded-2xl border-none shadow-sm h-full">
            <CardHeader>
                <CardTitle className="text-lg font-bold">Latest Application Progress</CardTitle>
                <p className="text-sm text-muted-foreground">{latestApp.job?.title || "Position"} {latestApp.job?.department ? `@ ${latestApp.job.department}` : ""}</p>
            </CardHeader>
            <CardContent>
                <div className="relative flex justify-between items-start mt-4">
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted z-0 mx-6" />

                    {steps.map((step, index) => (
                        <div key={step.title} className="relative z-10 flex flex-col items-center gap-3">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors ${step.completed
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : step.current
                                        ? "bg-background border-primary text-primary animate-pulse"
                                        : "bg-background border-muted text-muted-foreground"
                                    }`}
                            >
                                {step.completed ? (
                                    <Check className="h-4 w-4 stroke-[3px]" />
                                ) : (
                                    <span className="text-xs font-bold">{index + 1}</span>
                                )}
                            </motion.div>
                            <div className="text-center space-y-0.5">
                                <p className={`text-[10px] font-bold ${step.current ? "text-primary" : "text-foreground"}`}>
                                    {step.title}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
