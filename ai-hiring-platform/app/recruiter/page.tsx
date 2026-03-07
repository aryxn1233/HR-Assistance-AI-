"use client"

import { useEffect, useState } from "react";
import { AIAnalyticsCharts } from "@/components/dashboard/AIAnalyticsCharts";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentCandidates } from "@/components/dashboard/RecentCandidates";
import { Users, Video, Brain, TrendingUp, Loader2 } from "lucide-react";
import LiveInterviews from "@/components/dashboard/LiveInterviews";
import { motion } from "framer-motion";
import api from "@/lib/api";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await api.get('/analytics/dashboard');
        setMetrics(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard metrics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

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
          value={metrics.totalCandidates.toString()}
          description="Candidates in pipeline"
          icon={Users}
          trend={metrics.trends?.candidates}
        />
        <MetricCard
          title="Active Jobs"
          value={metrics.activeJobs.toString()}
          description="Open positions"
          icon={Video} // Maybe better icon? Briefcase is better but using what was there for now or lucide-react Briefcase
          trend={{ value: 0, label: "new", positive: true }}
        />
        <MetricCard
          title="Completed Interviews"
          value={metrics.completedInterviews.toString()}
          description="Total interviews Conducted"
          icon={Video}
          trend={metrics.trends?.interviews}
        />
        <MetricCard
          title="Average AI Score"
          value={metrics.averageScore.toString()}
          description="Across all roles"
          icon={Brain}
          trend={metrics.trends?.score}
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
