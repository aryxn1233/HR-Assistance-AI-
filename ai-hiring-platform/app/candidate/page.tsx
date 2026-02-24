"use client"

import { HeroSection } from "@/components/candidate/HeroSection"
import { StatsCards } from "@/components/candidate/StatsCards"
import { ApplicationTimeline } from "@/components/candidate/ApplicationTimeline"
import { RecentActivity } from "@/components/candidate/RecentActivity"
import { motion } from "framer-motion"

import { ApplicationsList } from "@/components/candidate/ApplicationsList"

export default function CandidateDashboardPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <HeroSection />
            <StatsCards />

            <div className="grid gap-6 lg:grid-cols-2">
                <ApplicationsList />
                <div className="space-y-6">
                    <ApplicationTimeline />
                    <RecentActivity />
                </div>
            </div>

            {/* Additional content could go here, like Recommended Jobs or Tips */}
        </motion.div>
    )
}
