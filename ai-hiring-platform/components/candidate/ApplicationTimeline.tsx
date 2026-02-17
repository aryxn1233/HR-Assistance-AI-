"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import { motion } from "framer-motion"

const steps = [
    { title: "Applied", date: "Feb 12", completed: true, current: false },
    { title: "Screening", date: "Feb 14", completed: true, current: false },
    { title: "Interview", date: "Feb 16", completed: false, current: true },
    { title: "Final Review", date: "Pending", completed: false, current: false },
    { title: "Offer", date: "Pending", completed: false, current: false },
]

export function ApplicationTimeline() {
    return (
        <Card className="rounded-2xl border-none shadow-sm h-full">
            <CardHeader>
                <CardTitle className="text-lg font-bold">Active Application Progress</CardTitle>
                <p className="text-sm text-muted-foreground">Senior Product Designer @ Meta</p>
            </CardHeader>
            <CardContent>
                <div className="relative flex justify-between items-start mt-4">
                    {/* Progress Bar */}
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
                                <p className={`text-xs font-bold ${step.current ? "text-primary" : "text-foreground"}`}>
                                    {step.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground">{step.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
