"use client"

import { AIAnalyticsCharts } from "@/components/dashboard/AIAnalyticsCharts";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentCandidates } from "@/components/dashboard/RecentCandidates";
import { Users, Video, Brain, Briefcase } from "lucide-react";
import LiveInterviews from "@/components/dashboard/LiveInterviews";
import { motion } from "framer-motion";

export function RecruiterDashboardContent({ initialMetrics }: { initialMetrics: any }) {
    // Use initialMetrics if provided, otherwise fallback to zeros (though server should provide them)
    const metrics = initialMetrics || {
        totalCandidates: 0,
        activeJobs: 0,
        completedInterviews: 0,
        averageScore: 0,
        trends: {
            candidates: { value: 0, label: "from last month", positive: true },
            interviews: { value: 0, label: "from last month", positive: true },
            score: { value: 0, label: "improvement", positive: true },
            acceptance: { value: 0, label: "from last month", positive: false }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-1 flex-col gap-4 p-4 pt-0"
        >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Candidates"
                    value={metrics.totalCandidates}
                    description="Candidates in pipeline"
                    icon={Users}
                    trend={metrics.trends?.candidates}
                    loading={false}
                />
                <MetricCard
                    title="Active Jobs"
                    value={metrics.activeJobs}
                    description="Open positions"
                    icon={Briefcase}
                    loading={false}
                />
                <MetricCard
                    title="Completed Interviews"
                    value={metrics.completedInterviews}
                    description="Total interviews conducted"
                    icon={Video}
                    trend={metrics.trends?.interviews}
                    loading={false}
                />
                <MetricCard
                    title="Average AI Score"
                    value={metrics.averageScore}
                    description="Across all roles"
                    icon={Brain}
                    trend={metrics.trends?.score}
                    loading={false}
                />
            </div>

            <LiveInterviews />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 lg:col-span-7">
                    <AIAnalyticsCharts />
                </div>
            </div>
            <RecentCandidates />
        </motion.div>
    );
}
