"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Users, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

export default function OnboardingPage() {
    const { user, isLoaded } = useUser()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!isLoaded || !user) return

        if (user?.unsafeMetadata?.role) {
            router.push("/")
            return
        }

        const role = searchParams.get('role') as 'candidate' | 'recruiter'
        if (role && (role === 'candidate' || role === 'recruiter')) {
            selectRole(role)
        }
    }, [isLoaded, user, searchParams, router])

    const selectRole = async (role: 'candidate' | 'recruiter') => {
        if (!user) return
        setLoading(true)
        try {
            await user.update({
                unsafeMetadata: {
                    ...user.unsafeMetadata,
                    role: role
                }
            })
            router.push("/")
        } catch (error) {
            console.error("Failed to update role", error)
        } finally {
            setLoading(false)
        }
    }

    if (!isLoaded || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Welcome to HireMe</h1>
                    <p className="text-muted-foreground italic">One last step to get you started</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recruiter Card */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Card
                            className="cursor-pointer border-2 hover:border-primary transition-colors h-full"
                            onClick={() => selectRole('recruiter')}
                        >
                            <CardHeader className="text-center">
                                <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                    <Briefcase className="h-8 w-8 text-primary" />
                                </div>
                                <CardTitle>I'm a Recruiter</CardTitle>
                                <CardDescription>I want to hire top talent and automate my interview process.</CardDescription>
                            </CardHeader>
                        </Card>
                    </motion.div>

                    {/* Candidate Card */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Card
                            className="cursor-pointer border-2 hover:border-primary transition-colors h-full"
                            onClick={() => selectRole('candidate')}
                        >
                            <CardHeader className="text-center">
                                <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                    <Users className="h-8 w-8 text-primary" />
                                </div>
                                <CardTitle>I'm a Candidate</CardTitle>
                                <CardDescription>I want to find my dream job and showcase my skills.</CardDescription>
                            </CardHeader>
                        </Card>
                    </motion.div>
                </div>

                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        By selecting a role, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    )
}
