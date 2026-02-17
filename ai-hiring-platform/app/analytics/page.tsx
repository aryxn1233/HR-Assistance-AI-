import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { Users, TrendingUp, Clock, Target } from "lucide-react"

export default function AnalyticsPage() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Hired"
                    value="95"
                    description="YTD"
                    icon={Users}
                    trend={{ value: 15, label: "vs last year", positive: true }}
                />
                <MetricCard
                    title="Active Pipeline"
                    value="350"
                    description="Across all roles"
                    icon={Target}
                />
                <MetricCard
                    title="Avg Time to Hire"
                    value="18 days"
                    description="Reduced by 2 days"
                    icon={Clock}
                    trend={{ value: 10, label: "from last quarter", positive: true }}
                />
                <MetricCard
                    title="Offer Acceptance"
                    value="82%"
                    description="Above industry avg"
                    icon={TrendingUp}
                    trend={{ value: 4, label: "increase", positive: true }}
                />
            </div>
            <AnalyticsCharts />
        </div>
    )
}
