"use client"

import { AIAnalyticsCharts } from "@/components/dashboard/AIAnalyticsCharts";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentCandidates } from "@/components/dashboard/RecentCandidates";
import { Users, Video, Brain, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
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
          value="1,284"
          description="Candidates in pipeline"
          icon={Users}
          trend={{ value: 12, label: "from last month", positive: true }}
        />
        <MetricCard
          title="Interviews Completed"
          value="432"
          description="This month"
          icon={Video}
          trend={{ value: 8, label: "from last month", positive: true }}
        />
        <MetricCard
          title="Average AI Score"
          value="84"
          description="Across all roles"
          icon={Brain}
          trend={{ value: 2, label: "improvement", positive: true }}
        />
        <MetricCard
          title="Joining Probability"
          value="78%"
          description="Predicted acceptance rate"
          icon={TrendingUp}
          trend={{ value: 5, label: "from last month", positive: false }}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 lg:col-span-7">
          <AIAnalyticsCharts />
        </div>
      </div>
      <RecentCandidates />
    </motion.div>
  );
}
